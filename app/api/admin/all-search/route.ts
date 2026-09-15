import pool from '@/lib/db';
import { joinNames } from '@/lib/functions';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query')?.trim();

    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    const words = query.split(/\s+/);

    const userConditions = words
      .map((_, idx) => `(first_name || ' ' || last_name) ILIKE $${idx + 2}`)
      .join(' AND ');

    const userValues = words.map((word) => `%${word}%`);

    const userQuery = `SELECT id, first_name, last_name, role
       FROM users
       WHERE role = ANY($1::text[]) AND ${userConditions}`;
    const userQueryParams = [['coach', 'player'], ...userValues];

    const sessionConditions = words.map((_, idx) => `name ILIKE $${idx + 1}`).join(' AND ');

    const sessionQuery = `SELECT id, name
       FROM sessions
       WHERE ${sessionConditions}`;

    const sessionQueryParams = [...userValues];

    const usersRes = await pool.query(userQuery, userQueryParams);
    const sessionsRes = await pool.query(sessionQuery, sessionQueryParams);

    const users = usersRes.rows.map((user: any) => ({
      id: user.id,
      name: joinNames([user?.first_name, user?.last_name]),
      route: `/portal/admin/${user.role === 'player' ? 'players' : 'coaches'}/${user.id}`,
    }));

    const sessions = sessionsRes.rows.map((session: any) => ({
      id: session.id,
      name: session.name,
      route: `/portal/admin/sessions/${session.id}`,
    }));

    const data = [...users, ...sessions];

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
export const revalidate = 0;
