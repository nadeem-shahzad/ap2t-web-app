import pool from "@/lib/db";
import { joinNames } from "@/lib/functions";
import { NextResponse } from "next/server";



function percentageChange(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return ((today - yesterday) / yesterday) * 100;
}

export async function GET() {
  try {
    
    
    const attendanceTodayRes = await pool.query(
      `SELECT COUNT(*) AS total_check_ins
       FROM attendance
       WHERE status = 'present'
         AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')`
    );
    const totalCheckIns = Number(attendanceTodayRes.rows[0]?.total_check_ins || 0);

    const attendanceYesterdayRes = await pool.query(
      `SELECT COUNT(*) AS total_check_ins
       FROM attendance
       WHERE status = 'present'
         AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'`
    );
    const yesterdayCheckIns = Number(attendanceYesterdayRes.rows[0]?.total_check_ins || 0);

    const checkInsDifference = totalCheckIns - yesterdayCheckIns;
    const checkInsChangePercentage = percentageChange(totalCheckIns, yesterdayCheckIns);

    
    const revenueTodayRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_revenue
   FROM payments
   WHERE status = 'paid'
     AND paid_at IS NOT NULL
     AND DATE(paid_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')`
    );
    const totalRevenue = Number(revenueTodayRes.rows[0]?.total_revenue || 0);

    const revenueYesterdayRes = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_revenue
   FROM payments
   WHERE status = 'paid'
     AND paid_at IS NOT NULL
     AND DATE(paid_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'`
    );
    const yesterdayRevenue = Number(revenueYesterdayRes.rows[0]?.total_revenue || 0);

    
    const revenueChangePercentage = percentageChange(totalRevenue, yesterdayRevenue);


    
    
    const pendingTodayRes = await pool.query(
      `SELECT COUNT(*) AS pending_count
       FROM payments
       WHERE status != ANY($1::text[])
         AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')`, [["paid", "comped"]]
    );
    const pendingToday = Number(pendingTodayRes.rows[0]?.pending_count || 0);

    const pendingYesterdayRes = await pool.query(
      `SELECT COUNT(*) AS pending_count
       FROM payments
       WHERE status != ANY($1::text[])
         AND DATE(created_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'`, [["paid", "comped"]]
    );
    const pendingYesterday = Number(pendingYesterdayRes.rows[0]?.pending_count || 0);

    const pendingChangePercentage = percentageChange(pendingToday, pendingYesterday);

        const sessionsDataRes = await pool.query(
      `SELECT s.id, s.session_type, s.name, s.start_time, s.end_time, s.coach_id, s.status, s.date, s.end_date,
              u.first_name AS coach_first_name,
              u.last_name AS coach_last_name
       FROM sessions s
       LEFT JOIN users u ON s.coach_id = u.id
       WHERE s.status = ANY($1 :: text[])
         AND DATE(s.date AT TIME ZONE 'UTC') <= DATE(NOW() AT TIME ZONE 'UTC')
         AND DATE(COALESCE(s.end_date, s.date) AT TIME ZONE 'UTC') >= DATE(NOW() AT TIME ZONE 'UTC')`, [["upcoming", "ongoing"]]
    );
    const upcomingToday = sessionsDataRes.rows.length;

    const upcomingYesterdayRes = await pool.query(
      `SELECT COUNT(*) AS total
       FROM sessions s
       WHERE s.status = ANY($1 :: text[])
         AND DATE(s.date AT TIME ZONE 'UTC') <= DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'
         AND DATE(COALESCE(s.end_date, s.date) AT TIME ZONE 'UTC') >= DATE(NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'`,
      [["upcoming", "ongoing"]]
    );
    const upcomingYesterday = Number(upcomingYesterdayRes.rows[0]?.total || 0);
    const upcomingChangePercentage = percentageChange(upcomingToday, upcomingYesterday);

    const sessionsData = sessionsDataRes.rows.map((s: any) => ({
      ...s,
      coach_name: joinNames([s.coach_first_name, s.coach_last_name]),
    }));

    
    
    const attendanceDataRes = await pool.query(
      `SELECT *
       FROM attendance
       WHERE status = 'present'`
    );
    const attendanceData = attendanceDataRes.rows;


    const paymentQuery = await pool.query(`
    SELECT
      p.id,
      p.amount,
      p.status,
      u.id AS user_id,
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      pu.id AS parent_id,
      pu.first_name AS parent_first_name,
      pu.last_name AS parent_last_name,
      s.name AS session_name
    FROM payments p
      LEFT JOIN users u
      ON u.id = p.user_id
    LEFT JOIN players pl
      ON pl.user_id = u.id
    LEFT JOIN users pu
      ON pu.id = pl.parent_id
    LEFT JOIN sessions s
      ON s.id = p.session_id
    WHERE p.status IN ('failed', 'pending')
    AND NOT EXISTS (
  SELECT 1
  FROM payment_alert_actions pa
  WHERE pa.payment_id = p.id
    AND DATE(pa.acted_at AT TIME ZONE 'UTC') = DATE(NOW() AT TIME ZONE 'UTC')
)
    ORDER BY p.created_at DESC;`)

    const enhancedData = paymentQuery.rows.map((item)=>{
      return (
        {...item,
          parent_name : joinNames([item.parent_first_name, item.parent_last_name]),
          player_name : joinNames([item.user_first_name, item.user_last_name]),
        }
      )
    })
    
    return NextResponse.json({
      totalCheckIns,
      checkInsDifference,
      checkInsChangePercentage: Number(checkInsChangePercentage.toFixed(0)),
      totalRevenue,
      revenueChangePercentage: Number(revenueChangePercentage.toFixed(0)),
      pendingToday,
      pendingChangePercentage: Number(pendingChangePercentage.toFixed(0)),
      upcomingToday,
      upcomingChangePercentage: Number(upcomingChangePercentage.toFixed(0)),
      attendanceData,
      sessionsData,
      paymentAlerts : enhancedData
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
export const revalidate = 0
