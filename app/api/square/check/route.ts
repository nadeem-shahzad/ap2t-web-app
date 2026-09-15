import pool from '@/lib/db';
import { DecryptString } from '@/lib/functions';
import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';

export async function GET(req: NextRequest) {
  try {
    const encrypted = req.nextUrl.searchParams.get('data') ?? '';
    const decrypted = DecryptString(decodeURIComponent(encrypted));

    const params = new URLSearchParams(decrypted);

    const mode = params.get('mode');
    const key = params.get('key');
    const location = params.get('location');
    let token = '';
    let localMode = 'test';
    let squareResult;

    if (key) {
      token = key;
    } else {
      const result = await pool.query(`
                SELECT * FROM square_connections ORDER BY id ASC LIMIT 1`);

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false }, { status: 200 });
      }

      squareResult = result.rows[0];
      if (mode === 'test') {
        token = squareResult.test_api_key;
        localMode = 'test';
      } else if (mode === 'live') {
        token = squareResult.live_api_key;
        localMode = 'live';
      } else if (squareResult.mode) {
        token = squareResult.test_api_key;
        localMode = 'test';
      } else {
        token = squareResult.live_api_key;
        localMode = 'live';
      }
    }
    const client = new SquareClient({
      token: token,
      environment: localMode === 'test' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });
    const response = await client.locations.list();
    let found = true;
    if (location) {
      const t = response?.locations?.filter((item) => item.id === location);
      if (t && t?.length === 0) found = false;
    }

    return Response.json({
      success: found,
      locations: response.locations,
    });
  } catch (error: any) {
    return Response.json({ message: error?.message || 'Square server error' }, { status: 500 });
  }
}
export const revalidate = 0;
