import pool from '@/lib/db';
import { sendPaymentReminderEmail } from '@/lib/email-templates';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ message: 'ID is missing' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `
    SELECT
        u.email,
        u.first_name,
        u.last_name,
        s.name AS session_name,
        p.amount
    FROM session_players se
    JOIN users u 
        ON u.id = se.user_id
    JOIN sessions s 
        ON s.id = se.session_id
    JOIN payments p 
        ON p.session_id = s.id AND p.user_id = u.id
    WHERE p.id = $1
`,
      [id]
    );

    const resData = res.rows?.[0] ?? null;

    if (resData) {
      const emailData = {
        email: resData?.email,
        fullName: `${resData?.first_name} ${resData?.last_name}`,
        amount: resData?.amount,
        sessionName: resData?.session_name,
      };

      await sendPaymentReminderEmail(emailData);
    }

    return NextResponse.json({ message: 'Done' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
