import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');

    const result = await pool.query(
      `SELECT id, first_name,email, last_name, role FROM users WHERE role = 'player'
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/admin/players/search error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
