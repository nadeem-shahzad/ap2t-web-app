import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest, { params }: { params: { id: string; sid: string } }) {
  const { id, sid } = await params;
  const { rating } = await req.json();

  try {
    if (!id || !sid) return NextResponse.json({ message: 'Parameters missing' }, { status: 400 });

    await pool.query(
      `
                UPDATE session_players
                SET rating = $1
                WHERE user_id = $2 AND session_id = $3`,
      [rating, id, sid]
    );

    return NextResponse.json({ message: 'Done' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
