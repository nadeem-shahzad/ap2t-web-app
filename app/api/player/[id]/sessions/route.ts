import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const month  = req.nextUrl.searchParams.get("month")
const queryParams : (string | number | null)[] = [id]
  try {
    
    let query = `
       SELECT
      s.*,
      u.first_name AS coach_first_name,
      u.last_name  AS coach_last_name,
      u.picture AS coach_picture,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object('id', sv.id, 'hour', sv.hour, 'price', sv.price)
            ORDER BY sv.hour
          )
          FROM session_variants sv
          WHERE sv.session_id = s.id
        ),
        '[]'::jsonb
      ) AS variants,
      CASE 
        WHEN sp.user_id IS NOT NULL THEN true
        ELSE false
      END AS enrolled
    FROM sessions s
    LEFT JOIN users u 
      ON u.id = s.coach_id
    LEFT JOIN session_players sp
      ON sp.session_id = s.id
      AND sp.user_id = $1
  `;

  if(month){
     queryParams.push(month ? `${month}-01T00:00:00Z` : null)
    query += ` 
    WHERE
      s.date < DATE_TRUNC('month', COALESCE($2::timestamptz, NOW())) + INTERVAL '1 month'
      AND COALESCE(s.end_date, s.date) >= DATE_TRUNC('month', COALESCE($2::timestamptz, NOW()))
    `
   
  }

  query += ` ORDER BY s.date ASC`

    const result = await pool.query(query, queryParams);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET /api/admin/sessions error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export const revalidate = 0
