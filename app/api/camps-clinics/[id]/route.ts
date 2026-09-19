import pool from '@/lib/db';
import {
  fetchAllAdmins,
  sendAdminNewSignupEmail,
  sendAdminSessionEnrollmentEmail,
  sendNewJoiningEmail,
} from '@/lib/email-templates';
import admin from '@/lib/firebase-admin';
import { sendInAppNotificationBackend } from '@/lib/send-inapp-notification';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';

class CapacityError extends Error {}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  try {
    const result = await pool.query(
      `
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
    s.promotion_start,
    s.promotion_end,
    s.promotion_price,
    s.price,
    s.max_players,
    s.image,
    s.is_daily_payment,
    s.requires_upfront_payment,
    s.date_mode,
    COUNT(sp.user_id) AS total_enrolled_players,
    (s.max_players - COUNT(sp.user_id)) AS total_left,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', sd.id,
            'date', sd.date,
            'price', sd.price,
            'promotion_price', sd.promotion_price,
            'max_players', sd.max_players,
            'is_active', sd.is_active,
            'is_signup_open', sd.is_signup_open,
            'left', sd.max_players - COALESCE((
              SELECT COUNT(DISTINCT dp.user_id) FROM payments dp
              WHERE dp.session_id = s.id
                AND dp.session_date::date = sd.date
                AND dp.status NOT IN ('failed', 'refunded')
            ), 0)
          ) ORDER BY sd.date
        )
        FROM session_dates sd
        WHERE sd.session_id = s.id
          AND sd.is_active
          AND sd.date >= CURRENT_DATE
      ),
      '[]'
    ) AS dates
  FROM sessions s
  LEFT JOIN session_players sp ON sp.session_id = s.id
  WHERE s.id = $1
  GROUP BY s.id
  ORDER BY s.date ASC
`,
      [id]
    );

    const data = result.rows[0] ?? null;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server errror' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const defaultPass = 12345678;
  let player: any,
    parent: any,
    sessionDate: string | null = null;
  let isDailyPayment = false;
  try {
    const body = await req.json();
    player = body.player;
    parent = body.parent;
    sessionDate =
      typeof body.session_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.session_date)
        ? body.session_date
        : null;

    if (!player) {
      return NextResponse.json({ error: 'Missing player data' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const requiredParent = ['first_name', 'last_name', 'role', 'email', 'password', 'phone_no'];
  const requiredPlayer = ['first_name', 'last_name', 'role', 'email', 'password', 'birth_date'];

  for (const field of requiredPlayer) {
    if (!player[field]) {
      return NextResponse.json({ error: `Player field "${field}" is required` }, { status: 400 });
    }
  }

  const isUnderAged = moment().diff(moment(player.birth_date), 'years') < 18;
  if (isUnderAged) {
    for (const field of requiredParent) {
      if (!parent?.[field]) {
        return NextResponse.json({ error: `Parent field "${field}" is required` }, { status: 400 });
      }
    }
    if (player.email.trim().toLowerCase() === parent.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: 'Player and parent must use different email addresses.' },
        { status: 400 }
      );
    }
  }

  let isFixedDates = false;
  try {
    const sessionType = await pool.query(
      `SELECT is_daily_payment, date_mode FROM sessions WHERE id = $1`,
      [id]
    );
    isFixedDates = sessionType.rows[0]?.date_mode === 'fixed_dates';
    if ((sessionType.rows[0]?.is_daily_payment || isFixedDates) && !sessionDate) {
      return NextResponse.json({ error: 'A session date is required' }, { status: 400 });
    }

    if (isFixedDates) {
      const dateRow = await pool.query(
        `SELECT sd.max_players - COALESCE((
           SELECT COUNT(DISTINCT pay.user_id) FROM payments pay
           WHERE pay.session_id = sd.session_id AND pay.session_date::date = sd.date
             AND pay.status NOT IN ('failed', 'refunded')
         ), 0) AS total_left,
         sd.is_active, sd.is_signup_open
         FROM session_dates sd
         WHERE sd.session_id = $1 AND sd.date = $2::date`,
        [id, sessionDate]
      );

      if (dateRow.rows.length === 0 || !dateRow.rows[0].is_active) {
        return NextResponse.json({ error: 'Selected date is not available' }, { status: 400 });
      }
      if (!dateRow.rows[0].is_signup_open) {
        return NextResponse.json(
          { error: 'Signups are closed for the selected date' },
          { status: 400 }
        );
      }
      if (Number(dateRow.rows[0].total_left) <= 0) {
        return NextResponse.json({ error: 'Session is full' }, { status: 409 });
      }
    } else {
      const session = await pool.query(
        `SELECT s.id, s.max_players, s.is_daily_payment,
          CASE WHEN s.is_daily_payment THEN
            s.max_players - (
              SELECT COUNT(DISTINCT pay.user_id)
              FROM payments pay
              WHERE pay.session_id = s.id
                AND pay.session_date::date = $2::date
                AND pay.status NOT IN ('failed', 'refunded')
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
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (Number(session.rows[0].total_left) <= 0) {
        return NextResponse.json({ error: 'Session is full' }, { status: 409 });
      }

      isDailyPayment = Boolean(session.rows[0].is_daily_payment);

      if (!session.rows[0].is_valid_date) {
        return NextResponse.json(
          { error: 'Selected date is outside the session period' },
          { status: 400 }
        );
      }
    }
  } catch (err: any) {
    console.error('Session check error:', err.message);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }

  try {
    const emails = [player.email, ...(isUnderAged ? [parent.email] : [])].map((email) =>
      email.trim().toLowerCase()
    );
    const existing = await pool.query(`SELECT id FROM users WHERE email = ANY($1)`, [emails]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }
  } catch (err: any) {
    console.error('Email check error:', err.message);
    return NextResponse.json({ error: 'Failed to verify parent email' }, { status: 500 });
  }

  const createdFirebaseEmails: string[] = [];
  try {
    if (isUnderAged) {
      await admin.auth().createUser({
        email: parent.email.trim().toLowerCase(),
        password: parent.password,
      });
      createdFirebaseEmails.push(parent.email.trim().toLowerCase());
    }

    await admin.auth().createUser({
      email: player.email.trim().toLowerCase(),
      password: player.password || defaultPass,
    });
    createdFirebaseEmails.push(player.email.trim().toLowerCase());
  } catch (err: any) {
    await Promise.allSettled(
      createdFirebaseEmails.map(async (email) => {
        const firebaseUser = await admin.auth().getUserByEmail(email);
        await admin.auth().deleteUser(firebaseUser.uid);
      })
    );
    console.error('Firebase error:', err.message);
    return NextResponse.json(
      { error: 'Failed to create Firebase account: ' + err.message },
      { status: 500 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Authoritative capacity check, re-run here (locked) against a possible
    // race with another signup that slipped past the earlier unlocked
    // pre-check. FOR UPDATE serializes concurrent signups for the same
    // session/date so they can't both observe a free seat.
    if (isFixedDates) {
      const dateRow = await client.query(
        `SELECT max_players, is_active, is_signup_open
         FROM session_dates
         WHERE session_id = $1 AND date = $2::date
         FOR UPDATE`,
        [id, sessionDate]
      );
      const row = dateRow.rows[0];
      if (!row || !row.is_active) {
        throw new CapacityError('Selected date is not available');
      }
      if (!row.is_signup_open) {
        throw new CapacityError('Signups are closed for the selected date');
      }
      const countRes = await client.query(
        `SELECT COUNT(DISTINCT user_id) FROM payments
         WHERE session_id = $1 AND session_date::date = $2::date
           AND status NOT IN ('failed', 'refunded')`,
        [id, sessionDate]
      );
      if (Number(row.max_players) - Number(countRes.rows[0].count) <= 0) {
        throw new CapacityError('Session is full');
      }
    } else {
      const sessionRow = await client.query(
        `SELECT max_players FROM sessions WHERE id = $1 FOR UPDATE`,
        [id]
      );
      const row = sessionRow.rows[0];
      if (!row) {
        throw new CapacityError('Session not found');
      }
      const countRes = isDailyPayment
        ? await client.query(
            `SELECT COUNT(DISTINCT user_id) FROM payments
             WHERE session_id = $1 AND session_date::date = $2::date
               AND status NOT IN ('failed', 'refunded')`,
            [id, sessionDate]
          )
        : await client.query(`SELECT COUNT(*) FROM session_players WHERE session_id = $1`, [id]);
      if (Number(row.max_players) - Number(countRes.rows[0].count) <= 0) {
        throw new CapacityError('Session is full');
      }
    }

    let parentUserId: number | null = null;
    if (isUnderAged) {
      const parentUserResult = await client.query(
        `INSERT INTO users (first_name, last_name, email, phone_no, role)
         VALUES ($1, $2, $3, $4, 'parent')
         RETURNING id`,
        [parent.first_name, parent.last_name, parent.email.trim().toLowerCase(), parent.phone_no]
      );
      parentUserId = parentUserResult.rows[0].id;
      await client.query(`INSERT INTO parents (user_id) VALUES ($1)`, [parentUserId]);
    }

    const playerUserResult = await client.query(
      `INSERT INTO users (first_name, last_name, email, birth_date, role)
       VALUES ($1, $2, $3, $4, 'player')
       RETURNING id`,
      [player.first_name, player.last_name, player.email.trim().toLowerCase(), player.birth_date]
    );
    const playerUserId = playerUserResult.rows[0].id;

    await client.query(
      `INSERT INTO players (user_id, parent_id, medical_notes)
       VALUES ($1, $2, $3)`,
      [playerUserId, parentUserId, player.medical_notes ?? null]
    );
    const playeremaiNotificationData = {
      email: `${player.email}`,
      fullName: `${player.first_name} ${player?.last_name}`,
      password: `${player.password || defaultPass}`,
    };
    await sendNewJoiningEmail(playeremaiNotificationData);
    if (isUnderAged) {
      await sendNewJoiningEmail({
        email: `${parent.email}`,
        fullName: `${parent.first_name} ${parent?.last_name}`,
        password: `${parent.password}`,
      });
    }
    const adminEmailProps = {
      email: isUnderAged ? parent.email : player.email,
      fullName: `${player?.first_name} ${player?.last_name}`,
      role: 'user',
    };

    await sendAdminNewSignupEmail(adminEmailProps);

    await client.query(
      `INSERT INTO session_players (session_id, user_id)
       VALUES ($1, $2)`,
      [id, playerUserId]
    );
    await client.query(
      `INSERT INTO payments (session_id, user_id, amount, status, session_date)
   VALUES ($1, $2, $3, $4, $5)`,
      [id, playerUserId, 0, 'pending', isDailyPayment || isFixedDates ? sessionDate : null]
    );

    await client.query('COMMIT');
    const emailDataRaw = await pool.query(
      `
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
    );
    const emailData = emailDataRaw.rows[0];

    if (emailData) {
      const adminEmailPayload = {
        fullName: `${emailData?.first_name || ''} ${emailData?.last_name || ''}`,
        userEmail: emailData.useremail,
        sessionName: emailData.sessionname,
        coachName: `${emailData?.coach_first_name || ''} ${emailData?.coach_last_name || ''}`,
        sessionDate: moment(emailData.sessiondate).format('YYYY-MMM-DD'),
        enrollmentDate: moment(emailData.enrollmentdate).format('YYYY-MMM-DD'),
      };
      await sendAdminSessionEnrollmentEmail(adminEmailPayload);
    }
    const playerName = `${emailData?.first_name || ''} ${emailData?.last_name || ''}`.trim();

    const msg = `${playerName} enrolled in ${emailData.sessionname}.`;

    const admins = await fetchAllAdmins();
    const promises = admins.map((admin) =>
      sendInAppNotificationBackend(admin.user_id, msg, `/portal/admin/sessions/${id}`)
    );

    await Promise.allSettled(promises);
    await sendInAppNotificationBackend(emailData.coach_id, msg, `/portal/coach/sessions/${id}`);
    const paymentMsg = `${playerName} enrolled in ${emailData.sessionname}. Payment: Pending`;

    if (emailData.parent_id) {
      await sendInAppNotificationBackend(emailData.parent_id, msg, `/portal/parent/sessions/${id}`);
    }
    await sendInAppNotificationBackend(playerUserId, msg, `/portal/parent/sessions/${id}`);

    const promises1 = admins.map((admin) =>
      sendInAppNotificationBackend(admin.user_id, paymentMsg, `/portal/admin/payments/`)
    );

    await Promise.all(promises1);

    return NextResponse.json(
      { success: true, message: 'Registered successfully' },
      { status: 201 }
    );
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', err.message);

    for (const email of createdFirebaseEmails) {
      try {
        const fbUser = await admin.auth().getUserByEmail(email.trim().toLowerCase());
        await admin.auth().deleteUser(fbUser.uid);
      } catch (cleanupErr: any) {
        console.error('Firebase cleanup failed:', cleanupErr.message);
      }
    }

    if (err instanceof CapacityError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }

    return NextResponse.json({ error: 'Registration failed: ' + err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
export const revalidate = 0;
