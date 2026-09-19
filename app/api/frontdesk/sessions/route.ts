import pool from "@/lib/db";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

// The amount returned here is the amount shown to the walk-in. Payment
// endpoints calculate it again under a lock before recording or charging it.
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("user_id");
    const result = await pool.query(
      `SELECT s.*, (SELECT COUNT(*) FROM session_players sp WHERE sp.session_id = s.id) AS total_enrolled,
              sd.id AS session_date_id, sd.date AS occurrence_date,
              sd.price AS occurrence_price, sd.promotion_price AS occurrence_promotion_price,
              sd.max_players AS occurrence_max_players, sd.is_active,
              COALESCE((SELECT COUNT(DISTINCT p.user_id) FROM payments p
                WHERE p.session_id = s.id AND p.session_date::date = COALESCE(sd.date, CURRENT_DATE)
                  AND p.status NOT IN ('failed', 'refunded')), 0) AS occurrence_enrolled,
              COALESCE((SELECT json_agg(json_build_object('id', sv.id, 'hour', sv.hour, 'price', sv.price) ORDER BY sv.id)
                FROM session_variants sv WHERE sv.session_id = s.id), '[]'::json) AS variants,
              EXISTS (SELECT 1 FROM players me JOIN players sibling ON sibling.parent_id = me.parent_id
                JOIN session_players sp ON sp.user_id = sibling.user_id AND sp.session_id = s.id
                WHERE me.user_id = $1 AND sibling.user_id <> $1) AS sibling_discount_eligible
       FROM sessions s
       LEFT JOIN session_dates sd ON sd.session_id = s.id AND sd.date = CURRENT_DATE
       WHERE s.status = ANY($2::text[])
         AND ((s.date_mode = 'fixed_dates' AND sd.id IS NOT NULL AND sd.is_active)
           OR (s.date_mode <> 'fixed_dates' AND CURRENT_DATE BETWEEN s.date::date AND COALESCE(s.end_date, s.date)::date))
       ORDER BY s.date ASC`,
      [userId ? Number(userId) : -1, ["ongoing", "upcoming"]],
    );
    const now = moment();
    const sessions = result.rows.map((s: any) => {
      const fixed = s.date_mode === "fixed_dates";
      const original = Number(fixed ? s.occurrence_price : s.price);
      const promo = fixed ? s.occurrence_promotion_price : s.promotion_price;
      const promoLive = Boolean(s.apply_promotion && promo && s.promotion_start && s.promotion_end && now.isBetween(moment(s.promotion_start).startOf("day"), moment(s.promotion_end).endOf("day"), undefined, "[]"));
      const undiscounted = s.comped ? 0 : promoLive ? Number(promo) : original;
      const discount = Boolean(userId && s.sibling_discount_eligible && !s.comped);
      const price = discount ? undiscounted * 0.9 : undiscounted;
      const max = Number(fixed ? s.occurrence_max_players : s.max_players);
      const enrolled = fixed || s.is_daily_payment ? Number(s.occurrence_enrolled) : Number(s.total_enrolled || 0);
      return { id: s.id, name: s.name, date: fixed ? s.occurrence_date : s.date, end_date: s.end_date, start_time: s.start_time, end_time: s.end_time, date_mode: s.date_mode, occurrence_date: fixed || s.is_daily_payment ? moment().format("YYYY-MM-DD") : null, session_date_id: s.session_date_id, total_enrolled: enrolled, max_players: max, spots_left: Math.max(0, max - enrolled), promotion: promoLive, price, original_price: original, sibling_discount: discount, status: s.status, session_type: s.session_type, is_daily_payment: s.is_daily_payment, variants: (s.variants || []).map((v: any) => ({ ...v, price: discount ? Number(v.price) * 0.9 : Number(v.price) })) };
    }).filter((s: any) => s.spots_left > 0);
    const weekend = [0, 6].includes(new Date().getDay());
    return NextResponse.json(weekend ? sessions.filter((s: any) => String(s.session_type).trim().toLowerCase() === "private session") : sessions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
