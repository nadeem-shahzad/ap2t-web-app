import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;
  try {
    const result = await pool.query(
      `SELECT
    p.user_id AS id, 
    u.first_name,
    u.email, 
    u.last_name, 
    u.picture,
    u.role 
    FROM users u 
    INNER JOIN players p ON p.user_id = u.id
    WHERE p.parent_id = $1 
      `,
      [id]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/players/search error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
