import pool from "@/lib/db";
import { fetchAllAdmins, sendAdminNewSignupEmail, sendAdminSessionEnrollmentEmail, sendNewJoiningEmail } from "@/lib/email-templates";
import admin from "@/lib/firebase-admin";
import { sendInAppNotificationBackend } from "@/lib/send-inapp-notification";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req : NextRequest, {params} : {params : {id : string}}) {

    const {id} = await params

    try {
       const result = await pool.query(`
  SELECT
    s.id,
    s.session_type,
    s.type,
    s.name,
    s.description,
    s.date,
    s.end_date,
    s.start_time,
    s.end_time,
    s.age_limit,
    s.location,
    s.apply_promotion,
    s.promotion_price,
    s.price,
    s.max_players,
    s.is_daily_payment,
    COUNT(sp.user_id) AS total_enrolled_players,
    (s.max_players - COUNT(sp.user_id)) AS total_left
  FROM sessions s
  LEFT JOIN session_players sp ON sp.session_id = s.id
  WHERE s.id = $1
  GROUP BY s.id
  ORDER BY s.date ASC
`, [id]);

const data = result.rows[0] ?? null

        return NextResponse.json(data, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server errror" }, { status: 500 })
    }
}



export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const defaultPass=12345678
  let player: any, parent: any, sessionDate: string | null = null;
  let isDailyPayment = false;
  try {
    const body = await req.json();
    player = body.player;
    parent = body.parent;
    sessionDate = typeof body.session_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.session_date)
      ? body.session_date
      : null;

    if (!player || !parent) {
      return NextResponse.json(
        { error: "Missing player or parent data" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  
  const requiredParent = ["first_name", "last_name", "role", "email", "password", "phone_no"];
  const requiredPlayer = ["first_name", "last_name","role", "email", "birth_date"];

  for (const field of requiredParent) {
    if (!parent[field]) {
      return NextResponse.json(
        { error: `Parent field "${field}" is required` },
        { status: 400 }
      );
    }
  }

  for (const field of requiredPlayer) {
    if (!player[field]) {
      return NextResponse.json(
        { error: `Player field "${field}" is required` },
        { status: 400 }
      );
    }
  }

  
  try {
    const sessionType = await pool.query(
      `SELECT is_daily_payment FROM sessions WHERE id = $1`,
      [id],
    );
    if (sessionType.rows[0]?.is_daily_payment && !sessionDate) {
      return NextResponse.json({ error: "A session date is required for daily enrollment" }, { status: 400 });
    }

    const session = await pool.query(
      `SELECT s.id, s.max_players, s.is_daily_payment,
        CASE WHEN s.is_daily_payment THEN
          s.max_players - (
            SELECT COUNT(DISTINCT pay.user_id)
            FROM payments pay
            WHERE pay.session_id = s.id
              AND pay.session_date::date = $2::date
          )
        ELSE s.max_players - COUNT(sp.user_id)
        END AS total_left,
        CASE WHEN s.is_daily_payment THEN
          $2::date BETWEEN s.date::date
                        AND COALESCE(s.end_date, s.date)::date
        ELSE true END AS is_valid_date
       FROM sessions s
       LEFT JOIN session_players sp ON sp.session_id = s.id
       WHERE s.id = $1
       GROUP BY s.id`,
      [id, sessionDate]
    );

    if (session.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (Number(session.rows[0].total_left) <= 0) {
      return NextResponse.json({ error: "Session is full" }, { status: 409 });
    }

    isDailyPayment = Boolean(session.rows[0].is_daily_payment);

    if (!session.rows[0].is_valid_date) {
      return NextResponse.json({ error: "Selected date is outside the session period" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Session check error:", err.message);
    return NextResponse.json(
      { error: "Failed to verify session" },
      { status: 500 }
    );
  }

  
  try {
    const existing = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [parent.email.trim().toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this parent email already exists. Please log in." },
        { status: 409 }
      );
    }
  } catch (err: any) {
    console.error("Email check error:", err.message);
    return NextResponse.json(
      { error: "Failed to verify parent email" },
      { status: 500 }
    );
  }

  
  try {
    await admin.auth().createUser({
      email: parent.email.trim().toLowerCase(),
      password: parent.password,
    });

    await admin.auth().createUser({
      email: player.email.trim().toLowerCase(),
      password: player.password || defaultPass,
    });

  } catch (err: any) {
    console.error("Firebase error:", err.message);
    return NextResponse.json(
      { error: "Failed to create Firebase account: " + err.message },
      { status: 500 }
    );
  }

  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    
    const parentUserResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, phone_no, role)
       VALUES ($1, $2, $3, $4, 'parent')
       RETURNING id`,
      [
        parent.first_name,
        parent.last_name,
        parent.email.trim().toLowerCase(),
        parent.phone_no,
      ]
    );
    const parentUserId = parentUserResult.rows[0].id;

    
    await client.query(
      `INSERT INTO parents (user_id) VALUES ($1)`,
      [parentUserId]
    );

    
    const playerUserResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, birth_date, role)
       VALUES ($1, $2, $3, $4, 'player')
       RETURNING id`,
      [
        player.first_name,
        player.last_name,
        player.email.trim().toLowerCase(),
        player.birth_date,
      ]
    );
    const playerUserId = playerUserResult.rows[0].id;

    
    await client.query(
      `INSERT INTO players (user_id, parent_id, medical_notes)
       VALUES ($1, $2, $3)`,
      [playerUserId, parentUserId, player.medical_notes ?? null]
    );
    const playeremaiNotificationData = {
            email:`${player.email}`,
            fullName: `${player.first_name} ${player?.last_name}`,
            password: `${defaultPass}`
        }
        await sendNewJoiningEmail(playeremaiNotificationData)
        const parentemaiNotificationData = {
            email:`${parent.email}`,
            fullName: `${parent.first_name} ${parent?.last_name}`,
            password: `${parent.password}`
        }
        await sendNewJoiningEmail(parentemaiNotificationData)
        const adminEmailProps={
            email:parent.email,
            fullName:`${player?.first_name} ${player?.last_name}`,
            role: "user"
        }
        
       await sendAdminNewSignupEmail(adminEmailProps)
    
    await client.query(
      `INSERT INTO session_players (session_id, user_id)
       VALUES ($1, $2)`,
      [id, playerUserId]
    );
    await client.query(
  `INSERT INTO payments (session_id, user_id, amount, status, session_date)
   VALUES ($1, $2, $3, $4, $5)`,
  [id, playerUserId, 0, "pending", isDailyPayment ? sessionDate : null]
);

    await client.query("COMMIT");
         const emailDataRaw = await pool.query(`
      SELECT 
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
  AND se.user_id = $2`,
      [id, playerUserId]
    )
    const emailData = emailDataRaw.rows[0]

    if (emailData) {
      const adminEmailPayload = {
        fullName: `${emailData?.first_name || ""} ${emailData?.last_name || ""}`,
        userEmail: emailData.useremail,
        sessionName: emailData.sessionname,
        coachName: `${emailData?.coach_first_name || ""} ${emailData?.coach_last_name || ""}`,
        sessionDate: moment(emailData.sessiondate).format("YYYY-MMM-DD"),
        enrollmentDate: moment(emailData.enrollmentdate).format("YYYY-MMM-DD"),
      }
      await sendAdminSessionEnrollmentEmail(adminEmailPayload)
    }
    const playerName = `${emailData?.first_name || ""} ${emailData?.last_name || ""}`.trim();

const msg = `${playerName} enrolled in ${emailData.sessionname}.`;

const admins = await fetchAllAdmins();
const promises = admins.map(admin =>
  sendInAppNotificationBackend(
    admin.user_id,
    msg,
    `/portal/admin/sessions/${id}`
  )
);


await Promise.allSettled(promises);
await sendInAppNotificationBackend(
  emailData.coach_id,
  msg,
  `/portal/coach/sessions/${id}`
);
const paymentMsg = `${playerName} enrolled in ${emailData.sessionname}. Payment: Pending`;

if(emailData.parent_id){

  await sendInAppNotificationBackend(
    emailData.parent_id,
    msg,
    `/portal/parent/sessions/${id}`
  );
}
await sendInAppNotificationBackend(
    playerUserId,
    msg,
    `/portal/parent/sessions/${id}`
  );

const promises1 = admins.map(admin =>
  sendInAppNotificationBackend(
    admin.user_id,
    paymentMsg,
    `/portal/admin/payments/`
  )
);

await Promise.all(promises1);

    return NextResponse.json(
      { success: true, message: "Registered successfully" },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Transaction error:", err.message);

    
    try {
      const fbUser = await admin.auth().getUserByEmail(parent.email.trim().toLowerCase());
      await admin.auth().deleteUser(fbUser.uid);
    } catch (cleanupErr: any) {
      console.error("Firebase cleanup failed:", cleanupErr.message);
    }

    return NextResponse.json(
      { error: "Registration failed: " + err.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
export const revalidate = 0
