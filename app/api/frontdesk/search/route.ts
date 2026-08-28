import pool from "@/lib/db";
import { joinNames } from "@/lib/functions";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
    try {

        const searchParams = req.nextUrl.searchParams
        const query = searchParams.get("query")?.trim();

        if (!query) {
            return NextResponse.json([], { status: 200 });
        }

        const words = query.split(/\s+/);

        const userConditions = words
            .map((_, idx) => `(u.first_name || ' ' || u.last_name) ILIKE $${idx + 2}`)
            .join(" AND ");

        const userValues = words.map((word) => `%${word}%`);

        const userQuery = `
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.role,
  u.picture,
  u.email,
  u.square_card_id,
  p.parent_id,
  parent.email AS parent_email
FROM users u
LEFT JOIN players p 
  ON p.user_id = u.id
LEFT JOIN users parent 
  ON parent.id = p.parent_id
WHERE 
  u.role = ANY($1::text[]) 
  AND ${userConditions}
`;

        const userQueryParams = [["player"], ...userValues];

        const usersRes = await pool.query(userQuery, userQueryParams);

        const users = usersRes.rows.map((user: any) => ({
            ...user,
            name: joinNames([user?.first_name, user?.last_name]),
            hasCardOnFile: !!user?.square_card_id
        }));

        if (!users.length) {
            return NextResponse.json({ prebooked: [], walkin: [] });
        }

        const userIds = users.map((u) => u.id);

        const sessionsRes = await pool.query(
            `
    SELECT 
      se.user_id,
      s.id,
      s.name ,
      s.start_time,
      s.end_time,
      COALESCE(p.amount, s.price) AS price,
      p.amount AS payment_amount,
      p.status AS payment_status,
      s.apply_promotion,
      s.promotion_price,
      s.date
    FROM session_players se
    JOIN sessions s ON s.id = se.session_id
    LEFT JOIN LATERAL (
      SELECT amount, status
      FROM payments
      WHERE session_id = se.session_id
        AND user_id = se.user_id
      ORDER BY id DESC
      LIMIT 1
    ) p ON true
    WHERE 
      se.user_id = ANY($1::int[])
      AND CURRENT_DATE BETWEEN s.date AND s.end_date
      AND s.status = ANY($2::text[])
  `,
            [userIds, ["upcoming", "ongoing"]]
        );

        const sessions = sessionsRes.rows;

        // map sessions by user
        const sessionMap: Record<number, any[]> = {};

        for (const session of sessions) {
            if (!sessionMap[session.user_id]) {
                sessionMap[session.user_id] = [];
            }
            sessionMap[session.user_id].push(session);
        }

        const withSession: any[] = [];
        const withoutSession: any[] = [];

        for (const user of users) {
    const userSessions = sessionMap[user.id];

    // ✅ Always add one walk-in entry
    withoutSession.push({
        user: user,
        session: null
    });

    // ✅ If sessions exist, also add prebooked entries
    if (userSessions?.length) {
        for (const s of userSessions) {
            withSession.push({
                user: user,
                session: s
            });
        }
    }
}


        return NextResponse.json({ prebooked: withSession, walkin: withoutSession }, { status: 200 });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}
