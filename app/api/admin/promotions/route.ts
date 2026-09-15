import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    const data = await req.json();

    const result = await pool.query(
      `
            Insert INTO promotions
            (title,description,image,original_price,promotion_price,start_date,end_date,square_check_url,show_storefront)
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING *;
            `,
      [
        data.title,
        data.description,
        data.image,
        data.original_price,
        data.promotion_price,
        data.start_date,
        data.end_date,
        data.square_check_url,
        data.show_storefront,
      ]
    );
    return NextResponse.json({ success: true, item: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('PROMOTION POST ERROR:', error);

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT * FROM promotions
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/admin/promotions error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
