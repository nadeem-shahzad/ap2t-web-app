import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const queryParams: any[] = [id];

  let query = `
   SELECT
  s.*,
  u.first_name AS coach_first_name,
  u.last_name  AS coach_last_name,
  COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object('date', sd.date))
      FROM session_dates sd
      WHERE sd.session_id = s.id
        AND sd.is_active
    ),
    '[]'
  ) AS dates
FROM sessions s
LEFT JOIN users u ON u.id = s.coach_id
WHERE s.coach_id = $1
  `;

  try {
    query += ` GROUP BY s.id, u.first_name, u.last_name;`;

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('GET /api/coach/[id]/sessions error:', error);

    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
