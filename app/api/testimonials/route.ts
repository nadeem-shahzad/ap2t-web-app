import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await pool.query(`SELECT * FROM testimonials`);
    return NextResponse.json(res.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server Error' }, { status: 500 });
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
          UPDATE testimonials 
          SET ${fields.join(', ')}
          WHERE id = $${values.length}
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
