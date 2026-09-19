import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { joinNames } from '@/lib/functions';
import moment from 'moment';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const filter = searchParams.get('filter') === 'true';

    const startDate = startParam
      ? moment(startParam).startOf('day').toISOString()
      : moment().subtract(6, 'months').startOf('day').toISOString();
    const endDate = endParam
      ? moment(endParam).endOf('day').toISOString()
      : moment().endOf('day').toISOString();

    if (!filter) {
      const [revenueRes, sessionsRes, pendingRes, compedRes] = await Promise.all([
        pool.query(`SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='paid'`),
        pool.query(`SELECT COUNT(*) AS total FROM sessions`),
        pool.query(`SELECT COUNT(*) AS total FROM payments WHERE status NOT IN ('paid', 'comped')`),
        pool.query(`SELECT COUNT(*) AS total FROM payments WHERE status='comped'`),
      ]);

      const totalRevenue = Number(revenueRes.rows[0].total);
      const totalSessions = Number(sessionsRes.rows[0].total);
      const totalPending = Number(pendingRes.rows[0].total);
      const totalComped = Number(compedRes.rows[0].total);

      const attendanceRes = await pool.query(`
      SELECT session_id, status
      FROM attendance
    `);

      const attendanceMap: Record<number, { present: number; total: number }> = {};

      attendanceRes.rows.forEach((row) => {
        if (!attendanceMap[row.session_id]) {
          attendanceMap[row.session_id] = { present: 0, total: 0 };
        }
        attendanceMap[row.session_id].total++;
        if (row.status === 'present') attendanceMap[row.session_id].present++;
      });

      const attendanceRates = Object.values(attendanceMap).map((s) => (s.present / s.total) * 100);

      const averageAttendance =
        attendanceRates.length > 0
          ? Number((attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length).toFixed(2))
          : 0;

      const coachRevenueRes = await pool.query(`
      SELECT 
        s.coach_id,
        u.first_name,
        u.last_name,
        p.amount
      FROM payments p
      JOIN sessions s ON p.session_id = s.id
      JOIN users u ON s.coach_id = u.id
      WHERE p.status = 'paid'
    `);

      const coachRevenueMap: Record<string, number> = {};

      coachRevenueRes.rows.forEach((row) => {
        const coachName = joinNames([row.first_name, row.last_name]);
        coachRevenueMap[coachName] = (coachRevenueMap[coachName] || 0) + Number(row.amount);
      });

      const revenueByCoach = Object.entries(coachRevenueMap).map(([coach, value]) => ({
        coach,
        value,
      }));

      const sessionTypeConfigRes = await pool.query(`
  SELECT session_types FROM configurations LIMIT 1
`);

      const sessionTypes: string[] = sessionTypeConfigRes.rows[0]?.session_types || [];

      const sessionsTypeRes = await pool.query(`
  SELECT session_type FROM sessions
`);

      const sessionTypeCountMap: Record<string, number> = {};

      sessionTypes.forEach((t) => (sessionTypeCountMap[t] = 0));

      sessionsTypeRes.rows.forEach((row) => {
        if (row.session_type && sessionTypeCountMap[row.session_type] !== undefined) {
          sessionTypeCountMap[row.session_type]++;
        }
      });

      const sessionTypeData = sessionTypes.map((type, idx) => ({
        name: type,
        value: sessionTypeCountMap[type] || 0,
        fill: `var(--chart-${idx + 1})`,
      }));

      const monthlyRevenueRes = await pool.query(`
      SELECT 
        DATE_TRUNC('month', paid_at) AS month,
        SUM(amount) AS total
      FROM payments
      WHERE status='paid'
        AND paid_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month
    `);

      const monthlyRevenueTrend = monthlyRevenueRes.rows.map((row) => ({
        month: new Date(row.month).toLocaleString('en-US', { month: 'long' }),
        value: Number(row.total),
      }));

      const playerAttendanceRes = await pool.query(`
      SELECT 
        u.first_name,
        u.last_name,
        a.status
      FROM attendance a
      JOIN users u ON a.user_id = u.id
    `);

      const playerMap: Record<string, { sessions: number; attended: number; missed: number }> = {};

      playerAttendanceRes.rows.forEach((row) => {
        const name = `${row.first_name} ${row.last_name}`;
        if (!playerMap[name]) {
          playerMap[name] = { sessions: 0, attended: 0, missed: 0 };
        }
        playerMap[name].sessions++;
        row.status === 'present' ? playerMap[name].attended++ : playerMap[name].missed++;
      });

      const playerAttendanceData = Object.entries(playerMap).map(([name, d], i) => ({
        id: i,
        name,
        sessions: d.sessions,
        attended: d.attended,
        missed: d.missed,
        attendance_rate: Number(((d.attended / d.sessions) * 100).toFixed(1)),
      }));

      const zipcodeQuery = await pool.query(`
  SELECT
    u.zip_code,
    COUNT(DISTINCT u.id)        AS total_users,
    COALESCE(SUM(p.amount), 0)  AS total_revenue,
    COALESCE(AVG(p.amount), 0)  AS avg_revenue
  FROM users u
  LEFT JOIN payments p
    ON p.user_id = u.id
      AND p.status = 'paid'
  WHERE u.zip_code IS NOT NULL
    AND u.zip_code <> ''

  GROUP BY u.zip_code
  ORDER BY u.zip_code
`);

      return NextResponse.json({
        totals: {
          totalRevenue,
          totalSessions,
          totalPending,
          totalComped,
          averageAttendance,
        },
        revenueByCoach,
        sessionTypeData,
        monthlyRevenueTrend,
        playerAttendanceData,
        zipcodeData: zipcodeQuery.rows,
      });
    } else {
      const [revenueRes, sessionsRes, pendingRes, compedRes] = await Promise.all([
        pool.query(
          `SELECT COALESCE(SUM(amount),0) AS total 
         FROM payments 
         WHERE status='paid' 
           AND created_at BETWEEN $1 AND $2`,
          [startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(*) AS total 
         FROM sessions 
         WHERE created_at BETWEEN $1 AND $2`,
          [startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(*) AS total 
         FROM payments 
         WHERE status != ANY($1::text[]) 
           AND created_at BETWEEN $2 AND $3`,
          [['paid', 'comped'], startDate, endDate]
        ),
        pool.query(
          `SELECT COUNT(*) AS total 
         FROM payments 
         WHERE status='comped' 
           AND created_at BETWEEN $1 AND $2`,
          [startDate, endDate]
        ),
      ]);

      const totalRevenue = Number(revenueRes.rows[0].total);
      const totalSessions = Number(sessionsRes.rows[0].total);
      const totalPending = Number(pendingRes.rows[0].total);
      const totalComped = Number(compedRes.rows[0].total);

      const attendanceRes = await pool.query(
        `SELECT session_id, status, created_at
       FROM attendance
       WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const attendanceMap: Record<number, { present: number; total: number }> = {};
      attendanceRes.rows.forEach((row) => {
        if (!attendanceMap[row.session_id])
          attendanceMap[row.session_id] = { present: 0, total: 0 };
        attendanceMap[row.session_id].total++;
        if (row.status === 'present') attendanceMap[row.session_id].present++;
      });

      const attendanceRates = Object.values(attendanceMap).map((s) => (s.present / s.total) * 100);
      const averageAttendance = attendanceRates.length
        ? Number((attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length).toFixed(2))
        : 0;

      const coachRevenueRes = await pool.query(
        `SELECT s.coach_id, u.first_name, u.last_name, p.amount
       FROM payments p
       JOIN sessions s ON p.session_id = s.id
       JOIN users u ON s.coach_id = u.id
       WHERE p.status='paid'
         AND p.created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const coachRevenueMap: Record<string, number> = {};
      coachRevenueRes.rows.forEach((row) => {
        const coachName = `${row.first_name} ${row.last_name}`;
        coachRevenueMap[coachName] = (coachRevenueMap[coachName] || 0) + Number(row.amount);
      });

      const revenueByCoach = Object.entries(coachRevenueMap).map(([coach, value]) => ({
        coach,
        value,
      }));

      const sessionTypeConfigRes = await pool.query(
        `SELECT session_types FROM configurations LIMIT 1`
      );
      const sessionTypes: string[] = sessionTypeConfigRes.rows[0]?.session_types || [];

      const sessionsTypeRes = await pool.query(
        `SELECT session_type FROM sessions WHERE created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const sessionTypeCountMap: Record<string, number> = {};
      sessionTypes.forEach((t) => (sessionTypeCountMap[t] = 0));
      sessionsTypeRes.rows.forEach((row) => {
        if (row.session_type && sessionTypeCountMap[row.session_type] !== undefined)
          sessionTypeCountMap[row.session_type]++;
      });

      const sessionTypeData = sessionTypes.map((type, idx) => ({
        name: type,
        value: sessionTypeCountMap[type] || 0,
        fill: `var(--chart-${idx + 1})`,
      }));

      const monthlyRevenueRes = await pool.query(
        `SELECT DATE_TRUNC('month', paid_at) AS month, SUM(amount) AS total
       FROM payments
       WHERE status='paid'
         AND paid_at BETWEEN $1 AND $2
       GROUP BY month
       ORDER BY month`,
        [startDate, endDate]
      );

      const monthlyRevenueTrend = monthlyRevenueRes.rows.map((row) => ({
        month: new Date(row.month).toLocaleString('en-US', { month: 'long' }),
        value: Number(row.total),
      }));

      const playerAttendanceRes = await pool.query(
        `SELECT u.first_name, u.last_name, a.status
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.created_at BETWEEN $1 AND $2`,
        [startDate, endDate]
      );

      const playerMap: Record<string, { sessions: number; attended: number; missed: number }> = {};
      playerAttendanceRes.rows.forEach((row) => {
        const name = `${row.first_name} ${row.last_name}`;
        if (!playerMap[name]) playerMap[name] = { sessions: 0, attended: 0, missed: 0 };
        playerMap[name].sessions++;
        row.status === 'present' ? playerMap[name].attended++ : playerMap[name].missed++;
      });

      const playerAttendanceData = Object.entries(playerMap).map(([name, d], i) => ({
        id: i,
        name,
        sessions: d.sessions,
        attended: d.attended,
        missed: d.missed,
        attendance_rate: Number(((d.attended / d.sessions) * 100).toFixed(1)),
      }));

      const zipcodeQuery = await pool.query(
        `SELECT u.zip_code,
              COUNT(DISTINCT u.id) AS total_users,
              COALESCE(SUM(p.amount),0) AS total_revenue,
              COALESCE(AVG(p.amount),0) AS avg_revenue
       FROM users u
       LEFT JOIN payments p ON p.user_id = u.id AND p.status='paid' AND p.created_at BETWEEN $1 AND $2
       WHERE u.zip_code IS NOT NULL AND u.zip_code <> ''
       GROUP BY u.zip_code
       ORDER BY u.zip_code`,
        [startDate, endDate]
      );

      return NextResponse.json({
        totals: { totalRevenue, totalSessions, totalPending, totalComped, averageAttendance },
        revenueByCoach,
        sessionTypeData,
        monthlyRevenueTrend,
        playerAttendanceData,
        zipcodeData: zipcodeQuery.rows,
      });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
export const revalidate = 0;
