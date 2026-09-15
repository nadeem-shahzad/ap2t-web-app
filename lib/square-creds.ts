'use server';
import pool from './db';

export async function GetSquare() {
  const res = await pool.query(`SELECT * from square_connections`);
  const data = res.rows?.[0];

  if (!data) return { error: 'No credentials found' };

  if (data?.mode)
    return {
      apiKey: data?.test_api_key,
      merchant: data?.test_merchant_id,
      location: data?.test_location_id,
      mode: true,
    };
  else
    return {
      apiKey: data?.live_api_key,
      merchant: data?.live_merchant_id,
      location: data?.live_location_id,
      mode: false,
    };
}
