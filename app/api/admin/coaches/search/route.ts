import pool from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const activeOnly = req.nextUrl.searchParams.get("active_only") === "true";
    const activeCoachFilter = activeOnly ? "AND LOWER(u.status) = 'active'" : "";

    const result = await pool.query(
      `SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.picture,
  c.schedule_preference AS schedule
FROM users u
INNER JOIN coaches c ON c.user_id = u.id
WHERE u.role = 'coach' ${activeCoachFilter};`,
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/admin/coaches/search error:", error);

    return NextResponse.json(
      { message: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
export const revalidate = 0
