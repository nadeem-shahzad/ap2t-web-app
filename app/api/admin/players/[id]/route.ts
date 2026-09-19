import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: player_id } = await params;

  try {
    // ---------------- PLAYER + PROFILE ----------------
    const playerResult = await pool.query(
      `
      SELECT
      u.*,
      to_json(p.*) AS profile,
      p.parent_id
      FROM users u
      INNER JOIN players p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [player_id]
    );

    if (playerResult.rows.length === 0) {
      return NextResponse.json({ message: 'player not found' }, { status: 404 });
    }

    const player = playerResult.rows[0];

    // ---------------- PARENT DATA ----------------
    let attach_parent = null;

    if (player.parent_id) {
      const parentResult = await pool.query(
        `
        SELECT
          u.*,
          to_json(pr.*) AS profile
        FROM users u
        INNER JOIN parents pr ON pr.user_id = u.id
        WHERE u.id = $1
        `,
        [player.parent_id]
      );

      attach_parent = parentResult.rows[0] || null;
    }

    // ---------------- SESSION DATA ----------------
    const sessionsResult = await pool.query(
      `
  SELECT
    s.*,
      sp.rating AS session_rating,
    cu.first_name AS coach_first_name,
    cu.last_name AS coach_last_name,

    COALESCE(
      (
        SELECT jsonb_agg(DISTINCT (pay.session_date::date)::text)
        FROM payments pay
        WHERE pay.session_id = s.id
          AND pay.user_id = $1
          AND pay.session_date IS NOT NULL
          AND pay.status <> 'refunded'
      ),
      '[]'::jsonb
    ) AS enrolled_dates,

    (
      SELECT to_json(pay.*)
      FROM payments pay
      WHERE pay.session_id = s.id
      AND pay.user_id = $1
      ORDER BY pay.created_at DESC
      LIMIT 1
    ) AS payment_detail,

    COALESCE(
      (
        SELECT jsonb_agg(n.*)
        FROM notes n
        WHERE n.session_id = s.id
      ),
      '[]'
    ) AS note_detail,

    COALESCE(
      (
        SELECT jsonb_agg(a.*)
        FROM attendance a
        WHERE a.session_id = s.id
        AND a.user_id = $1
      ),
      '[]'
    ) AS attendance_detail

  FROM session_players sp
  INNER JOIN sessions s ON s.id = sp.session_id
  LEFT JOIN users cu ON cu.id = s.coach_id

  WHERE sp.user_id = $1
  `,
      [player_id]
    );

    // ---------------- PAYMENT DATA ----------------
    const paymentsResult = await pool.query(
      `
      SELECT
        pay.*,
        s.name AS session_name,
        s.date AS session_start_date,
        s.end_date AS session_end_date,
        s.start_time,
        s.end_time,
        s.session_type,
        cu.first_name AS coach_first_name,
        cu.last_name AS coach_last_name
      FROM payments pay
      LEFT JOIN sessions s ON s.id = pay.session_id
      LEFT JOIN users cu ON cu.id = s.coach_id
      WHERE pay.user_id = $1
      ORDER BY pay.created_at DESC, pay.id DESC
      `,
      [player_id]
    );

    const allNotes = await pool.query(
      `
 SELECT
    n.*,
    u.first_name AS coach_first_name,
    u.last_name  AS coach_last_name,
    s.name AS session_name

FROM session_players sp
INNER JOIN sessions s ON s.id = sp.session_id
INNER JOIN notes n ON n.session_id = s.id
LEFT JOIN users u ON u.id = n.user_id

WHERE 
    sp.user_id = $1
    AND (n.player_id IS NULL OR n.player_id = $1)

ORDER BY n.created_at DESC
  `,
      [player_id]
    );

    // ---------------- FINAL RESPONSE ----------------
    return NextResponse.json({
      ...player,
      attach_parent,
      sessions_data: sessionsResult.rows,
      payment_data: paymentsResult.rows,
      all_notes: allNotes.rows,
    });
  } catch (error) {
    console.error('GET /api/player/[id] error:', error);

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
          UPDATE players 
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
