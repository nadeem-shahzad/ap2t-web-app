import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await pool.query(`SELECT * FROM testimonials WHERE admin IS TRUE OR show IS TRUE`);
    const data = res.rows.map((item) => {
      return {
        star: item.rating,
        title: item.title,
        description: item.description,
        person: {
          name: item.name,
          details: item.designation,
        },
      };
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Server' }, { status: 500 });
  }
}
