import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userid = searchParams.get('user_id');

  if (!userid) {
    return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
  }

  try {
    const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [userid]);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    let settingsResult = await pool.query(`SELECT * FROM settings WHERE user_id = $1`, [userid]);

    if (settingsResult.rows.length === 0) {
      const res = await pool.query(`INSERT INTO settings (user_id) VALUES ($1) RETURNING *`, [
        userid,
      ]);

      settingsResult = res;
    }

    const settings = settingsResult.rows[0];

    return NextResponse.json(
      {
        user,
        settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    const fields: any[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        fields.push(`${key} = $${index + 1}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ message: 'No valid data provided for update' }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE settings 
          SET ${fields.join(', ')}
          WHERE user_id = $${values.length}
      `;

    await pool.query(query, values);

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.log('Error updating data:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
