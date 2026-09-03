import pool from "@/lib/db";
import { TriggerFirebaseForNotifications } from "@/lib/triggerFirebase";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {

    const { user_id } = await req.json()


    try {
        if (!user_id) {
            return NextResponse.json({ message: "ID is missing" }, { status: 200 })
        }

        await pool.query(`
            UPDATE notifications SET read = $1 WHERE "to" = $2`, [true, user_id])

      await TriggerFirebaseForNotifications(user_id)

        return NextResponse.json({ message: "Done" }, { status: 200 })

    } catch (error: any) {
        console.log(error)
        return NextResponse.json({ message: error?.message || "Internal Server Error" }, { status: 500 });
    }
}

export const revalidate = 0