import admin from '@/lib/firebase-admin';
import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { PersonalAnalyticsPayment, PersonalAnalyticsSession } from '@/lib/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function apiError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;

    if (!token) return apiError('Authentication is required', 401);

    const decodedToken = await admin.auth().verifyIdToken(token);
    if (!decodedToken.email) return apiError('Authenticated account has no email', 401);

    const { searchParams } = req.nextUrl;
    const includeChildren = searchParams.get('children') === 'true';
    const playerId = Number(searchParams.get('playerId'));
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!Number.isInteger(playerId) || playerId <= 0) {
      return apiError('A valid playerId is required', 400);
    }
    if (!start || !end || !DATE_PATTERN.test(start) || !DATE_PATTERN.test(end)) {
      return apiError('Start and end dates must use YYYY-MM-DD', 400);
    }
    if (start > end) return apiError('Start date cannot be after end date', 400);

    const requesterResult = await pool.query(
      'SELECT id, role, status FROM users WHERE email = $1 LIMIT 1',
      [decodedToken.email]
    );
    const requester = requesterResult.rows[0];

    if (!requester || requester.status !== 'active') {
      return apiError('Your account is not authorized', 403);
    }

    if (includeChildren) {
      if (requester.role !== 'parent')
        return apiError('Only parents can view linked children', 403);

      const childrenResult = await pool.query(
        `SELECT u.id, u.first_name, u.last_name
         FROM players p
         INNER JOIN users u ON u.id = p.user_id
         WHERE p.parent_id = $1
         ORDER BY u.first_name ASC, u.last_name ASC`,
        [requester.id]
      );

      return NextResponse.json({
        children: childrenResult.rows.map((child) => ({
          id: child.id,
          name: [child.first_name, child.last_name].filter(Boolean).join(' '),
        })),
      });
    }

    const playerResult = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, p.parent_id
       FROM users u
       INNER JOIN players p ON p.user_id = u.id
       WHERE u.id = $1
       LIMIT 1`,
      [playerId]
    );
    const player = playerResult.rows[0];
    if (!player) return apiError('Player not found', 404);

    const isOwnPlayerReport = requester.role === 'player' && requester.id === playerId;
    const isLinkedParentReport = requester.role === 'parent' && player.parent_id === requester.id;

    if (!isOwnPlayerReport && !isLinkedParentReport) {
      return apiError("You are not allowed to view this player's analytics", 403);
    }

    const sessionsResult = await pool.query(
      `SELECT DISTINCT ON (a.user_id, a.session_id, DATE(a.created_at))
         a.id AS attendance_id,
         s.id,
         s.name,
         s.session_type,
         s.date,
         a.created_at AS attendance_date,
         s.status AS session_status,
         coach.first_name AS coach_first_name,
         coach.last_name AS coach_last_name,
         COALESCE(player_session.rating, 0) AS rating,
         a.status AS attendance_status
       FROM attendance a
       INNER JOIN sessions s ON s.id = a.session_id
       LEFT JOIN LATERAL (
         SELECT sp.rating
         FROM session_players sp
         WHERE sp.session_id = a.session_id AND sp.user_id = a.user_id
         ORDER BY sp.created_at ASC
         LIMIT 1
       ) player_session ON true
       LEFT JOIN users coach ON coach.id = s.coach_id
       WHERE a.user_id = $1
         AND a.created_at >= $2::date
         AND a.created_at < ($3::date + INTERVAL '1 day')
       ORDER BY a.user_id, a.session_id, DATE(a.created_at), a.created_at DESC, s.start_time ASC`,
      [playerId, start, end]
    );

    const sessions: PersonalAnalyticsSession[] = sessionsResult.rows.map((session) => ({
      ...session,
      rating: Number(session.rating || 0),
    }));
    const attended = sessions.filter((session) => session.attendance_status === 'present').length;
    const missed = sessions.filter((session) => session.attendance_status !== 'present').length;
    const totalSessions = sessions.length;

    const sessionTypeCounts = new Map<string, number>();
    const attendanceTrend = new Map<
      string,
      { attended: number; missed: number; sessions: number }
    >();
    sessions.forEach((session) => {
      const type = session.session_type || 'Other';
      sessionTypeCounts.set(type, (sessionTypeCounts.get(type) || 0) + 1);

      const date = new Date(session.attendance_date).toISOString().slice(0, 10);
      const trend = attendanceTrend.get(date) || { attended: 0, missed: 0, sessions: 0 };
      trend.sessions += 1;
      if (session.attendance_status === 'present') trend.attended += 1;
      if (session.attendance_status !== 'present') trend.missed += 1;
      attendanceTrend.set(date, trend);
    });

    const paymentsResult = await pool.query(
      `SELECT
         p.id,
         p.session_id,
         s.name AS session_name,
         s.date AS session_date,
         p.amount,
         p.status,
         p.method,
         p.paid_at,
         p.created_at
       FROM payments p
       INNER JOIN sessions s ON s.id = p.session_id
       WHERE p.user_id = $1
         AND p.created_at >= $2::date
         AND p.created_at < ($3::date + INTERVAL '1 day')
       ORDER BY p.created_at ASC`,
      [playerId, start, end]
    );
    const paymentRecords: PersonalAnalyticsPayment[] = paymentsResult.rows.map((payment) => ({
      ...payment,
      amount: Number(payment.amount || 0),
    }));
    const paymentCounts = paymentRecords.reduce(
      (counts, payment) => {
        if (payment.status in counts) counts[payment.status] += 1;
        return counts;
      },
      { paid: 0, pending: 0, failed: 0, comped: 0, refunded: 0 } as Record<
        PersonalAnalyticsPayment['status'],
        number
      >
    );
    const totalPaid = paymentRecords
      .filter((payment) => payment.status === 'paid')
      .reduce((total, payment) => total + payment.amount, 0);

    return NextResponse.json({
      player: {
        id: player.id,
        name: [player.first_name, player.last_name].filter(Boolean).join(' '),
      },
      dateRange: { start, end },
      totals: {
        totalSessions,
        attended,
        missed,
        pendingAttendance: totalSessions - attended - missed,
        attendanceRate: totalSessions ? Number(((attended / totalSessions) * 100).toFixed(1)) : 0,
      },
      payments: {
        totalPaid: Number(totalPaid.toFixed(2)),
        ...paymentCounts,
        records: paymentRecords,
      },
      sessionTypeData: Array.from(sessionTypeCounts.entries()).map(([name, value], index) => ({
        name,
        value,
        fill: `var(--chart-${(index % 5) + 1})`,
      })),
      attendanceTrend: Array.from(attendanceTrend.entries()).map(([date, values]) => ({
        date,
        ...values,
      })),
      sessions,
    });
  } catch (error) {
    if (error instanceof Error && /Firebase ID token/i.test(error.message)) {
      return apiError('Your sign-in session is invalid or expired', 401);
    }
    console.error('GET /api/personal-analytics error:', error);
    return apiError('Unable to load personal analytics', 500);
  }
}

export const revalidate = 0;
