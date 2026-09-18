import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
  SELECT
    s.id,
    s.session_type,
    s.type,
    s.name,
    s.description,
    s.date,
    s.image,
    s.end_date,
    s.start_time,
    s.end_time,
    s.age_limit,
    s.location,
    s.apply_promotion,
    s.promotion_price,
    s.price,
    s.max_players,
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
  WHERE s.apply_promotion IS TRUE
    AND (
      (s.date_mode != 'fixed_dates' AND s.end_date::date >= CURRENT_DATE)
      OR (
        s.date_mode = 'fixed_dates'
        AND EXISTS (
          SELECT 1 FROM session_dates sd
          WHERE sd.session_id = s.id AND sd.is_active AND sd.date >= CURRENT_DATE
        )
      )
    )
  GROUP BY s.id
  ORDER BY s.date ASC
`);

    const sessionsWithCounts = result.rows.map((r: any) => ({
      ...r,
      total_enrolled_players: Number(r.total_enrolled_players),
      total_left: Number(r.total_left),
    }));
    return NextResponse.json(sessionsWithCounts, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server errror' }, { status: 500 });
  }
}
export const revalidate = 0;
