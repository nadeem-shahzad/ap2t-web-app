import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { ...updates } = data;

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

    const query = `
          UPDATE square_connections 
          SET ${fields.join(', ')}
          RETURNING id
      `;

    const res = await pool.query(query, values);
    if (res.rows.length === 0) {
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

      await pool.query(
        `INSERT INTO square_connections (${fields.join(',')})
       VALUES (${placeholders})`,
        values
      );

      return NextResponse.json({ message: 'Data inserted' }, { status: 201 });
    }

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.log('Error updating data:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await pool.query(`
                SELECT * FROM square_connections ORDER BY id ASC LIMIT 1`);
    const data = result.rows?.[0] ?? {};
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
