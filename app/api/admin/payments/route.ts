import pool from '@/lib/db';
import { GetProfileImage, joinNames } from '@/lib/functions';
import { sendPaymentReciept } from '@/lib/notification-service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const paymentsRes = await pool.query(
      `
      SELECT 
        p.*,
        s.name AS session_name,
        u.id AS player_user_id,
        u.first_name AS player_first_name,
        u.last_name AS player_last_name,
        u.picture AS player_picture,
        pl.parent_id,
        parent_u.first_name AS parent_first_name,
        parent_u.last_name AS parent_last_name
      FROM payments p
      LEFT JOIN sessions s ON p.session_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN players pl ON u.id = pl.user_id
      LEFT JOIN users parent_u ON pl.parent_id = parent_u.id
      ORDER BY p.created_at DESC
      `
    );

    const paymentsData = await Promise.all(
      paymentsRes.rows.map(async (row: any) => {
        let playerPictureUrl = await GetProfileImage(row.player_picture);
        return {
          ...row,
          player_picture: playerPictureUrl,
          player_name: joinNames([row.player_first_name, row.player_last_name]),
          parent_name: joinNames([row.parent_first_name, row.parent_last_name]),
        };
      })
    );

    const totalRevenue = paymentsData
      .filter((item) => item.status === 'paid')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalPending = paymentsData.filter((item) => item.status !== 'paid').length;
    const totalComped = paymentsData.filter((item) => item.status == 'comped').length;
    const totalFailed = paymentsData.filter((item) => item.status == 'failed').length;

    return NextResponse.json({
      totalRevenue,
      totalPending,
      totalFailed,
      totalComped,
      paymentsData,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
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
          UPDATE payments 
          SET ${fields.join(', ')}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    await sendPaymentReciept(data);

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
