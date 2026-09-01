import pool from "@/lib/db";
import { TriggerFirebaseApprovals } from "@/lib/trigger-firebase";
import { NextRequest, NextResponse } from "next/server";

const isDateOnly = (value: unknown): value is string =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);


export async function POST(req: NextRequest) {


    try {
        const data = await req.json();
        if (!data || Object.keys(data).length === 0) {
            return NextResponse.json({ message: "Required parameters missing" }, { status: 400 });
        }

        const { session_id, user_id, session_date } = data

        const checkExisting = await pool.query(
          `SELECT id FROM front_desk_actions
           WHERE session_id = $1 AND user_id = $2
             AND ($3::date IS NULL OR session_date::date = $3::date)
           ORDER BY id DESC LIMIT 1`,
          [session_id, user_id, session_date ?? null]
        )
        if (checkExisting.rows.length === 0) {
            console.log(1)
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");


            await pool.query(
                `INSERT INTO front_desk_actions (${fields.join(",")})
       VALUES (${placeholders})
       `,
                values
            );
        } else {
          console.log(2)
            const id = checkExisting.rows[0]?.id ?? null
            const { ...updates } = data;

            if (!id) {
                return NextResponse.json({ message: "ID is required" }, { status: 400 });
            }

            const fields: any[] = [];
            const values: any[] = [];

            Object.entries(updates).forEach(([key, value], index) => {
                if (value !== undefined) {
                    fields.push(`${key} = $${index + 1}`);
                    values.push(value);
                }
            });
            values.push(id);
            const query = `
          UPDATE front_desk_actions 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
      `;

            await pool.query(query, values);
        }
        
        await TriggerFirebaseApprovals()

        return NextResponse.json({ message: "Done" }, { status: 200 })
    } catch (error: any) {
        console.log(error)
        return NextResponse.json(
            { message: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {

    try {
        const searchParams = req.nextUrl.searchParams
        const user_id = searchParams.get(`user_id`)
        const session_id = searchParams.get(`session_id`)
        const session_date = searchParams.get(`session_date`)

        const query = await pool.query(
          `SELECT fda.status FROM front_desk_actions fda
           JOIN sessions s ON s.id = fda.session_id
           WHERE fda.user_id = $1 AND fda.session_id = $2
             AND (NOT COALESCE(s.is_daily_payment, FALSE) OR fda.session_date::date = $3::date)
           ORDER BY fda.id DESC LIMIT 1`,
          [user_id, session_id, session_date]
        )

        const res = query.rows?.[0] ?? null

        return NextResponse.json(res, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }


}

export const revalidate = 0
