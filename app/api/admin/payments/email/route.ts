import pool from '@/lib/db';
import { sendSingleEmail } from '@/lib/notification-service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { id, subject, message } = await req.json();

  try {
    if (!id) {
      return NextResponse.json({ message: 'Missing id' }, { status: 400 });
    }

    const user = await pool.query(`SELECT email FROM users WHERE id = $1`, [id]);

    const userEmail = user.rows?.[0] ?? null;

    if (userEmail?.email) {
      await sendSingleEmail(message, subject, userEmail.email);
    }

    return NextResponse.json({ message: 'Done' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
