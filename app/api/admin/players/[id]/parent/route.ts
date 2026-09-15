import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: player_id } = await params;

  try {
    const { parent_id } = await req.json();

    if (!player_id) {
      return NextResponse.json({ message: 'Player id is required' }, { status: 400 });
    }

    await pool.query(
      `
      UPDATE players
SET parent_id = $2
WHERE user_id = $1;

      `,
      [player_id, parent_id]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Add Parent Error:', err);
    return NextResponse.json({ message: 'Failed to attach parent' }, { status: 500 });
  }
}
export const revalidate = 0;
