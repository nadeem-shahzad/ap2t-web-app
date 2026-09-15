import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
      `INSERT INTO payment_alert_actions (${fields.join(',')})
       VALUES (${placeholders})
       ON CONFLICT DO NOTHING
`,
      values
    );

    return NextResponse.json({ message: 'Data inserted' }, { status: 201 });
  } catch (error: any) {
    console.log('POST /api/parent error:', error);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
export const revalidate = 0;
