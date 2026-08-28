import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { fetchAllAdmins, sendCoachNewSessionEmail } from "@/lib/email-templates";
import { sendInAppNotificationBackend } from "@/lib/send-inapp-notification";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: session_id } = await params;
  try {
    const result = await pool.query(`
        SELECT
  s.*,
  u.first_name AS coach_first_name,
  u.last_name AS coach_last_name,
  c.schedule_preference AS coach_schedule_preference,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', sv.id,
          'hour', sv.hour,
          'price', sv.price
        )
        ORDER BY sv.hour
      )
      FROM session_variants sv
      WHERE sv.session_id = s.id
    ),
    '[]'::jsonb
  ) AS variants
FROM sessions s
LEFT JOIN users u ON u.id = s.coach_id
LEFT JOIN coaches c ON c.user_id = s.coach_id
WHERE s.id = $1
        `,
      [session_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "session not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("GET /api/sessions/[id] error:", error);

    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );

  }

}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: session_id } = await params;
  const searchParams = request.nextUrl.searchParams
  const byAdmin  = searchParams.get("byAdmin") === "true"

  try {
    const result = await pool.query(
      `DELETE FROM sessions WHERE id = $1 RETURNING *`,
      [session_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }
    const session = result.rows[0];
    const coachNamesRaw = await pool.query(`SELECT first_name,last_name FROM users WHERE id=$1`, [session.coach_id])
    const coachNames = coachNamesRaw.rows[0]
    const coachFullName = `${coachNames.first_name} ${coachNames.last_name}`

    if (byAdmin) {

      const msg = `Session with you ${session?.name} was deleted by admin`;


      await sendInAppNotificationBackend(session.coach_id, msg, `/portal/coach/sessions/`)
    } else if (!byAdmin) {
      const msg = `Session ${session?.name} was deleted by ${coachFullName}`;
      const admins = await fetchAllAdmins()
      const promises = admins.map(admin =>

        sendInAppNotificationBackend(admin.id, msg, `/portal/admin/sessions/`)
      )
      await Promise.allSettled(promises)
    }
    const playerMsg = `Session ${session?.name} was deleted`
    const res = await pool.query(`SELECT user_id from session_players WHERE session_id=$1`, [session_id])
    const playersInSsssionId = res.rows
    for (const playerId of playersInSsssionId) {
      sendInAppNotificationBackend(playerId, playerMsg, `/portal/admin/sessions/`)
    }
    return NextResponse.json(
      { message: "Session deleted successfully", session: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/sessions/[id] error:", error);

    return NextResponse.json(
      { message: error?.essage || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, byAdmin, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const fields: any[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE sessions 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    const emailDataRaw = await pool.query(`SELCET
               email,
               first_name || ' ' || last_name AS "fullName"
               FROM users
               WHERE id=$1
               `, [data.coach_id])

    const emailData = emailDataRaw.rows[0]

    const coachEmailPayload = {
      coachEmail: `${emailData.email}`,
      coachName: `${emailData.fullName}`,
      sessionName: `${data.name}`,
      sessionDate: `${data.date} - ${data.end_date}`,
      sessionTime: data.time,
      location: `${data.location}`,
      createdBy: "admin",
      createdDate: `${new Date()}`,
    }
    await sendCoachNewSessionEmail(coachEmailPayload)


    const coachName = `${emailData?.first_name || ""} ${emailData?.last_name || ""}`.trim();
    if (byAdmin) {


      const msg = `Session ${data?.name} with ${coachName} was updated`;

      await sendInAppNotificationBackend(data.coach_id, msg, `/portal/coach/sessions/${id}`)
    } else if (!byAdmin) {
      const msg = `Session ${data?.name} with ${coachName} was updated`;

      const admins = await fetchAllAdmins()
      const promises = admins.map(admin =>

        sendInAppNotificationBackend(admin.id, msg, `/portal/admin/sessions/`)
      )
      await Promise.allSettled(promises)
    }
    if (updates.status !== "upcoming") {
      const msg = `Session ${data?.name} with ${coachName} is ${updates.status}`;
      const res = await pool.query(`SELECT user_id from session_players WHERE session_id=$1`, [id])
      const playersInSsssionId = res.rows
      for (const playerId of playersInSsssionId) {

        const admins = await fetchAllAdmins()
        const promises = admins.map(admin =>

          sendInAppNotificationBackend(admin.id, msg, `/portal/admin/sessions/`)
        )
        sendInAppNotificationBackend(playerId, msg, `/portal/admin/sessions/`)
        await Promise.allSettled(promises)
      }
    }
    return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.log("Error updating data:", error?.message);
    return NextResponse.json({ message: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
export const revalidate = 0
