import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;

  try {
    const { rows } = await pool.query(
      `
  SELECT
    n.*,
    u.first_name AS writer_first_name,
    u.last_name AS writer_last_name
  FROM notes n
  LEFT JOIN users u ON u.id = n.user_id
  WHERE n.session_id = $1
  ORDER BY n.created_at DESC
  `,
      [sessionId]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Required parameters missing' }, { status: 400 });
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    await pool.query(
      `INSERT INTO notes (${fields.join(',')})
       VALUES (${placeholders})
       `,
      values
    );

    return NextResponse.json({ message: 'Note added' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
