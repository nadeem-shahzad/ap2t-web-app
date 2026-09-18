import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  const month = req.nextUrl.searchParams.get('month');

  try {
    const childrenQuery = await pool.query(
      `
    SELECT p.user_id, u.first_name, u.last_name
    FROM players p
    JOIN users u ON u.id = p.user_id
    WHERE p.parent_id = $1
    `,
      [id]
    );

    const children = childrenQuery.rows;

    const childrenIds = children.map((c) => c.user_id);

    const query = `
    SELECT
      s.*,
      u.first_name AS coach_first_name,
      u.last_name  AS coach_last_name,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object('id', sv.id, 'hour', sv.hour, 'price', sv.price)
            ORDER BY sv.hour
          )
          FROM session_variants sv
          WHERE sv.session_id = s.id
        ),
        '[]'::jsonb
      ) AS variants,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'user_id', c.user_id,
            'first_name', c.first_name,
            'last_name', c.last_name
          )
        ) FILTER (WHERE c.user_id IS NOT NULL),
        '[]'
      ) AS children,
      COALESCE(
        (
          SELECT jsonb_object_agg(daily_payment.user_id::text, daily_payment.dates)
          FROM (
            SELECT p.user_id,
              jsonb_agg(DISTINCT (p.session_date::date)::text) AS dates
            FROM payments p
            WHERE p.session_id = s.id
              AND p.user_id = ANY($1)
              AND p.session_date IS NOT NULL
            GROUP BY p.user_id
          ) daily_payment
        ),
        '{}'::jsonb
      ) AS enrolled_dates_by_player,
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
        ),
        '[]'
      ) AS dates
    FROM sessions s
    LEFT JOIN users u
      ON u.id = s.coach_id
    LEFT JOIN session_players sp
      ON sp.session_id = s.id
      AND sp.user_id = ANY($1)
    LEFT JOIN (
      SELECT p.user_id, u.first_name, u.last_name
      FROM players p
      JOIN users u ON u.id = p.user_id
    ) c
      ON c.user_id = sp.user_id
    WHERE (
      (
        s.date_mode != 'fixed_dates'
        AND s.date < DATE_TRUNC('month', COALESCE($2::timestamptz, NOW())) + INTERVAL '1 month'
        AND COALESCE(s.end_date, s.date) >= DATE_TRUNC('month', COALESCE($2::timestamptz, NOW()))
      )
      OR (
        s.date_mode = 'fixed_dates'
        AND EXISTS (
          SELECT 1 FROM session_dates sd
          WHERE sd.session_id = s.id
            AND sd.is_active
            AND sd.date >= DATE_TRUNC('month', COALESCE($2::timestamptz, NOW()))
            AND sd.date < DATE_TRUNC('month', COALESCE($2::timestamptz, NOW())) + INTERVAL '1 month'
        )
      )
    )
    GROUP BY s.id, u.first_name, u.last_name
    ORDER BY s.date ASC
  `;

    const result = await pool.query(query, [
      childrenIds.length ? childrenIds : [null],
      month ? `${month}-01T00:00:00Z` : null,
    ]);

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error?.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
