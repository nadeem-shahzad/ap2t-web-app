import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    if (!id) {
      return NextResponse.json({ message: 'Id is missing' }, { status: 400 });
    }
    const result = await pool.query(
      `
          SELECT 
    s.id,
    s.name
FROM sessions s
INNER JOIN session_players sp 
    ON sp.session_id = s.id
WHERE sp.user_id = $1
ORDER BY s.created_at DESC
`,
      [id]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
export const revalidate = 0;
