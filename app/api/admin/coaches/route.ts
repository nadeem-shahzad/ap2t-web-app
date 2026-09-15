import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
  c.id AS coach_id,
  c.user_id,
  c.bio,
  c.rating,
  c.career_start,
  c.schedule_preference,

  u.first_name,
  u.last_name,
  u.email,
  u.location,
  u.status,
  u.picture,
  u.phone_no,
  u.birth_date,
  u.joining_date,


  COALESCE(
    jsonb_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL),
    '[]'
  ) AS specialities,


  COALESCE(
    jsonb_agg(DISTINCT cert.name) FILTER (WHERE cert.id IS NOT NULL),
    '[]'
  ) AS certifications,


  COUNT(sess.id) AS total_sessions,


  COUNT(sess.id) FILTER (WHERE sess.status = 'completed') AS completed_sessions,

  COUNT(sess.id) FILTER (WHERE sess.status = 'upcoming') AS upcoming_sessions,

  COUNT(DISTINCT p.id) AS players_count

FROM coaches c
INNER JOIN users u ON u.id = c.user_id

LEFT JOIN coach_specialities cs ON cs.coach_id = c.id
LEFT JOIN specialities s ON s.id = cs.speciality_id


LEFT JOIN coach_certifications cc ON cc.coach_id = c.id
LEFT JOIN certifications cert ON cert.id = cc.certification_id


LEFT JOIN sessions sess ON sess.coach_id = c.id


LEFT JOIN players p ON p.coach_id = c.id


GROUP BY c.id, u.id;

    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/admin/coaches error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
