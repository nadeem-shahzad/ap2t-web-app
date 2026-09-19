import pool from '@/lib/db';
import { fetchAllAdmins, sendAdminSessionEnrollmentEmail } from '@/lib/email-templates';
import { sendInAppNotificationBackend } from '@/lib/send-inapp-notification';
import { getSquareClient } from '@/lib/square';
import { isPromotionActive } from '@/lib/promotion';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: session_id } = await params;
  const client = await pool.connect();

  try {
    const { player_id, variant_id, session_date, session_dates } = await req.json();

    if (!player_id) {
      return NextResponse.json({ message: 'Player ID is required' }, { status: 400 });
    }

    await client.query('BEGIN');

    const sessionResult = await client.query(
      `SELECT price, apply_promotion, promotion_price, promotion_start, promotion_end, comped, max_players,
              is_daily_payment, requires_upfront_payment, date, end_date, date_mode
       FROM sessions
       WHERE id = $1
       LIMIT 1
       FOR UPDATE`,
      [session_id]
    );

    const sessionData = sessionResult.rows[0];

    if (!sessionData) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Session not found' }, { status: 400 });
    }

    const isDailyPayment = Boolean(sessionData.is_daily_payment);
    const isFixedDates = sessionData.date_mode === 'fixed_dates';
    const validDate = (value: unknown): value is string =>
      typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
    const requestedDates = Array.isArray(session_dates) ? session_dates : [session_date];
    const selectedDates = [...new Set(requestedDates.filter(validDate))];

    if ((isDailyPayment || isFixedDates) && selectedDates.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'At least one session date is required' }, { status: 400 });
    }
    if (!isFixedDates && selectedDates.length > 1) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Only fixed-date sessions support multiple dates' }, { status: 400 });
    }
    const bookingDates = isDailyPayment || isFixedDates ? selectedDates : [null];

    if (isDailyPayment) {
      const validRange = await client.query(
        `SELECT $2::date BETWEEN date::date AND COALESCE(end_date, date)::date AS is_valid
         FROM sessions
         WHERE id = $1`,
        [session_id, bookingDates[0]]
      );
      if (!validRange.rows[0]?.is_valid) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Selected date is outside the session period' }, { status: 400 });
      }
    }

    const check = await client.query(
      `SELECT 1 FROM session_players WHERE session_id = $1 AND user_id = $2`,
      [session_id, player_id]
    );
    const isOverallEnrollment = check.rows.length > 0;

    if (!isDailyPayment && !isFixedDates && isOverallEnrollment) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'Player already enrolled' }, { status: 409 });
    }

    for (const bookingDate of bookingDates) {
      if (bookingDate) {
        const existing = await client.query(
          `SELECT 1 FROM payments
           WHERE session_id = $1 AND user_id = $2 AND session_date::date = $3::date
             AND status <> 'refunded' LIMIT 1`,
          [session_id, player_id, bookingDate]
        );
        if (existing.rows.length > 0) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: `Player is already enrolled for ${bookingDate}` }, { status: 409 });
        }
      }
    }

    const variantsResult = await client.query(
      `SELECT id, price
       FROM session_variants
       WHERE session_id = $1`,
      [session_id]
    );
    const sessionVariants = variantsResult.rows;
    let selectedVariant: { id: number; price: string | number } | undefined;

    if (sessionVariants.length > 0) {
      if (!variant_id) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'A session variant must be selected' },
          { status: 400 }
        );
      }

      selectedVariant = sessionVariants.find(
        (variant) => Number(variant.id) === Number(variant_id)
      );
      if (!selectedVariant) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Selected session variant is invalid' },
          { status: 400 }
        );
      }
    } else if (variant_id) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'This session does not have variants' }, { status: 400 });
    }

    const now = moment();
    const promotionActive = isPromotionActive(
      sessionData.apply_promotion,
      sessionData.promotion_start,
      sessionData.promotion_end,
      now
    );
    const parent_data = await client.query(`SELECT parent_id FROM players WHERE user_id = $1`, [
      player_id,
    ]);
    const parent_id = parent_data.rows[0]?.parent_id;
    const bookings: Array<{ date: string | null; amount: number; hasSiblingDiscount: boolean }> = [];
    for (const bookingDate of bookingDates) {
      let fixedDateRow: any = null;
      if (isFixedDates) {
        const row = await client.query(
          `SELECT price, promotion_price, max_players, is_active, is_signup_open
           FROM session_dates WHERE session_id = $1 AND date = $2::date FOR UPDATE`,
          [session_id, bookingDate]
        );
        fixedDateRow = row.rows[0];
        if (!fixedDateRow?.is_active || !fixedDateRow.is_signup_open) {
          await client.query('ROLLBACK');
          return NextResponse.json({ message: `Selected date is unavailable: ${bookingDate}` }, { status: 400 });
        }
      }
      const playerCount = await client.query(
        isDailyPayment || isFixedDates
          ? `SELECT COUNT(DISTINCT user_id) FROM payments WHERE session_id = $1 AND session_date::date = $2::date AND status NOT IN ('failed', 'refunded')`
          : `SELECT COUNT(*) FROM session_players WHERE session_id = $1`,
        isDailyPayment || isFixedDates ? [session_id, bookingDate] : [session_id]
      );
      const maxPlayers = isFixedDates ? Number(fixedDateRow.max_players) : Number(sessionData.max_players);
      if (Number(playerCount.rows[0].count) >= maxPlayers) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: `Session is full${bookingDate ? ` for ${bookingDate}` : ''}` }, { status: 409 });
      }
      let amount = isFixedDates
        ? Number(fixedDateRow.price)
        : selectedVariant ? Number(selectedVariant.price) : Number(sessionData.price);
      if (isFixedDates && promotionActive && fixedDateRow.promotion_price !== null) amount = Number(fixedDateRow.promotion_price);
      else if (!isFixedDates && !selectedVariant && promotionActive) amount = Number(sessionData.promotion_price);
      let hasSiblingDiscount = false;
      if (!sessionData.comped && parent_id !== null && parent_id !== undefined) {
        const siblings = await client.query(
          `SELECT COUNT(*) FROM players sibling INNER JOIN payments pay ON pay.user_id = sibling.user_id
           WHERE sibling.parent_id = $1 AND sibling.user_id <> $3 AND pay.session_id = $2
             AND ($4::date IS NULL OR pay.session_date::date = $4::date)
             AND ($5::integer IS NULL OR pay.variant_id = $5::integer)
             AND pay.status NOT IN ('comped', 'failed', 'refunded')`,
          [parent_id, session_id, player_id, bookingDate, selectedVariant?.id ?? null]
        );
        hasSiblingDiscount = Number(siblings.rows[0].count) >= 1;
        if (hasSiblingDiscount) amount *= 0.9;
      }
      bookings.push({ date: bookingDate, amount: sessionData.comped ? 0 : amount, hasSiblingDiscount });
    }
    const totalAmount = bookings.reduce((total, booking) => total + booking.amount, 0);

    let upfrontPaymentTransactionId: string | null = null;
    if (sessionData.requires_upfront_payment && !sessionData.comped && totalAmount > 0) {
      const cardResult = await client.query(
        `SELECT
           player_user.square_customer_id AS player_customer_id,
           player_user.square_card_id AS player_card_id,
           parent_user.square_customer_id AS parent_customer_id,
           parent_user.square_card_id AS parent_card_id
         FROM players p
         JOIN users player_user ON player_user.id = p.user_id
         LEFT JOIN users parent_user ON parent_user.id = p.parent_id
         WHERE p.user_id = $1`,
        [player_id]
      );
      const cardData = cardResult.rows[0];
      const payer =
        cardData?.player_customer_id && cardData?.player_card_id
          ? {
            square_customer_id: cardData.player_customer_id,
            square_card_id: cardData.player_card_id,
          }
          : cardData?.parent_customer_id && cardData?.parent_card_id
            ? {
              square_customer_id: cardData.parent_customer_id,
              square_card_id: cardData.parent_card_id,
            }
            : null;

      if (!payer?.square_customer_id || !payer?.square_card_id) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'A saved payment card is required before enrolling in this session.' },
          { status: 400 }
        );
      }

      try {
        const squareClient = await getSquareClient();
        const paymentResult = await squareClient.payments.create({
          sourceId: payer.square_card_id,
          customerId: payer.square_customer_id,
          idempotencyKey: crypto.randomUUID(),
          amountMoney: {
            amount: BigInt(Math.round(totalAmount * 100)),
            currency: 'USD',
          },
        });
        upfrontPaymentTransactionId = paymentResult.payment?.id ?? null;

        if (!upfrontPaymentTransactionId) {
          throw new Error('Payment could not be completed');
        }
      } catch (error: any) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: error?.message || 'Upfront payment could not be completed.' },
          { status: 402 }
        );
      }
    }

    /* ---------------- INSERT PLAYER ---------------- */

    if (!isOverallEnrollment) {
      await client.query(
        `INSERT INTO session_players (session_id, user_id)
         VALUES ($1, $2)`,
        [session_id, player_id]
      );
    }

    for (const booking of bookings) {
      if (sessionData.comped) {
        await client.query(
          `INSERT INTO payments (session_id, user_id, amount, status, paid_at, method, siblings_discount, session_date, variant_id)
           VALUES ($1, $2, $3, 'comped', $4, 'Nil', $5, $6, $7)`,
          [session_id, player_id, booking.amount, new Date(), booking.hasSiblingDiscount, booking.date, selectedVariant?.id ?? null]
        );
      } else if (upfrontPaymentTransactionId) {
        await client.query(
          `INSERT INTO payments (session_id, user_id, amount, status, paid_at, method, transaction_id, siblings_discount, session_date, variant_id)
           VALUES ($1, $2, $3, 'paid', $4, 'Debit / Credit Card', $5, $6, $7, $8)`,
          [session_id, player_id, booking.amount, new Date(), upfrontPaymentTransactionId, booking.hasSiblingDiscount, booking.date, selectedVariant?.id ?? null]
        );
      } else {
      await client.query(
        `INSERT INTO payments
         (session_id, user_id, amount, status, siblings_discount, session_date, variant_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          session_id,
          player_id,
          booking.amount,
          'pending',
          booking.hasSiblingDiscount,
          booking.date,
          selectedVariant?.id ?? null,
        ]
      );
      }
    }

    await client.query('COMMIT');

    const emailDataRaw = await pool.query(
      `
      SELECT 
  u.first_name,
  u.last_name,
  u.email AS userEmail,
  s.name AS sessionName,
  s.coach_id,
  coach.email AS coachEmail,
  coach.first_name AS coach_first_name,
  coach.last_name AS coach_last_name,
  s.date AS session_start_date,
  s.end_date AS session_end_date,
  NOW() AS enrollmentDate,
  p.parent_id 
FROM session_players se
JOIN users u ON se.user_id = u.id
JOIN sessions s ON se.session_id = s.id
JOIN users coach ON s.coach_id = coach.id
LEFT JOIN players p ON p.user_id = u.id 
WHERE se.session_id = $1
  AND se.user_id = $2;`,
      [session_id, player_id]
    );
    const emailData = emailDataRaw.rows[0];

    if (emailData) {
      const adminEmailPayload = {
        fullName: `${emailData?.first_name || ''} ${emailData?.last_name || ''}`,
        userEmail: emailData.useremail,
        sessionName: emailData.sessionname,
        coachName: `${emailData?.coach_first_name || ''} ${emailData?.coach_last_name || ''}`,
        sessionDate: selectedDates.join(', '),
        enrollmentDate: emailData.enrollmentdate,
      };
      await sendAdminSessionEnrollmentEmail(adminEmailPayload);
    }
    const playerName = `${emailData?.first_name || ''} ${emailData?.last_name || ''}`.trim();

    const paymentStatus = sessionData.comped
      ? 'Comped'
      : upfrontPaymentTransactionId
        ? 'Paid'
        : totalAmount === 0
          ? 'Free'
          : 'Pending';

    const discountText = bookings.some((booking) => booking.hasSiblingDiscount)
      ? ' (Sibling discount applied)'
      : '';

    const msg = `${playerName} enrolled in ${emailData.sessionname}.`;
    const admins = await fetchAllAdmins();
    const promises = admins.map((admin) =>
      sendInAppNotificationBackend(admin.user_id, msg, `/portal/admin/sessions/${session_id}`)
    );

    await Promise.allSettled(promises);
    await sendInAppNotificationBackend(
      emailData.coach_id,
      msg,
      `/portal/coach/sessions/${session_id}`
    );
    if (emailData.parent_id) {
      await sendInAppNotificationBackend(
        emailData.parent_id,
        msg,
        `/portal/parent/sessions/${session_id}`
      );
    }

    const paymentmsg = ` Payment: ${paymentStatus} - $${totalAmount}${discountText}.`;

    const promises1 = admins.map((admin) =>
      sendInAppNotificationBackend(admin.user_id, paymentmsg, `/portal/admin/sessions/`)
    );
    await Promise.all(promises1);
    if (emailData.parent_id) {
      await sendInAppNotificationBackend(
        emailData.parent_id,
        paymentmsg,
        `/portal/parent/sessions/`
      );
    }
    await sendInAppNotificationBackend(player_id, paymentmsg, `/portal/player/sessions/`);

    return NextResponse.json({ message: 'Done' }, { status: 201 });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('POST /api/admin/sessions/[id]/participants error:', error);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: session_id } = await params;
  const selectedDate = req.nextUrl.searchParams.get('session_date');
  try {
    const result = await pool.query(
      `
      SELECT
        sp.created_at,
        p.user_id AS player_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_no,
        p.position
      FROM session_players sp
      INNER JOIN players p ON p.user_id = sp.user_id
      INNER JOIN users u ON u.id = p.user_id
      WHERE sp.session_id = $1
        AND (
          $2::date IS NULL
          OR EXISTS (
            SELECT 1 FROM payments pay
            WHERE pay.session_id = sp.session_id
              AND pay.user_id = sp.user_id
              AND pay.session_date::date = $2::date
              AND pay.status <> 'refunded'
          )
        )
      `,
      [session_id, selectedDate]
    );

    const attendanceRes = await pool.query(
      `
      SELECT user_id, status
      FROM attendance
      WHERE session_id = $1
        AND DATE(created_at) = CURRENT_DATE
      `,
      [session_id]
    );

    const attendanceMap: any = {};
    for (const a of attendanceRes.rows) {
      attendanceMap[a.user_id] = a.status;
    }

    const finalData = result.rows.map((player) => {
      const status = attendanceMap[player.player_id] || 'pending';
      let status_type = 'warning';
      if (status === 'present') status_type = 'success';
      else if (status === 'absent') status_type = 'danger';
      return { ...player, status, status_type };
    });

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('GET /api/admin/sessions/[id]/participants error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export const revalidate = 0;
