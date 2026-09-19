import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  const { id: session_id, dateId } = await params;

  try {
    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];

    if (typeof body.is_signup_open === 'boolean') {
      fields.push(`is_signup_open = $${fields.length + 1}`);
      values.push(body.is_signup_open);
    }
    if (typeof body.is_active === 'boolean') {
      fields.push(`is_active = $${fields.length + 1}`);
      values.push(body.is_active);
    }
    if (body.max_players !== undefined) {
      const maxPlayers = Number(body.max_players);
      if (!Number.isInteger(maxPlayers) || maxPlayers <= 0) {
        return NextResponse.json(
          { message: 'max_players must be a positive integer' },
          { status: 400 }
        );
      }
      fields.push(`max_players = $${fields.length + 1}`);
      values.push(maxPlayers);
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: 'No valid fields provided' }, { status: 400 });
    }

    values.push(session_id, dateId);
    const result = await pool.query(
      `UPDATE session_dates
       SET ${fields.join(', ')}
       WHERE session_id = $${values.length - 1} AND id = $${values.length}
       RETURNING id, date, price, promotion_price, max_players, is_active, is_signup_open`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Date not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/admin/sessions/[id]/dates/[dateId] error:', error);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}
export const revalidate = 0;
