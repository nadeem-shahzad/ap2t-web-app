import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  try {
    if (!token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const link = await pool.query(`SELECT * FROM review_links WHERE token = $1`, [token]);

    if (link.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
    }

    const data = link.rows[0];

    if (data.used) {
      return NextResponse.json({ error: 'Link expired' }, { status: 400 });
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link expired' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server Error' }, { status: 500 });
  }
}
