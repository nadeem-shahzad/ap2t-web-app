import pool from '@/lib/db';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const coach_id = searchParams.get('coach');

  if (!startParam || !endParam || !coach_id) {
    return NextResponse.json({ message: 'Parameters missing' }, { status: 400 });
  }

  const startDate = moment(startParam).startOf('day').toISOString();
  const endDate = moment(endParam).endOf('day').toISOString();

  const coachId = Number(coach_id);

  if (!startParam || !endParam || !coach_id) {
    return NextResponse.json({ message: 'Parameters missing' }, { status: 400 });
  }

  const [revenueRes, sessionsRes, pendingRes, compedRes] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(p.amount),0) AS total
         FROM payments p
         JOIN sessions s ON p.session_id = s.id
         WHERE p.status='paid'
           AND s.coach_id = $1
           AND p.created_at BETWEEN $2 AND $3`,
      [coachId, startDate, endDate]
    ),

    pool.query(
      `SELECT COUNT(*) AS total
         FROM sessions
         WHERE coach_id = $1
           AND created_at BETWEEN $2 AND $3`,
      [coachId, startDate, endDate]
    ),

    pool.query(
      `SELECT COUNT(*) AS total
         FROM payments p
         JOIN sessions s ON p.session_id = s.id
         WHERE p.status = 'pending'
           AND s.coach_id = $1
           AND p.created_at BETWEEN $2 AND $3`,
      [coachId, startDate, endDate]
    ),

    pool.query(
      `SELECT COUNT(*) AS total
         FROM payments p
         JOIN sessions s ON p.session_id = s.id
         WHERE p.status='comped'
           AND s.coach_id = $1
           AND p.created_at BETWEEN $2 AND $3`,
      [coachId, startDate, endDate]
    ),
  ]);

  const totalRevenue = Number(revenueRes.rows[0].total);
  const totalSessions = Number(sessionsRes.rows[0].total);
  const totalPending = Number(pendingRes.rows[0].total);
  const totalComped = Number(compedRes.rows[0].total);

  const sessionTypeConfigRes = await pool.query(`SELECT session_types FROM configurations LIMIT 1`);

  const sessionTypes: string[] = sessionTypeConfigRes.rows[0]?.session_types || [];

  const sessionsTypeRes = await pool.query(
    `SELECT session_type
     FROM sessions
     WHERE coach_id = $1
       AND created_at BETWEEN $2 AND $3`,
    [coachId, startDate, endDate]
  );

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

  const revenueBySessionRes = await pool.query(
    `SELECT 
        s.id AS session_id,
        s.name,
        COALESCE(SUM(p.amount), 0) AS total_revenue
     FROM sessions s
     LEFT JOIN payments p 
        ON p.session_id = s.id 
        AND p.status = 'paid'
        AND p.created_at BETWEEN $2 AND $3
     WHERE s.coach_id = $1
       AND s.created_at BETWEEN $2 AND $3
     GROUP BY s.id, s.name
     ORDER BY total_revenue DESC`,
    [coachId, startDate, endDate]
  );

  const revenueBySession = revenueBySessionRes.rows.map((row) => ({
    session_id: row.session_id,
    session_name: row.name,
    value: Number(row.total_revenue),
  }));

  return NextResponse.json({
    totals: {
      totalRevenue,
      totalSessions,
      totalPending,
      totalComped,
    },
    revenueBySession,
    sessionTypeData,
  });
}
export const revalidate = 0;
