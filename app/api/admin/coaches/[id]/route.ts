import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: coach_id } = await params;
  try {
    const result = await pool.query(
      `
      SELECT
    u.*,
    to_jsonb(c.*) AS profile,

    /* Sessions with payment details */
    COALESCE(
        jsonb_agg(DISTINCT sess_data)
        FILTER (WHERE sess_data.id IS NOT NULL),
        '[]'
    ) AS session_data,

    /* Payments list */
    COALESCE(
        jsonb_agg(DISTINCT pay)
        FILTER (WHERE pay.id IS NOT NULL),
        '[]'
    ) AS payment_data,

    /* ===== STATS ===== */

    /* Total Revenue */
    COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'paid'), 0)
        AS total_revenue,

    /* This Month Revenue */
    COALESCE(
        SUM(pay.amount) FILTER (
            WHERE pay.status = 'paid'
            AND DATE_TRUNC('month', pay.created_at) = DATE_TRUNC('month', CURRENT_DATE)
        ),
        0
    ) AS this_month_revenue,

    /* Last Month Revenue */
    COALESCE(
        SUM(pay.amount) FILTER (
            WHERE pay.status = 'paid'
            AND DATE_TRUNC('month', pay.created_at) =
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        ),
        0
    ) AS last_month_revenue,

    /* Average Session Price */
    COALESCE(AVG(sess.price::numeric), 0)
        AS average_price_per_session

FROM users u

INNER JOIN coaches c
    ON c.user_id = u.id

/* Sessions */
LEFT JOIN LATERAL (
    SELECT
        s.*,

        COALESCE(
  ROUND(
    AVG(sp.rating) FILTER (WHERE sp.rating IS NOT NULL AND sp.rating > 0 AND s.status = 'completed')
  ::numeric, 2),
  0
) AS session_rating,

        /* Attach payment details per session */
        COALESCE(
            jsonb_agg(p2) FILTER (WHERE p2.id IS NOT NULL),
            '[]'
        ) AS payment_detail

    FROM sessions s
    LEFT JOIN payments p2
        ON p2.session_id = s.id
    LEFT JOIN session_players sp
    ON sp.session_id = s.id
    WHERE s.coach_id = u.id
    GROUP BY s.id
) sess_data ON TRUE

/* Direct session reference for stats */
LEFT JOIN sessions sess
    ON sess.coach_id = u.id

/* Payments for stats */
LEFT JOIN payments pay
    ON pay.session_id = sess.id

WHERE u.id = $1

GROUP BY u.id, c.id;

      `,
      [coach_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'coach not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('GET /api/coaches/[id] error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
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
      return NextResponse.json({ message: 'No valid data provided for update' }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE coaches 
          SET ${fields.join(', ')}
          WHERE user_id = $${values.length}
      `;

    await pool.query(query, values);

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.log('Error updating data:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
