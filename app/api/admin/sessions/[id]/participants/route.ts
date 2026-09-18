import pool from '@/lib/db';
import { fetchAllAdmins, sendAdminSessionEnrollmentEmail } from '@/lib/email-templates';
import { sendInAppNotificationBackend } from '@/lib/send-inapp-notification';
import { getSquareClient } from '@/lib/square';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';
import { email } from 'zod';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: session_id } = await params;
  const client = await pool.connect();

  try {
    const { player_id, variant_id, session_date } = await req.json();

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
    const selectedSessionDate =
      typeof session_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(session_date)
        ? session_date
        : null;

    if ((isDailyPayment || isFixedDates) && !selectedSessionDate) {
      await client.query('ROLLBACK');
      return NextResponse.json({ message: 'A session date is required' }, { status: 400 });
    }

    if (isDailyPayment) {
      const validDate = await client.query(
        `SELECT $2::date BETWEEN date::date
                              AND COALESCE(end_date, date)::date AS is_valid`,
        [session_id, selectedSessionDate]
      );
      if (!validDate.rows[0]?.is_valid) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Selected date is outside the session period' },
          { status: 400 }
        );
      }
    }

    let selectedSessionDateRow: any = null;
    if (isFixedDates) {
      const dateRow = await client.query(
        `SELECT id, price, promotion_price, max_players, is_active, is_signup_open
         FROM session_dates
         WHERE session_id = $1 AND date = $2::date
         FOR UPDATE`,
        [session_id, selectedSessionDate]
      );
      selectedSessionDateRow = dateRow.rows[0];
      if (!selectedSessionDateRow || !selectedSessionDateRow.is_active) {
        await client.query('ROLLBACK');
        return NextResponse.json({ message: 'Selected date is not available' }, { status: 400 });
      }
      if (!selectedSessionDateRow.is_signup_open) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Signups are closed for the selected date' },
          { status: 400 }
        );
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

    if (isDailyPayment || isFixedDates) {
      const existingDailyPayment = await client.query(
        `SELECT 1
         FROM payments
         WHERE session_id = $1
           AND user_id = $2
           AND session_date::date = $3::date
         LIMIT 1`,
        [session_id, player_id, selectedSessionDate]
      );
      if (existingDailyPayment.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { message: 'Player is already enrolled for this date' },
          { status: 409 }
        );
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

    const player_in_session =
      isDailyPayment || isFixedDates
        ? await client.query(
            `SELECT COUNT(DISTINCT user_id)
         FROM payments
         WHERE session_id = $1
           AND session_date::date = $2::date
           AND status NOT IN ('failed', 'refunded')`,
            [session_id, selectedSessionDate]
          )
        : await client.query(`SELECT COUNT(*) FROM session_players WHERE session_id = $1`, [
            session_id,
          ]);

    const currentPlayers = Number(player_in_session.rows[0].count);
    const maxPlayers = isFixedDates
      ? Number(selectedSessionDateRow.max_players)
      : Number(sessionData.max_players);

    if (currentPlayers >= maxPlayers) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { message: 'Max players added in the session can not add more' },
        { status: 409 }
      );
    }

    /* ---------------- CALCULATE AMOUNT ---------------- */

    const now = moment();
    let amount = isFixedDates
      ? Number(selectedSessionDateRow.price)
      : selectedVariant
        ? Number(selectedVariant.price)
        : sessionData.price;

    if (sessionData.comped) {
      amount = 0;
    } else if (
      isFixedDates &&
      sessionData.apply_promotion &&
      selectedSessionDateRow.promotion_price !== null
    ) {
      amount = Number(selectedSessionDateRow.promotion_price);
    } else if (
      !isFixedDates &&
      sessionData.apply_promotion &&
      sessionData.promotion_start &&
      sessionData.promotion_end &&
      moment(sessionData.promotion_end).isAfter(now)
    ) {
      amount = sessionData.promotion_price;
    }

    /* ---------------- SIBLING DISCOUNT ---------------- */

    const parent_data = await client.query(`SELECT parent_id FROM players WHERE user_id = $1`, [
      player_id,
    ]);

    const parent_id = parent_data.rows[0]?.parent_id;
    let hasSiblingDiscount = false;

    if (parent_id !== null && parent_id !== undefined) {
      const siblings_data = await client.query(
        `SELECT COUNT(*)
         FROM players
         WHERE parent_id = $1
           AND user_id IN (
             SELECT DISTINCT user_id
             FROM session_players
             WHERE session_id = $2
           )`,
        [parent_id, session_id]
      );

      const siblingCount = parseInt(siblings_data.rows[0].count, 10);

      if (siblingCount >= 1) {
        hasSiblingDiscount = true;
        amount = amount * 0.9;

        // await client.query(
        //   `UPDATE payments
        //    SET amount = amount * 0.9,
        //        siblings_discount = true
        //    WHERE session_id = $1
        //      AND status = 'pending'
        //      AND user_id != $3
        //      AND user_id IN (
        //        SELECT user_id FROM players
        //        WHERE parent_id = $2
        //      )`,
        //   [session_id, parent_id, player_id]
        // );
      }
    }

    let upfrontPaymentTransactionId: string | null = null;
    if (sessionData.requires_upfront_payment && !sessionData.comped && Number(amount) > 0) {
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
            amount: BigInt(Math.round(Number(amount) * 100)),
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

    if (sessionData.comped) {
      await client.query(
        `INSERT INTO payments
         (session_id, user_id, amount, status, paid_at, method, siblings_discount, session_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          session_id,
          player_id,
          amount,
          'comped',
          new Date(),
          'Nil',
          hasSiblingDiscount,
          isDailyPayment || isFixedDates ? selectedSessionDate : null,
        ]
      );
    } else if (upfrontPaymentTransactionId) {
      await client.query(
        `INSERT INTO payments
         (session_id, user_id, amount, status, paid_at, method, transaction_id, siblings_discount, session_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          session_id,
          player_id,
          amount,
          'paid',
          new Date(),
          'Debit / Credit Card',
          upfrontPaymentTransactionId,
          hasSiblingDiscount,
          isDailyPayment || isFixedDates ? selectedSessionDate : null,
        ]
      );
    } else {
      await client.query(
        `INSERT INTO payments
         (session_id, user_id, amount, status, siblings_discount, session_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          session_id,
          player_id,
          amount,
          'pending',
          hasSiblingDiscount,
          isDailyPayment || isFixedDates ? selectedSessionDate : null,
        ]
      );
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
        sessionDate: emailData.sessiondate,
        enrollmentDate: emailData.enrollmentdate,
      };
      await sendAdminSessionEnrollmentEmail(adminEmailPayload);
    }
    const playerName = `${emailData?.first_name || ''} ${emailData?.last_name || ''}`.trim();

    const paymentStatus = sessionData.comped
      ? 'Comped'
      : upfrontPaymentTransactionId
        ? 'Paid'
        : amount === 0
          ? 'Free'
          : 'Pending';

    const discountText = hasSiblingDiscount ? ' (Sibling discount applied)' : '';

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

    const paymentmsg = ` Payment: ${paymentStatus} - $${amount}${discountText}.`;

    const promises1 = admins.map((admin) =>
      sendInAppNotificationBackend(admin.id, paymentmsg, `/portal/admin/sessions/`)
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
