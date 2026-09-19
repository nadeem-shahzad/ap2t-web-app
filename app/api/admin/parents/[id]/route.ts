import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: parentId } = await params;

  try {
    /* -------------------------------------------------------
       1️⃣ Parent Info
    ------------------------------------------------------- */

    const parentResult = await pool.query(
      `
      SELECT
      u.*,
      to_json(p.*) AS profile
      FROM users u
      INNER JOIN parents p ON p.user_id = u.id
      WHERE u.id = $1
      `,
      [parentId]
    );

    if (!parentResult.rows.length) {
      return NextResponse.json({ message: 'Parent not found' }, { status: 404 });
    }

    const parent = parentResult.rows[0];

    /* -------------------------------------------------------
       2️⃣ Linked Children
    ------------------------------------------------------- */

    const childrenResult = await pool.query(
      `
      SELECT
        pl.id AS player_id,
        pl.user_id,
        pl.skill_level,
        u.first_name,
        u.last_name,
        u.birth_date,
        u.picture
      FROM players pl
      INNER JOIN users u ON u.id = pl.user_id
      WHERE pl.parent_id = $1
      `,
      [parentId]
    );

    const children = childrenResult.rows;
    const childUserIds = children.map((c) => c.user_id);

    /* -------------------------------------------------------
       3️⃣ Sessions + Coach + Player Info
    ------------------------------------------------------- */

    let sessionRows: any[] = [];

    if (childUserIds.length) {
      const sessionsResult = await pool.query(
        `
        SELECT
          s.id AS session_id,
          s.name,
          s.status,
          s.date,
          s.date_mode,
          s.start_time,
          s.end_time,
          s.apply_promotion,
          s.price,
          s.promotion_price,
          s.comped,
          coach.first_name AS coach_first_name,
          coach.last_name AS coach_last_name,

          child.id AS child_id,
          child.first_name AS child_first_name,
          child.last_name AS child_last_name

        FROM sessions s

        INNER JOIN users coach ON coach.id = s.coach_id

        INNER JOIN session_players sp ON sp.session_id = s.id
        INNER JOIN users child ON child.id = sp.user_id

        WHERE sp.user_id = ANY($1)
        `,
        [childUserIds]
      );

      sessionRows = sessionsResult.rows;
    }

    /* -------------------------------------------------------
       3️⃣a Enrolled occurrence dates for fixed-dates sessions
       (sessions.date is always null for these — the actual date lives on
       the payment row instead)
    ------------------------------------------------------- */

    let fixedDatePayments: { user_id: number; session_id: number; session_date: string }[] = [];

    if (childUserIds.length) {
      const fixedDateResult = await pool.query(
        `SELECT user_id, session_id, session_date
         FROM payments
         WHERE user_id = ANY($1) AND session_date IS NOT NULL`,
        [childUserIds]
      );
      fixedDatePayments = fixedDateResult.rows;
    }

    /* -------------------------------------------------------
       4️⃣ Payments (Total Spent)
    ------------------------------------------------------- */

    let paymentTotal = 0;

    if (childUserIds.length) {
      const paymentResult = await pool.query(
        `
        SELECT COALESCE(SUM(amount), 0) AS total_spent
        FROM payments
        WHERE (user_id = $1 OR user_id = ANY($2)) AND status = $3
        `,
        [parentId, childUserIds, 'paid']
      );

      paymentTotal = Number(paymentResult.rows[0].total_spent || 0);
    }

    /* -------------------------------------------------------
       5️⃣ Prepare Sessions Grouped
    ------------------------------------------------------- */

    const sessionMap = new Map();

    sessionRows.forEach((row) => {
      if (!sessionMap.has(row.session_id)) {
        sessionMap.set(row.session_id, {
          session_id: row.session_id,
          name: row.name,
          status: row.status,
          date: row.date,
          start_time: row.start_time,
          end_time: row.end_time,
          coach_first_name: row.coach_first_name,
          coach_last_name: row.coach_last_name,
          apply_promotion: row.apply_promotion,
          price: row.price,
          promotion_price: row.promotion_price,
          enrolled_dates: Array.from(
            new Set(
              fixedDatePayments
                .filter((payment) => payment.session_id === row.session_id)
                .map((payment) => payment.session_date)
            )
          ).sort(),
          players: [],
          comped: row.comped,
        });
      }

      sessionMap.get(row.session_id).players.push({
        first_name: row.child_first_name,
        last_name: row.child_last_name,
      });
    });

    const sessions = Array.from(sessionMap.values());

    /* -------------------------------------------------------
       6️⃣ Upcoming Sessions Count
    ------------------------------------------------------- */

    const upcomingSessionsCount = sessions.filter((s) => s.status === 'pending').length;

    /* -------------------------------------------------------
       7️⃣ Child Stats (WITHOUT sessions array)
    ------------------------------------------------------- */

    const childrenWithStats = children.map((child) => {
      const childSessions = sessionRows.filter((s) => s.child_id === child.user_id);

      // For fixed-dates sessions, sessions.date is always null — resolve the
      // actual enrolled date(s) from this child's payment rows instead.
      const nextSessionCandidates = childSessions.flatMap((s) => {
        if (s.date_mode === 'fixed_dates') {
          return fixedDatePayments
            .filter((p) => p.user_id === child.user_id && p.session_id === s.session_id)
            .map((p) => ({ date: p.session_date, start_time: s.start_time }));
        }
        return [{ date: s.date, start_time: s.start_time }];
      });

      const nextSession = nextSessionCandidates
        .filter((s) => s.date && new Date(s.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

      return {
        ...child,
        total_sessions: childSessions.length,
        next_session: nextSession
          ? {
              date: nextSession.date,
              start_time: nextSession.start_time,
            }
          : null,
      };
    });

    /* -------------------------------------------------------
       8️⃣ Get payments record
    ------------------------------------------------------- */

    const result = await pool.query(
      `
SELECT 
    p.*,
    s.name AS session_name
  FROM payments p
  LEFT JOIN sessions s ON p.session_id = s.id
  WHERE p.user_id = $1
     OR p.user_id IN (
         SELECT pl.user_id
         FROM players pl
         WHERE pl.parent_id = $1
     )
  ORDER BY p.created_at DESC
`,
      [parentId]
    );

    const payments = result.rows;

    return NextResponse.json({
      parent,
      stats: {
        total_linked_children: children.length,
        total_spent: paymentTotal,
        upcoming_sessions: upcomingSessionsCount,
      },
      linked_childrens: childrenWithStats,
      sessions,
      payments,
    });
  } catch (error) {
    console.error('GET Parent Detail Error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
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
      return NextResponse.json({ message: 'No valid data provided for update' }, { status: 400 });
    }

    values.push(id);
    const query = `
          UPDATE parents 
          SET ${fields.join(', ')}
          WHERE user_id = $${values.length}
      `;

    await pool.query(query, values);

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.log('Error updating data:', error?.message);
    return NextResponse.json(
      { message: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
