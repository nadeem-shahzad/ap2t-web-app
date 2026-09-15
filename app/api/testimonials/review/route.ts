import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { title, description, name, designation, rating, token } = await req.json();

  if (!token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const link = await pool.query(`SELECT * FROM review_links WHERE token = $1`, [token]);

  if (link.rowCount === 0) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 400 });
  }

  const data = link.rows[0];

  if (data.used) {
    return NextResponse.json({ error: 'Link already used' }, { status: 400 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 400 });
  }

  await pool.query(
    `INSERT INTO testimonials (title, description, name, designation, rating)
     VALUES ($1, $2, $3, $4, $5)`,
    [title, description, name, designation, rating]
  );

  await pool.query(`UPDATE review_links SET used = TRUE WHERE id = $1`, [data.id]);

  return NextResponse.json({ success: true });
}
