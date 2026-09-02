import pool from "@/lib/db";
import { NextResponse } from "next/server";


export async function GET() {

    try {
       const result = await pool.query(`
  SELECT
    s.id,
    s.session_type,
    s.type,
    s.name,
    s.description,
    s.date,
    s.image,
    s.end_date,
    s.start_time,
    s.end_time,
    s.age_limit,
    s.location,
    s.apply_promotion,
    s.promotion_price,
    s.price,
    s.max_players,
    COUNT(sp.user_id) AS total_enrolled_players,
    (s.max_players - COUNT(sp.user_id)) AS total_left
  FROM sessions s
  LEFT JOIN session_players sp ON sp.session_id = s.id
  WHERE s.apply_promotion IS TRUE
  GROUP BY s.id
  ORDER BY s.date ASC
`);

const sessionsWithCounts = result.rows.map((r: any) => ({
  ...r,
  total_enrolled_players: Number(r.total_enrolled_players),
  total_left: Number(r.total_left),
}));
        return NextResponse.json(sessionsWithCounts, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server errror" }, { status: 500 })
    }
}
export const revalidate = 0