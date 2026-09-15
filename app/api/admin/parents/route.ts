import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id AS parent_id,
        p.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.location,
        u.status,
        u.picture,
        u.phone_no,
        u.birth_date,
        u.joining_date
      FROM parents p
      INNER JOIN users u ON u.id = p.user_id
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/admin/parents error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
