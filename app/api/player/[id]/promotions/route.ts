import pool from '@/lib/db';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');
  const queryParams = [id];

  let query = `
   SELECT
  s.*,
  u.first_name AS coach_first_name,
  u.last_name  AS coach_last_name,
  CASE 
        WHEN sp.user_id IS NOT NULL THEN true
        ELSE false
      END AS enrolled,
  COALESCE(
    (
      SELECT jsonb_agg(DISTINCT (p.session_date::date)::text)
      FROM payments p
      WHERE p.session_id = s.id
        AND p.user_id = $1
        AND p.session_date IS NOT NULL
    ),
    '[]'::jsonb
  ) AS enrolled_dates,
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
LEFT JOIN users u ON u.id = s.coach_id
LEFT JOIN session_players sp
      ON sp.session_id = s.id
      AND sp.user_id = $1
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
  `;

  try {
    if (type) {
      query += ` AND s.type = $2`;
      queryParams.push(type);
    }
    query += ` GROUP BY s.id, u.first_name, u.last_name, sp.user_id`;

    const result = await pool.query(query, queryParams);

    const filteredData = result.rows.filter((item) => {
      const today = moment();
      return today.isSameOrBefore(moment(item.promotion_end), 'day');
    });

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('GET /api/admin/sessions error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
