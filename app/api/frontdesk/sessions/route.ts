import pool from "@/lib/db";
import moment from "moment";

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT 
        s.*,
        CASE
          WHEN COALESCE(s.is_daily_payment, FALSE) THEN (
            SELECT COUNT(*)
            FROM payments p
            WHERE p.session_id = s.id
              AND p.session_date::date = CURRENT_DATE
          )
          ELSE COUNT(sp.user_id)
        END AS total_enrolled,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object('id', sv.id, 'hour', sv.hour, 'price', sv.price)
              ORDER BY sv.id
            )
            FROM session_variants sv
            WHERE sv.session_id = s.id
          ),
          '[]'::json
        ) AS variants
      FROM sessions s
      LEFT JOIN session_players sp 
        ON s.id = sp.session_id
      WHERE s.status = ANY($1::text[])
      GROUP BY s.id
      ORDER BY s.date ASC
    `,
      [["ongoing", "upcoming"]]
    );

    const now = moment();

    const formatted = result.rows
      .map((session) => {
        const startDate = moment(session.date).startOf("day");
        const endDate = moment(session.end_date).endOf("day");
        const isInRange = now.isBetween(startDate, endDate, null, "[]");
        if (!isInRange) return null;
        const totalEnrolled = Number(session.total_enrolled) || 0;
        const spotsLeft = Math.max(
          0,
          session.max_players - totalEnrolled
        );

        let finalPrice = session.price;
        let promotion=false;

        if (session.comped) {
          finalPrice = 0;
        } else if (
          session.apply_promotion &&
          session.promotion_price &&
          session.promotion_end &&
          session.promotion_start &&
          now.isBetween(
            moment(session.promotion_start).startOf("day"),
            moment(session.promotion_end).endOf("day"),
            undefined,
            "[]",
          )
        ) {
          finalPrice = session.promotion_price;
          promotion=true
        }

        return {
          id: session.id,
          name: session.name,
          date: session.date,
          end_date: session.end_date,
          start_time: session.start_time,
          end_time: session.end_time,
          total_enrolled: totalEnrolled,
          max_players: session.max_players,
          spots_left: spotsLeft,
          promotion:promotion,
          price: finalPrice,
          original_price:session.price,
          status: session.status,
          is_daily_payment: session.is_daily_payment,
          variants: session.variants,
        };
      })
      .filter(Boolean);

    return Response.json(formatted);
  } catch (error) {
    console.error(error);
    return Response.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
