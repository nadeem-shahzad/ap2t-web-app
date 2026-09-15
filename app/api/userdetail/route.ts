import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const email = searchParams.get('email');

  try {
    if (!email) {
      return NextResponse.json({ message: 'Email missing' }, { status: 400 });
    }

    const query = await pool.query(
      `
            SELECT 
    u.*,
    CASE 
        WHEN u.role = 'player' THEN row_to_json(p)
        WHEN u.role = 'coach' THEN row_to_json(c)
        WHEN u.role = 'parent' THEN row_to_json(pr)
    END AS profile
FROM users u
LEFT JOIN players p ON p.user_id = u.id
LEFT JOIN coaches c ON c.user_id = u.id
LEFT JOIN parents pr ON pr.user_id = u.id
WHERE u.email = $1;`,
      [email]
    );

    const result = query.rows?.[0] ?? null;

    if (!result) {
      return NextResponse.json(
        { message: "We couldn't find your account. Sign up now to get started." },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message }, { status: 500 });
  }
}
export const revalidate = 0;
