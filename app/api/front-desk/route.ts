import pool from "@/lib/db";
import {
  fetchAllAdmins,
  sendAdminSessionEnrollmentEmail,
  sendCoachPlayerEnrollmentEmail,
} from "@/lib/email-templates";
import { sendPaymentReciept } from "@/lib/notification-service";
import { sendInAppNotificationBackend } from "@/lib/send-inapp-notification";
import { TriggerFirebaseApprovals } from "@/lib/triggerFirebase";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await pool.query(`SELECT
    fda.id,
    s.name AS session_name,
    u.first_name || ' ' || u.last_name AS player_name,
    s.date,
    s.end_date,
    s.start_time,
    s.end_time,
    fda.price,
    fda.referal_code,
    fda.action,
    fda.status
FROM front_desk_actions fda
JOIN sessions s ON fda.session_id = s.id
JOIN users u ON fda.user_id = u.id
ORDER by fda.created_at DESC
;`);
    return NextResponse.json(response.rows, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error?.message || "Server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get(`type`);
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 },
      );
    }

    if (!["waiting", "accepted", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    const result = await pool.query(
      `
      UPDATE front_desk_actions
      SET status = $1
      WHERE id = $2
      RETURNING *;
      `,
      [status, id],
    );
    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: "Record not found" }), {
        status: 404,
      });
    }

    const updatingRow = result.rows?.[0] ?? null;
    if (updatingRow) {
      if (type === "cash" || type === "approval") {
        const user_id = updatingRow?.user_id;
        const session_id = updatingRow?.session_id;
        let amount = Number(updatingRow.price);
        let hasSiblingDiscount = false
        let clientReleased = false;
        const client = await pool.connect();

        try {
          await pool.query("BEGIN");

          /* ---------------- SESSION ---------------- */

          const sessionResult = await client.query(
            `SELECT id, comped, max_players
       FROM sessions
       WHERE id = $1
       FOR UPDATE`,
            [session_id],
          );

          const session = sessionResult.rows?.[0];

          if (!session) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { message: "Session not found" },
              { status: 404 },
            );
          }

          /* ---------------- PLAYER ---------------- */

          const playerResult = await client.query(
            `SELECT id, square_customer_id, square_card_id
       FROM users
       WHERE id = $1`,
            [user_id],
          );

          const player = playerResult.rows?.[0];

          if (!player) {
            await client.query("ROLLBACK");
            return NextResponse.json(
              { message: "Player not found" },
              { status: 404 },
            );
          }

          /* ---------------- CHECK SESSION PLAYER ---------------- */

          const playerCheck = await client.query(
            `SELECT 1 FROM session_players
       WHERE session_id = $1 AND user_id = $2`,
            [session_id, user_id],
          );

          if (playerCheck.rows.length === 0) {
            const countResult = await client.query(
              `SELECT COUNT(*) FROM session_players WHERE session_id = $1`,
              [session_id],
            );

            const currentPlayers = Number(countResult.rows[0].count);
            const maxPlayers = Number(session.max_players);

            if (currentPlayers >= maxPlayers) {
              await client.query("ROLLBACK");
              return NextResponse.json(
                {
                  message: "Max players added in the session can not add more",
                },
                { status: 409 },
              );
            }

            /* ---------------- SIBLING DISCOUNT ---------------- */

            const parent_data = await client.query(
              `SELECT parent_id FROM players WHERE user_id = $1`,
              [user_id],
            );

            const parent_id = parent_data.rows[0]?.parent_id;

            if (parent_id !== null && parent_id !== undefined) {
              const siblings_data = await client.query(
                `SELECT COUNT(*)
                 FROM players
                 WHERE parent_id = $1
                   AND user_id IN (
                     SELECT DISTINCT user_id
                     FROM session_players
                     WHERE session_id = $2
                   )`,
                [parent_id, session_id],
              );

              const siblingCount = parseInt(siblings_data.rows[0].count, 10);

              if (siblingCount >= 1) {
                hasSiblingDiscount = true;
                amount = amount * 0.9;
                // await client.query(
                //   `UPDATE payments
                //    SET amount = amount * 0.9,
                //        siblings_discount = true
                //    WHERE session_id = $1
                //      AND status = 'pending'
                //      AND user_id != $3
                //      AND user_id IN (
                //        SELECT user_id
                //        FROM players
                //        WHERE parent_id = $2
                //      )`,
                //   [session_id, parent_id, user_id]
                // );
              }
            }

            /* ---------------- INSERT PLAYER ---------------- */

            await client.query(
              `INSERT INTO session_players (session_id, user_id)
               VALUES ($1, $2)`,
              [session_id, user_id],
            );


            if (session.comped) {
              await client.query(
                `INSERT INTO payments
                 (session_id, user_id, amount, status, paid_at, method, siblings_discount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                  session_id,
                  user_id,
                  amount,
                  "comped",
                  new Date(),
                  "Nil",
                  hasSiblingDiscount,
                ],
              );
            } else {
              await client.query(
                `INSERT INTO payments
                 (session_id, user_id, amount, status, siblings_discount)
                 VALUES ($1, $2, $3, $4, $5)`,
                [session_id, user_id, amount, "pending", hasSiblingDiscount],
              );
            }
          }

          const paymentResult = await client.query(
            `SELECT status
       FROM payments
       WHERE session_id = $1 AND user_id = $2`,
            [session_id, user_id],
          );
          const payment = paymentResult.rows?.[0];

          if (!payment) {
            throw new Error("Payment record missing");
          }

          await client.query("COMMIT");
          client.release();
          clientReleased = true;
          const EmailDataRaw = await pool.query(
            `SELECT 
  u.first_name,
  u.last_name,
  u.email AS userEmail,
  s.name AS sessionName,
  s.coach_id,
  coach.email AS coachEmail,
  coach.first_name AS coach_first_name,
  coach.last_name AS coach_last_name,
  s.date AS session_start_date,
  s.end_date AS session_end_date,
  NOW() AS enrollmentDate,
  p.parent_id 
FROM session_players se
JOIN users u ON se.user_id = u.id
JOIN sessions s ON se.session_id = s.id
JOIN users coach ON s.coach_id = coach.id
LEFT JOIN players p ON p.user_id = u.id 
WHERE se.session_id = $1
  AND se.user_id = $2;`,
            [session_id, user_id],
          );
          const EmailData = EmailDataRaw.rows[0];

          if (EmailData) {
            const sessionStartDate = EmailData?.session_start_date
              ? moment(EmailData.session_start_date).format("YYYY-MM-DD")
              : "";

            const sessionEndData = EmailData?.session_end_date
              ? moment(EmailData.session_end_date).format("YYYY-MM-DD")
              : "";
            const adminEmailPayload = {
              fullName: `${EmailData?.first_name || ""} ${EmailData?.last_name || ""
                }`,
              userEmail: EmailData.userEmail,
              sessionName: EmailData.sessionName,
              coachName: `${EmailData?.coach_first_name || ""} ${EmailData?.coach_last_name || ""
                }`,
              sessionDate: `${sessionStartDate} - ${sessionEndData}`,
              enrollmentDate: EmailData.enrollmentDate,
            };

            await sendAdminSessionEnrollmentEmail(adminEmailPayload);
            const coachEmailPayload = {
              coachEmail: EmailData.coachEmail,
              coachName: `${EmailData?.coach_first_name || ""} ${EmailData?.coach_last_name || ""
                }`,
              playerName: `${EmailData?.first_name || ""} ${EmailData?.last_name || ""
                }`,
              playerEmail: EmailData.useremail,
              sessionName: EmailData.sessionname,
              sessionDate: `${sessionStartDate} - ${sessionEndData}`,
              enrollmentDate: EmailData.enrollmentdate,
            };

            await sendCoachPlayerEnrollmentEmail(coachEmailPayload);
            const playerName = `${EmailData?.first_name || ""} ${EmailData?.last_name || ""}`;
            const msg = `${playerName} enrolled in ${EmailData.sessionname}.`;

            const admins = await fetchAllAdmins();
            const promises = admins.map(admin =>
              sendInAppNotificationBackend(
                admin.user_id,
                msg,
                `/portal/admin/sessions/${session_id}`
              )
            );

            await Promise.allSettled(promises);
            await sendInAppNotificationBackend(
              EmailData.coach_id,
              msg,
              `/portal/coach/sessions/${session_id}`
            );
            if (EmailData.parent_id) {

              await sendInAppNotificationBackend(
                EmailData.parent_id,
                msg,
                `/portal/parent/sessions/${session_id}`
              );
            }
            await sendInAppNotificationBackend(
              user_id,
              msg,
              `/portal/parent/sessions/${session_id}`
            );


            const paymentStatus = session.comped
              ? "Comped"
              : type === "cash"
                ? "Paid (Cash)"
                : "Pending";

            const discountText = hasSiblingDiscount ? " (Sibling discount)" : "";

            const paymentMsg = `${playerName} payment for ${EmailData.sessionname} ${paymentStatus} - $${amount}${discountText}.`;

            const promises1 = admins.map(admin =>
              sendInAppNotificationBackend(
                admin.user_id,
                paymentMsg,
                `/portal/admin/payments/`
              )
            );
            await Promise.all(promises1);
            if (EmailData.parent_id) {

              await sendInAppNotificationBackend(
                EmailData.parent_id,
                paymentMsg,
                `/portal/parent/sessions/${session_id}`
              );
            }
            await sendInAppNotificationBackend(
              user_id,
              paymentMsg,
              `/portal/parent/sessions/${session_id}`
            );

          }
        } catch (error: any) {
          await client.query("ROLLBACK");
          console.log("Error:", error);
          return NextResponse.json(
            {
              message:
                error?.response?.data?.message ||
                error?.message ||
                "Failed to process payment",
            },
            { status: 500 },
          );
        } finally {
          if (!clientReleased) client.release();
        }
      }

      if (type === "cash") {
        const ret = await pool.query(
          `
          UPDATE payments
          SET method = 'Cash', status = 'paid', paid_at = $1, paid_by = $2, transaction_id = $3
          WHERE user_id = $4 AND session_id = $5 RETURNING *
        `,
          [
            new Date(),
            updatingRow?.user_id,
            moment().valueOf().toString(),
            updatingRow?.user_id,
            updatingRow?.session_id,
          ],
        );

        await sendPaymentReciept(ret.rows[0]);
      }

      await TriggerFirebaseApprovals("user");
      await TriggerFirebaseApprovals("admin");
      return new Response(
        JSON.stringify({
          message: "Status updated successfully",
          data: result.rows[0],
        }),
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("PUT /front-desk error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}

export const revalidate = 0;
