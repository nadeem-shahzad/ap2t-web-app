import pool from "@/lib/db";
import {
  fetchAllAdmins,
  sendAdminPaymentNotificationEmail,
  sendAdminSessionEnrollmentEmail,
  sendCoachPlayerEnrollmentEmail,
  sendPaymentReceiptEmail,
} from "@/lib/email-templates";
import { sendInAppNotificationBackend } from "@/lib/send-inapp-notification";
import { GetSquare } from "@/lib/square-creds";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment } from "square";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const user_id = searchParams.get("id");
  const session_id = searchParams.get("sid");
  const variant_id = searchParams.get("variant_id");
  const price = searchParams.get("price");
  let toSend = false;
  let amount = Number(price);

  if (!user_id || !session_id) {
    return NextResponse.json(
      { message: "Payment cannot be processed" },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* ---------------- SESSION ---------------- */

    const sessionResult = await client.query(
      `SELECT id, price, apply_promotion, promotion_price, comped, max_players, promotion_start, promotion_end, is_daily_payment
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
             WHERE session_id = $1
               AND user_id = $2
               AND (
                 NOT COALESCE($3::boolean, FALSE)
                 OR DATE(created_at) = CURRENT_DATE
               )`,
      [session_id, user_id, session.is_daily_payment],
    );

    if (playerCheck.rows.length === 0) {
      const variantsResult = await client.query(
        `SELECT id, price
         FROM session_variants
         WHERE session_id = $1
         FOR UPDATE`,
        [session_id],
      );
      const variants = variantsResult.rows;
      const selectedVariant = variants.find(
        (variant) => variant.id === Number(variant_id),
      );

      if (variants.length > 0 && !selectedVariant) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "Please select a session variant" },
          { status: 400 },
        );
      }

      if (variants.length === 0 && variant_id) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { message: "This session does not support variants" },
          { status: 400 },
        );
      }

      const countResult = await client.query(
        `SELECT COUNT(*) FROM session_players
         WHERE session_id = $1
           AND (
             NOT COALESCE($2::boolean, FALSE)
             OR DATE(created_at) = CURRENT_DATE
           )`,
        [session_id, session.is_daily_payment],
      );

      const currentPlayers = Number(countResult.rows[0].count);
      const maxPlayers = Number(session.max_players);

      if (currentPlayers >= maxPlayers) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            message: "Max players added in the session can not add more",
            max: true,
          },
          { status: 400 },
        );
      }

      /* ---------------- CALCULATE AMOUNT ---------------- */

      amount = selectedVariant ? selectedVariant.price : session.price;
      const now = moment();
      if (session.comped) {
        amount = 0;
      } else if (
        session.apply_promotion &&
        session.promotion_price &&
        session.promotion_start &&
        session.promotion_end &&
        now.isBetween(
          moment(session.promotion_start).startOf("day"),
          moment(session.promotion_end).endOf("day"),
          undefined,
          "[]",
        )
      ) {
        amount = session.promotion_price;
      }

      /* ---------------- SIBLING DISCOUNT ---------------- */

      // FIX 1: use client (not pool) to stay inside the transaction
      const parent_data = await client.query(
        `SELECT parent_id FROM players WHERE user_id = $1`,
        [user_id],
      );

      const parent_id = parent_data.rows[0]?.parent_id;
      let hasSiblingDiscount = false;

      if (parent_id !== null && parent_id !== undefined) {
        // FIX 1: use client (not pool)
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
      `SELECT id, status, amount
             FROM payments
             WHERE session_id = $1 AND user_id = $2 ORDER BY id DESC LIMIT 1`,
      [session_id, user_id],
    );

    const payment = paymentResult.rows?.[0];

    if (!payment) {
      throw new Error("Payment record missing");
    }

    // Existing enrollments retain the amount recorded when they were booked.
    amount = Number(payment.amount);

    /* ---------------- CHARGE PAYMENT ---------------- */

    const { error, location, apiKey, mode } = await GetSquare();

    if (!error && payment.status !== "paid" && payment.status !== "comped") {
      let square_customer_id = player.square_customer_id;
      let square_card_id = player.square_card_id;
      let paid_by = player.id;

      if (!square_customer_id || !square_card_id) {
        const parentResult = await client.query(
          `SELECT u.id, u.square_customer_id, u.square_card_id
                     FROM players p
                     JOIN users u ON u.id = p.parent_id
                     WHERE p.user_id = $1`,
          [user_id],
        );

        const parent = parentResult.rows?.[0];

        if (parent) {
          square_customer_id = parent.square_customer_id;
          square_card_id = parent.square_card_id;
          paid_by = parent.id;
        }
      }

      if (!square_customer_id || !square_card_id) {
        return NextResponse.json(
          { message: "No card attached on file", success: false },
          { status: 200 },
        );
      }

      const chargeAmount = Number(amount);
      let charge: any = null;
      if (chargeAmount > 0) {
        try {
          const squareClient = new SquareClient({
            token: apiKey,
            environment: mode ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
          });
          charge = await squareClient.payments.create({
            sourceId: square_card_id,
            idempotencyKey: crypto.randomUUID(),
            amountMoney: {
              amount: BigInt(Math.round(Number(chargeAmount) * 100)),
              currency: "USD",
            },
            locationId: location,
            customerId: square_customer_id,
          });
        } catch (err) {
          await pool.query(
            `UPDATE payments
                 SET status = $1, method = $2
                 WHERE id = $3`,
            ["failed", "Debit / Credit Card", payment.id],
          );
          throw err;
        }
      }

      await client.query(
        `UPDATE payments
                 SET transaction_id = $1,
                     status = $2,
                     paid_by = $3,
                     paid_at = $4,
                     method = $5
                 WHERE id = $6`,
        [
          chargeAmount > 0
            ? charge?.payment?.id
            : moment().valueOf().toString(),
          "paid",
          paid_by,
          new Date(),
          "Debit / Credit Card",
          payment.id,
        ],
      );
      if (charge?.payment?.id) {
        toSend = true;
      }
    }

    const userInfoRes = await client.query(
      `SELECT first_name, last_name, email 
   FROM users 
   WHERE id = $1`,
      [user_id],
    );

    const userInfo = userInfoRes.rows[0];
    const fullName = `${userInfo.first_name} ${userInfo.last_name}`;
    const email: string = userInfo.email;

    const paymentInfoAndSessionNameData = await client.query(
      `SELECT 
        p.transaction_id,
        p.paid_at,
        p.amount,
        p.method,
        s.name AS sessionName
    FROM payments p
    JOIN sessions s ON s.id = p.session_id
    WHERE p.id = $1;`,
      [payment.id],
    );

    const paymentAndsession = paymentInfoAndSessionNameData.rows[0];

    await client.query("COMMIT");

    if (toSend) {
      const payload = {
        email: email,
        fullName: fullName,
        amount: `${paymentAndsession.amount}`,
        paymentId: paymentAndsession.transaction_id,
        sessionName: `${paymentAndsession.sessionName}`,
        paymentDate: paymentAndsession?.paid_at
          ? moment(paymentAndsession?.paid_at).format("YYYY-MM-DD")
          : moment().format("YYYY-MM-DD"),
      };
      await sendPaymentReceiptEmail(payload);

      const allAdmins = await fetchAllAdmins();

      await Promise.all(
        allAdmins.map(async (admin) => {
          const adminPayload = {
            fullName: fullName,
            adminEmail: email,
            userEmail: email,
            amount: paymentAndsession.amount,
            paymentId: paymentAndsession.transaction_id,
            sessionName: paymentAndsession.sessionName,
            paymentMethod: paymentAndsession?.method,
            paymentDate: paymentAndsession?.paid_at
              ? moment(paymentAndsession?.paid_at).format("YYYY-MM-DD")
              : moment().format("YYYY-MM-DD"),
          };

          const paymentMsg = `${fullName} payment for ${admin.sessionName} ${admin.paymentStatus} - $${amount}.`;

          await sendInAppNotificationBackend(
            admin.user_id,
            paymentMsg,
            `/portal/admin/payments`,
          );
          return sendAdminPaymentNotificationEmail(adminPayload).catch(
            (err) => {
              console.log(`Failed to send to ${admin.email}:`, err);
            },
          );
        }),
      );
      const parentidRaw = await pool.query(
        `SELECT parent_id FROM players WHERE user_id=$1`,
        [user_id],
      );
      const parent_id = parentidRaw.rows[0]?.parent_id;
      const parentMsg = `Payment paid for session ${paymentAndsession.sessionname} - $${paymentAndsession.amount}.`;
      if (parent_id) {
        sendInAppNotificationBackend(
          parent_id,
          parentMsg,
          `/portal/parent/dashboard`,
        );
      }
      sendInAppNotificationBackend(Number(user_id), parentMsg, `/portal/parent/dashboard`);
    }

    if (playerCheck.rows.length === 0) {
      const EmailDataRaw = await pool.query(
        `SELECT 
  u.first_name,
  u.last_name,
  u.email AS userEmail,
  s.name AS sessionName,
  coach.email AS coachEmail,
  coach.first_name AS coach_first_name,
  coach.last_name AS coach_last_name,
  s.date AS session_start_date,
  s.end_date AS session_end_date,
  p.parent_id,
  NOW() AS enrollmentDate
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
          playerEmail: EmailData.userEmail,
          sessionName: EmailData.sessionName,
          sessionDate: `${sessionStartDate} - ${sessionEndData}`,
          enrollmentDate: EmailData.enrollmentDate,
        };
        await sendCoachPlayerEnrollmentEmail(coachEmailPayload);
        const msg = `${coachEmailPayload.playerName} enrolled in ${EmailData.sessionname}.`;
        const admins = await fetchAllAdmins();
        const promises = admins.map((admin) =>
          sendInAppNotificationBackend(
            admin.user_id,
            msg,
            `/portal/admin/payments`,
          ),
        );

        await Promise.all(promises);
        await sendInAppNotificationBackend(
          EmailData.coach_id,
          msg,
          `/portal/coach/sessions/${session_id}`,
        );
        if (EmailData.parent_id) {
          await sendInAppNotificationBackend(
            EmailData.parent_id,
            msg,
            `/portal/parent/sessions/${session_id}`,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment Completed",
    });
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
    client.release();
  }
}
