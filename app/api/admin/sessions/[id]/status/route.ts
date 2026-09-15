import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session_id = (await params).id;
    const { status } = await req.json();

    const result = await pool.query(
      `
      UPDATE "sessions"
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, session_id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('PATCH /api/admin/sessions/[id]/status error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
