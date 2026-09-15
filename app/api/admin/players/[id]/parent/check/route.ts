import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: player_id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const parent = searchParams.get('parent');

  try {
    if (!player_id) {
      return NextResponse.json({ message: 'Player id is required' }, { status: 400 });
    }

    const res = await pool.query(`SELECT parent_id FROM players WHERE user_id = $1`, [player_id]);
    let continueToSave = true;
    const resData = res.rows[0]?.parent_id ?? null;

    if (resData) {
      continueToSave = false;
    }

    if (Number(resData) === Number(parent)) {
      continueToSave = true;
    }

    return NextResponse.json({ continueToSave });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Server error' }, { status: 500 });
  }
}
export const revalidate = 0;
