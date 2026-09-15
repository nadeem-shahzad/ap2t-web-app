import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const position_list = searchParams.get('position_list') === 'true';
  const skill_level_list = searchParams.get('skill_level_list') === 'true';
  const session_types = searchParams.get('session_types') === 'true';
  const comped_category_list = searchParams.get('comped_category_list') === 'true';
  try {
    if (position_list) {
      const result = await pool.query(`SELECT position_list FROM configurations`);
      return NextResponse.json(result.rows?.[0]?.position_list ?? [], { status: 200 });
    }

    if (skill_level_list) {
      const result = await pool.query(`SELECT skill_level_list FROM configurations`);
      return NextResponse.json(result.rows?.[0]?.skill_level_list ?? [], { status: 200 });
    }

    if (session_types) {
      const result = await pool.query(`SELECT session_types FROM configurations`);
      return NextResponse.json(result.rows?.[0]?.session_types ?? [], { status: 200 });
    }

    if (comped_category_list) {
      const result = await pool.query(`SELECT comped_category_list FROM configurations`);
      return NextResponse.json(result.rows?.[0]?.comped_category_list ?? [], { status: 200 });
    }
    const result = await pool.query(`SELECT * FROM configurations`);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
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
          UPDATE configurations 
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
