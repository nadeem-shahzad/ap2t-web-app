import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const role = searchParams.get('role');

  if (!role) {
    return NextResponse.json({ message: 'Role is missing' }, { status: 400 });
  }

  let query = '';

  if (role === 'parent') {
    query = `
SELECT 
    u.*,
    COUNT(DISTINCT pl.id) AS children_count,
    COALESCE(SUM(pay.amount), 0) AS total_spent,
    (
        SELECT p2.amount
        FROM payments p2
        INNER JOIN players pl2 ON pl2.user_id = p2.user_id
        WHERE pl2.parent_id = u.id
          AND p2.status = 'paid'
        ORDER BY p2.created_at DESC
        LIMIT 1
    ) AS last_spent,
    (
        SELECT MAX(p3.paid_at)
        FROM payments p3
        INNER JOIN players pl3 ON pl3.user_id = p3.user_id
        WHERE pl3.parent_id = u.id
          AND p3.status = 'paid'
    ) AS last_transaction_date
FROM users u
INNER JOIN parents p ON p.user_id = u.id
LEFT JOIN players pl ON pl.parent_id = u.id
LEFT JOIN payments pay ON pay.user_id = pl.user_id
                     AND pay.status = 'paid'  -- only consider paid payments
WHERE u.role = $1
GROUP BY u.id;

`;
  }

  if (role === 'player') {
    query = `
SELECT 
    u.*,
    pl.position,
    pl.skill_level,
    pl.medical_notes,
    pl.parent_id,
    parent_user.first_name AS parent_first_name,
    parent_user.last_name AS parent_last_name,
    parent_user.email AS parent_email,
    ls.session_name AS last_session,
    ls.session_date AS last_session_date,
    ls.session_end_date AS last_session_end_date,
    ls.id AS last_session_id,
    coach_user.first_name AS coach_first_name,
    coach_user.last_name AS coach_last_name,

    /* Attendance % */
    CASE 
        WHEN ls.id IS NOT NULL AND (ls.session_end_date IS NOT NULL AND ls.session_date IS NOT NULL) THEN
            LEAST(
                100,
                FLOOR(
                    100.0 * COALESCE(att.attendance_count, 0) /
                    GREATEST(1, (ls.session_end_date::date - ls.session_date::date + 1))
                )
            )
        ELSE NULL
    END AS attendance_percent

FROM users u
INNER JOIN players pl
    ON pl.user_id = u.id

LEFT JOIN users parent_user
    ON parent_user.id = pl.parent_id

LEFT JOIN LATERAL (
    SELECT 
        s.id,
        s.name AS session_name,
        s.date AS session_date,
        s.end_date AS session_end_date,
        s.coach_id
    FROM session_players sp
    INNER JOIN sessions s
        ON s.id = sp.session_id
    WHERE sp.user_id = u.id
    ORDER BY s.date DESC
    LIMIT 1
) ls ON true

LEFT JOIN coaches c
    ON c.user_id = ls.coach_id
LEFT JOIN users coach_user
    ON coach_user.id = c.user_id

LEFT JOIN LATERAL (
    SELECT COUNT(*) AS attendance_count
    FROM attendance a
    WHERE a.user_id = u.id
      AND a.session_id = ls.id
) att ON true

WHERE u.role = $1;
`;
  }

  if (role === 'coach') {
    const statsQuery = `
  SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'coach') AS total_coaches,
  (SELECT COUNT(*) FROM users WHERE role = 'coach' AND status = 'active') AS total_active_coaches,
  (SELECT COUNT(*) FROM users WHERE role = 'player') AS total_players,
  (SELECT COUNT(*) FROM sessions) AS total_sessions;
`;
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];

    const coachesQuery = `
  SELECT 
   u.*,
    to_json(c.*) AS profile
  FROM users u
  LEFT JOIN coaches c ON c.user_id = u.id
  WHERE u.role = 'coach';
`;

    const coachesResult = await pool.query(coachesQuery);
    const coaches = coachesResult.rows;

    for (const coach of coaches) {
      const upcomingResult = await pool.query(
        `SELECT COUNT(*) AS count 
     FROM sessions 
     WHERE coach_id = $1 AND status = 'upcoming'`,
        [coach.id]
      );
      coach.upcoming_sessions = parseInt(upcomingResult.rows[0].count);

      const totalResult = await pool.query(
        `SELECT COUNT(*) AS count 
     FROM sessions 
     WHERE coach_id = $1`,
        [coach.id]
      );
      coach.total_sessions = parseInt(totalResult.rows[0].count);

      // completed sessions
      const completedResult = await pool.query(
        `SELECT COUNT(*) AS count 
     FROM sessions 
     WHERE coach_id = $1 AND status = 'completed'`,
        [coach.id]
      );
      coach.completed_sessions = parseInt(completedResult.rows[0].count);

      // total players in sessions
      const playersResult = await pool.query(
        `SELECT COUNT(DISTINCT user_id) AS count
     FROM session_players sp
     INNER JOIN sessions s ON s.id = sp.session_id
     WHERE s.coach_id = $1`,
        [coach.id]
      );
      coach.player_count = parseInt(playersResult.rows[0].count);

      const ratingResult = await pool.query(
        `SELECT ROUND(AVG(sp.rating)::numeric, 2) AS average_rating
     FROM session_players sp
     INNER JOIN sessions s ON s.id = sp.session_id
     WHERE s.coach_id = $1
     AND s.status = 'completed'
     AND sp.rating IS NOT NULL
     AND sp.rating > 0`,
        [coach.id]
      );
      coach.average_rating = Number(ratingResult.rows[0].average_rating || 0);
    }
    return NextResponse.json({
      stats,
      data: coaches,
    });
  }

  try {
    const result = await pool.query(query, [role]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.log(error?.message);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}

export const revalidate = 0;
