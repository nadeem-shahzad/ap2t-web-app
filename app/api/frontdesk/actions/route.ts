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

        const { session_id, user_id, session_date, variant_id, price: _clientPrice, ...action } = data
        if (!session_id || !user_id) {
          return NextResponse.json({ message: "Session and player are required" }, { status: 400 });
        }

        // Do not persist a browser-supplied price. Resolve the base/promo or
        // selected-variant amount from the database, then save the final
        // server-calculated amount including any sibling discount.
        const sessionRes = await pool.query(
          `SELECT s.*, sd.price AS fixed_price, sd.promotion_price AS fixed_promotion_price, sd.is_active AS fixed_is_active
           FROM sessions s LEFT JOIN session_dates sd
             ON sd.session_id = s.id AND sd.date = $2::date
           WHERE s.id = $1`,
          [session_id, session_date ?? new Date().toISOString().slice(0, 10)]
        );
        const session = sessionRes.rows[0];
        if (!session) return NextResponse.json({ message: "Session not found" }, { status: 404 });
        if (session.date_mode === 'fixed_dates' && (!session.fixed_price || !session_date || !session.fixed_is_active)) {
          return NextResponse.json({ message: "Selected session date is unavailable" }, { status: 400 });
        }
        let amount = session.date_mode === 'fixed_dates' ? Number(session.fixed_price) : Number(session.price);
        if (variant_id) {
          const variant = await pool.query(`SELECT price FROM session_variants WHERE id = $1 AND session_id = $2`, [variant_id, session_id]);
          if (!variant.rows[0]) return NextResponse.json({ message: "Invalid session variant" }, { status: 400 });
          amount = Number(variant.rows[0].price);
        } else if (session.comped) {
          amount = 0;
        } else {
          const promo = session.date_mode === 'fixed_dates' ? session.fixed_promotion_price : session.promotion_price;
          const today = new Date().toISOString().slice(0, 10);
          if (session.apply_promotion && promo && session.promotion_start && session.promotion_end && today >= String(session.promotion_start).slice(0, 10) && today <= String(session.promotion_end).slice(0, 10)) amount = Number(promo);
        }
        const siblingCheck = await pool.query(
          `SELECT EXISTS (SELECT 1 FROM players me JOIN players sibling ON sibling.parent_id = me.parent_id
             JOIN session_players sp ON sp.user_id = sibling.user_id AND sp.session_id = $2
             WHERE me.user_id = $1 AND sibling.user_id <> $1) AS eligible`, [user_id, session_id]
        );
        const siblingDiscount = Boolean(siblingCheck.rows[0]?.eligible) && !session.comped;
        const finalAmount = siblingDiscount ? amount * 0.9 : amount;
        const canonicalData = { ...action, user_id, session_id, session_date: session_date ?? null, price: finalAmount, price_is_final: true };

        const checkExisting = await pool.query(
          `SELECT id FROM front_desk_actions
           WHERE session_id = $1 AND user_id = $2
             AND ($3::date IS NULL OR session_date::date = $3::date)
           ORDER BY id DESC LIMIT 1`,
          [session_id, user_id, session_date ?? null]
        )
        if (checkExisting.rows.length === 0) {
            console.log(1)
            const fields = Object.keys(canonicalData);
            const values = Object.values(canonicalData);
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
            const { ...updates } = canonicalData;

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

        // Return the exact server-calculated amount shown to the user.
        return NextResponse.json({ message: "Done", price: finalAmount, sibling_discount: siblingDiscount }, { status: 200 })
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
             AND (NOT (COALESCE(s.is_daily_payment, FALSE) OR s.date_mode = 'fixed_dates') OR fda.session_date::date = $3::date)
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
