import pool from '@/lib/db';
import { fetchAllAdmins, sendCoachNewSessionEmail } from '@/lib/email-templates';
import { sendInAppNotificationBackend } from '@/lib/send-inapp-notification';
import moment from 'moment';
import { NextRequest, NextResponse } from 'next/server';

function timeToMinutes(time: string): number | null {
  const match = time?.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (minutes > 59 || hours > 23) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

function validateFixedDates(dates: any, applyPromotion: boolean): string | null {
  if (!Array.isArray(dates) || dates.length === 0) {
    return 'At least one date is required for a fixed-dates session';
  }

  const seen = new Set<string>();
  for (const entry of dates) {
    if (!entry?.date || Number.isNaN(Date.parse(entry.date))) {
      return 'Every date row requires a valid date';
    }
    if (seen.has(entry.date)) {
      return 'Duplicate dates are not allowed';
    }
    seen.add(entry.date);

    const price = Number(entry.price);
    if (!Number.isFinite(price) || price <= 0) {
      return 'Every date requires a positive price';
    }

    if (applyPromotion) {
      const promoPrice = Number(entry.promotion_price);
      if (!Number.isFinite(promoPrice) || promoPrice <= 0) {
        return 'Every date requires a positive promotion price';
      }
    }

    const maxPlayers = Number(entry.max_players);
    if (!Number.isInteger(maxPlayers) || maxPlayers <= 0) {
      return 'Every date requires a positive max players value';
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const body = await req.json();
    const { byAdmin, pricing_mode = 'single', variants = [], dates = [], ...data } = body;

    if (!data || Object.keys(data).length === 0) {
      return NextResponse.json({ message: 'Required parameters missing' }, { status: 400 });
    }

    if (data.date_mode === 'fixed_dates') {
      if (data.is_daily_payment) {
        return NextResponse.json(
          { message: 'Fixed-dates sessions cannot also be daily-payment sessions' },
          { status: 400 }
        );
      }
      if (pricing_mode === 'variants') {
        return NextResponse.json(
          { message: 'Fixed-dates sessions cannot have hourly variants' },
          { status: 400 }
        );
      }

      const dateError = validateFixedDates(dates, Boolean(data.apply_promotion));
      if (dateError) {
        return NextResponse.json({ message: dateError }, { status: 400 });
      }

      // Maintain sessions.price/promotion_price/max_players for existing
      // queries until fixed-dates-aware reads are added everywhere, mirroring
      // the session_variants backward-compat trick above.
      data.price = Math.min(...dates.map((d: { price: number }) => Number(d.price)));
      if (data.apply_promotion) {
        data.promotion_price = Math.min(
          ...dates.map((d: { promotion_price: number }) => Number(d.promotion_price))
        );
      }
      data.max_players = dates.reduce(
        (sum: number, d: { max_players: number }) => sum + Number(d.max_players),
        0
      );
    }

    if (pricing_mode !== 'single' && pricing_mode !== 'variants') {
      return NextResponse.json({ message: 'Invalid pricing mode' }, { status: 400 });
    }

    if (pricing_mode === 'variants' && data.apply_promotion) {
      return NextResponse.json(
        { message: 'Promotional sessions cannot have variants' },
        { status: 400 }
      );
    }

    if (pricing_mode === 'variants') {
      if (!Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json({ message: 'At least one variant is required' }, { status: 400 });
      }

      const startMinutes = timeToMinutes(data.start_time);
      const endMinutes = timeToMinutes(data.end_time);
      const maximumHours =
        startMinutes !== null && endMinutes !== null
          ? Math.floor((endMinutes - startMinutes) / 60)
          : 0;

      if (maximumHours < 1) {
        return NextResponse.json(
          { message: 'Session must be at least one hour long' },
          { status: 400 }
        );
      }

      const hours = new Set<number>();
      for (const variant of variants) {
        const hour = Number(variant?.hour);
        const price = Number(variant?.price);
        if (!Number.isInteger(hour) || hour < 1 || hour > maximumHours) {
          return NextResponse.json(
            { message: 'Variant hour is outside the session duration' },
            { status: 400 }
          );
        }
        if (!Number.isFinite(price) || price <= 0) {
          return NextResponse.json(
            { message: 'Every variant requires a positive price' },
            { status: 400 }
          );
        }
        if (hours.has(hour)) {
          return NextResponse.json(
            { message: 'Duplicate variant hours are not allowed' },
            { status: 400 }
          );
        }
        hours.add(hour);
      }

      if (
        hours.size !== maximumHours ||
        Array.from({ length: maximumHours }, (_, index) => index + 1).some(
          (hour) => !hours.has(hour)
        )
      ) {
        return NextResponse.json(
          { message: 'Every available session duration requires a price' },
          { status: 400 }
        );
      }

      // Maintain sessions.price for existing queries until variant-aware reads are added.
      data.price = Math.min(...variants.map((variant: { price: number }) => Number(variant.price)));
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

    await client.query('BEGIN');
    transactionStarted = true;

    const res = await client.query(
      `INSERT INTO sessions (${fields.join(',')})
       VALUES (${placeholders}) RETURNING id
`,
      values
    );
    const session_id = res.rows[0].id;

    if (pricing_mode === 'variants') {
      for (const variant of variants) {
        await client.query(
          `INSERT INTO session_variants (session_id, hour, price)
           VALUES ($1, $2, $3)`,
          [session_id, Number(variant.hour), Number(variant.price)]
        );
      }
    }

    if (data.date_mode === 'fixed_dates') {
      for (const entry of dates) {
        await client.query(
          `INSERT INTO session_dates
             (session_id, date, price, promotion_price, max_players, is_active, is_signup_open)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            session_id,
            entry.date,
            Number(entry.price),
            data.apply_promotion ? Number(entry.promotion_price) : null,
            Number(entry.max_players),
            entry.is_active ?? true,
            entry.is_signup_open ?? true,
          ]
        );
      }
    }

    await client.query('COMMIT');
    transactionStarted = false;

    const emailDataRaw = await pool.query(
      `
      SELECT
       email,
       first_name,
       last_name
       FROM users
       WHERE id=$1
       `,
      [data.coach_id]
    );

    const emailData = emailDataRaw.rows[0];

    if (emailData) {
      const sessionStartDate = data?.date ? moment(data?.date).format('YYYY-MM-DD') : '';
      const sessionEndDate = data?.end_date ? moment(data?.end_date).format('YYYY-MM-DD') : '';
      const coachEmailPayload = {
        coachEmail: `${emailData.email}`,
        coachName: `${emailData.first_name || ''} ${emailData?.last_name || ''}`,
        sessionName: `${data?.name}`,
        sessionDate: `${sessionStartDate} - ${sessionEndDate}`,
        sessionTime: data?.time,
        location: `${data.location}`,
        createdDate: `${new Date()}`,
      };
      await sendCoachNewSessionEmail(coachEmailPayload);
    }
    const coachName = `${emailData?.first_name || ''} ${emailData?.last_name || ''}`.trim();
    if (byAdmin) {
      const msg = `New session ${data?.name} with ${coachName} scheduled on ${moment(data.date).format('YYYY-MMM-DD')} - ${moment(data.end_date).format('YYYY-MMM-DD')} at ${data?.start_time} - ${data.end_time}.`;

      await sendInAppNotificationBackend(
        data.coach_id,
        msg,
        `/portal/coach/sessions/${session_id}`
      );
    } else if (!byAdmin) {
      const msg = `New session ${data?.name} with ${coachName} scheduled on ${moment(data.date).format('YYYY-MMM-DD')} - ${moment(data.end_date).format('YYYY-MMM-DD')} at ${data?.start_time} - ${data.end_time}.`;

      const admins = await fetchAllAdmins();
      const promises = admins.map((admin) =>
        sendInAppNotificationBackend(admin.user_id, msg, `/portal/admin/sessions/${session_id}`)
      );

      await Promise.allSettled(promises);
    }

    return NextResponse.json({ message: 'Data inserted' }, { status: 201 });
  } catch (error: any) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.log('POST /api/parent error:', error);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const promotion = searchParams.get('promotion');
  const isPromotion = promotion === 'true';

  const queryParams = [];

  let query = `
   SELECT
  s.*,
  u.first_name AS coach_first_name,
  u.last_name  AS coach_last_name,

  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'id', p.id,
        'session_id', p.session_id,
        'user_id', p.user_id,
        'amount', p.amount,
        'status', p.status,
        'method', p.method,
        'created_at', p.created_at,
        'paid_at', p.paid_at
      )
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'
  ) AS payments,
  COALESCE(
    jsonb_agg(
      DISTINCT jsonb_build_object(
        'user_id', sp.user_id
      )
    ) FILTER (WHERE sp.user_id IS NOT NULL),
    '[]'
  ) AS participants,

  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', sd.id,
          'date', sd.date,
          'price', sd.price,
          'promotion_price', sd.promotion_price,
          'max_players', sd.max_players,
          'is_active', sd.is_active,
          'is_signup_open', sd.is_signup_open,
          'left', sd.max_players - COALESCE((
            SELECT COUNT(DISTINCT dp.user_id) FROM payments dp
            WHERE dp.session_id = s.id
              AND dp.session_date::date = sd.date
          ), 0)
        ) ORDER BY sd.date
      )
      FROM session_dates sd
      WHERE sd.session_id = s.id
    ),
    '[]'
  ) AS dates

FROM sessions s
LEFT JOIN users u ON u.id = s.coach_id
LEFT JOIN payments p ON p.session_id = s.id
LEFT JOIN session_players sp ON sp.session_id = s.id
  `;

  try {
    if (isPromotion) {
      query += ` WHERE s.apply_promotion = $1`;
      queryParams.push(isPromotion);
    }
    query += ` GROUP BY s.id, u.first_name, u.last_name;`;

    const result = await pool.query(query, queryParams);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('GET /api/admin/sessions error:', error);

    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const client = await pool.connect();
  let transactionStarted = false;
  try {
    const data = await req.json();
    const { id, byAdmin, pricing_mode, variants, dates, ...updates } = data;

    if (!id) {
      return NextResponse.json({ message: 'ID is required' }, { status: 400 });
    }

    if (updates.date_mode === 'fixed_dates') {
      if (updates.is_daily_payment) {
        return NextResponse.json(
          { message: 'Fixed-dates sessions cannot also be daily-payment sessions' },
          { status: 400 }
        );
      }
      if (pricing_mode === 'variants') {
        return NextResponse.json(
          { message: 'Fixed-dates sessions cannot have hourly variants' },
          { status: 400 }
        );
      }

      const dateError = validateFixedDates(dates, Boolean(updates.apply_promotion));
      if (dateError) {
        return NextResponse.json({ message: dateError }, { status: 400 });
      }

      updates.price = Math.min(...dates.map((d: { price: number }) => Number(d.price)));
      if (updates.apply_promotion) {
        updates.promotion_price = Math.min(
          ...dates.map((d: { promotion_price: number }) => Number(d.promotion_price))
        );
      }
      updates.max_players = dates.reduce(
        (sum: number, d: { max_players: number }) => sum + Number(d.max_players),
        0
      );
    }

    if (pricing_mode !== undefined && pricing_mode !== 'single' && pricing_mode !== 'variants') {
      return NextResponse.json({ message: 'Invalid pricing mode' }, { status: 400 });
    }

    if (pricing_mode === 'variants' && updates.apply_promotion) {
      return NextResponse.json(
        { message: 'Promotional sessions cannot have variants' },
        { status: 400 }
      );
    }

    if (updates.apply_promotion && pricing_mode !== 'single') {
      const existingVariants = await client.query(
        `SELECT EXISTS (SELECT 1 FROM session_variants WHERE session_id = $1) AS has_variants`,
        [id]
      );
      if (existingVariants.rows[0]?.has_variants) {
        return NextResponse.json(
          { message: 'Sessions with variants cannot be made promotional' },
          { status: 400 }
        );
      }
    }

    if (pricing_mode === 'variants') {
      if (!Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json({ message: 'At least one variant is required' }, { status: 400 });
      }

      const startMinutes = timeToMinutes(updates.start_time);
      const endMinutes = timeToMinutes(updates.end_time);
      const maximumHours =
        startMinutes !== null && endMinutes !== null
          ? Math.floor((endMinutes - startMinutes) / 60)
          : 0;
      const hours = new Set<number>();

      if (maximumHours < 1) {
        return NextResponse.json(
          { message: 'Session must be at least one hour long' },
          { status: 400 }
        );
      }

      for (const variant of variants) {
        const hour = Number(variant?.hour);
        const price = Number(variant?.price);
        if (!Number.isInteger(hour) || hour < 1 || hour > maximumHours) {
          return NextResponse.json(
            { message: 'Variant hour is outside the session duration' },
            { status: 400 }
          );
        }
        if (!Number.isFinite(price) || price <= 0) {
          return NextResponse.json(
            { message: 'Every variant requires a positive price' },
            { status: 400 }
          );
        }
        if (hours.has(hour)) {
          return NextResponse.json(
            { message: 'Duplicate variant hours are not allowed' },
            { status: 400 }
          );
        }
        hours.add(hour);
      }

      if (
        hours.size !== maximumHours ||
        Array.from({ length: maximumHours }, (_, index) => index + 1).some(
          (hour) => !hours.has(hour)
        )
      ) {
        return NextResponse.json(
          { message: 'Every available session duration requires a price' },
          { status: 400 }
        );
      }

      updates.price = Math.min(
        ...variants.map((variant: { price: number }) => Number(variant.price))
      );
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
          UPDATE sessions 
          SET ${fields.join(', ')}
          WHERE id = $${values.length}
      `;

    await client.query('BEGIN');
    transactionStarted = true;
    await client.query(query, values);

    if (pricing_mode === 'single') {
      await client.query(`DELETE FROM session_variants WHERE session_id = $1`, [id]);
    } else if (pricing_mode === 'variants') {
      await client.query(`DELETE FROM session_variants WHERE session_id = $1`, [id]);
      for (const variant of variants) {
        await client.query(
          `INSERT INTO session_variants (session_id, hour, price)
           VALUES ($1, $2, $3)`,
          [id, Number(variant.hour), Number(variant.price)]
        );
      }
    }

    if (updates.date_mode === 'fixed_dates') {
      await client.query(`DELETE FROM session_dates WHERE session_id = $1`, [id]);
      for (const entry of dates) {
        await client.query(
          `INSERT INTO session_dates
             (session_id, date, price, promotion_price, max_players, is_active, is_signup_open)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            entry.date,
            Number(entry.price),
            updates.apply_promotion ? Number(entry.promotion_price) : null,
            Number(entry.max_players),
            entry.is_active ?? true,
            entry.is_signup_open ?? true,
          ]
        );
      }
    } else if (updates.date_mode !== undefined) {
      await client.query(`DELETE FROM session_dates WHERE session_id = $1`, [id]);
    }

    await client.query('COMMIT');
    transactionStarted = false;
    const emailDataRaw = await pool.query(
      `SELECT
       email,
       first_name || ' ' || last_name AS "fullName"
       FROM users
       WHERE id=$1
       `,
      [data.coach_id]
    );

    const emailData = emailDataRaw.rows[0];

    const coachEmailPayload = {
      coachEmail: `${emailData.email}`,
      coachName: `${emailData.fullName}`,
      sessionName: `${data.name}`,
      sessionDate: `${data.date} - ${data.end_date}`,
      sessionTime: data.time,
      location: `${data.location}`,
      createdBy: 'admin',
      createdDate: `${new Date()}`,
    };
    await sendCoachNewSessionEmail(coachEmailPayload);
    const coachName = `${emailData?.first_name || ''} ${emailData?.last_name || ''}`.trim();
    if (byAdmin) {
      const msg = `Session ${data?.name} with ${coachName} was updated`;

      await sendInAppNotificationBackend(data.coach_id, msg, `/portal/admin/sessions/${id}`);
    } else if (!byAdmin) {
      const msg = `Session ${data?.name} with ${coachName} was updated`;

      const admins = await fetchAllAdmins();
      const promises = admins.map((admin) =>
        sendInAppNotificationBackend(admin.user_id, msg, `/portal/admin/sessions/${id}`)
      );

      await Promise.allSettled(promises);
    }

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
export const revalidate = 0;
