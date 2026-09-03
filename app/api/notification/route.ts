import pool from "@/lib/db";
import { TriggerFirebaseForNotifications } from "@/lib/triggerFirebase";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {

    try {
        const searchParams = req.nextUrl.searchParams
        const id = searchParams.get("user")
      const query = await pool.query(`
WITH unread AS (
  SELECT 
    n.*,
    u.first_name AS to_name
  FROM notifications n
  JOIN users u ON u.id = n."to"
  WHERE n."to" = $1 AND n."read" = false
  ORDER BY n.created_at DESC
),
read AS (
  SELECT 
    n.*,
    u.first_name AS to_name
  FROM notifications n
  JOIN users u ON u.id = n."to"
  WHERE n."to" = $1 AND n."read" = true
  ORDER BY n.created_at DESC
  LIMIT GREATEST(50 - (SELECT COUNT(*) FROM unread), 0)
)
SELECT * FROM unread
UNION ALL
SELECT * FROM read
ORDER BY "read" ASC, created_at DESC;
`, [id]);
        return NextResponse.json(query.rows, {status:200})
    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }
}


export async function PUT(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams
        const user_id = searchParams.get("user_id")
        const data = await req.json();
        const { id, ...updates } = data;

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

        if (fields.length === 0) {
            return NextResponse.json({ message: "No valid data provided for update" }, { status: 400 });
        }

        values.push(id);
        const query = `
          UPDATE notifications 
          SET ${fields.join(", ")}
          WHERE id = $${values.length}
          RETURNING "to"
      `;

        const queryResult = await pool.query(query, values);

        // Notify the notification's actual recipient. This keeps the Firestore
        // document watched by useNotifications in sync even if the client omits
        // or sends an incorrect user_id.
        const recipientId = queryResult.rows[0]?.to ?? user_id;
        await TriggerFirebaseForNotifications(recipientId)


        return NextResponse.json({ message: "Updated successfully" }, { status: 200 });
    } catch (error : any) {
        console.log("Error updating data:", error?.message);
        return NextResponse.json({ message:  error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0
