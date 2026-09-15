import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM sessions) AS total_sessions,
        (SELECT COUNT(DISTINCT id) FROM players) AS total_players
    `);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('GET /api/admin/coaches/stats error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
