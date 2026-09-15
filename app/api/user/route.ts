import pool from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';
import { getSquareClient } from '@/lib/square';
import {
  fetchAllAdmins,
  sendAdminNewSignupEmail,
  sendNewJoiningEmail,
} from '@/lib/email-templates';
import { sendInAppNotificationBackend } from '@/lib/send-inapp-notification';

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
          UPDATE users 
          SET ${fields.join(', ')}
          WHERE id = $${values.length}
      `;

    await pool.query(query, values);

    return NextResponse.json({ message: 'Updated successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await pool.query('BEGIN');
  try {
    const searchParams = req.nextUrl.searchParams;
    const special = searchParams.get('special') === 'true';

    if (special) {
      const { player, parent } = await req.json();
      let parent_id: number | null = null;

      try {
        if (parent?.role) {
          parent_id = await createUserWithFirebase(pool, admin, parent);

          await pool.query(`INSERT INTO parents (user_id) VALUES ($1)`, [parent_id]);
          try {
            await pool.query(`INSERT INTO settings (user_id) VALUES ($1)`, [parent_id]);
          } catch (error) {
            console.log("error creating parent's setting", error);
          }
        }

        const player_id = await createUserWithFirebase(pool, admin, player);

        await pool.query(
          `INSERT INTO players (user_id, position, medical_notes, skill_level, parent_id)
           VALUES ($1, '', '', '', $2)`,
          [player_id, parent_id]
        );

        try {
          await pool.query(`INSERT INTO settings (user_id) VALUES ($1)`, [player_id]);
          await pool.query('COMMIT');
        } catch (error) {
          console.log("error creating player's setting", error);
        }

        await pool.query('COMMIT');
        return NextResponse.json({ message: 'User added successfully' });
      } catch (err) {
        await pool.query('ROLLBACK');
        throw err;
      }
    } else {
      const {
        email,
        password: u_pass,
        position = '',
        skill_level = '',
        medical_notes = '',
        career_start = null,
        bio = '',
        parent_id = null,
        ...data
      } = await req.json();
      if (!data || Object.keys(data).length === 0 || !email) {
        await pool.query('ROLLBACK');
        return NextResponse.json({ message: 'Required parameters missing' }, { status: 400 });
      }

      const checkEmail = await pool.query(`SELECT id from users WHERE email = $1`, [email]);

      if (checkEmail.rows.length > 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json({ message: 'Email already exists' }, { status: 400 });
      }

      const password = u_pass || '12345678';

      try {
        await admin.auth().createUser({ email, password });
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          console.warn(`Email ${email} already exists, continuing...`);
        } else {
          throw error;
        }
      }

      const fields = Object.keys({ ...data, email });
      const values = Object.values({ ...data, email });
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');

      const userResult = await pool.query(
        `INSERT INTO users (${fields.join(',')})
                    VALUES (${placeholders})
                    RETURNING id`,
        values
      );

      const user = userResult.rows[0];
      const { role } = data;
      if (role === 'parent') {
        await pool.query(`INSERT INTO parents (user_id) VALUES ($1)`, [user.id]);
        try {
          await pool.query(`INSERT INTO settings (user_id) VALUES ($1)`, [user.id]);
        } catch (error) {
          console.log("error creating player's setting", error);
        }
      } else if (role === 'player') {
        await pool.query(
          `
            INSERT INTO players 
            (user_id,position,medical_notes,skill_level, parent_id)
            VALUES
            ($1,$2,$3,$4,$5)
            `,
          [user.id, position, medical_notes, skill_level, parent_id]
        );
        try {
          await pool.query(`INSERT INTO settings (user_id) VALUES ($1)`, [user.id]);
        } catch (error) {
          console.log("error creating player's setting", error);
        }
      } else if (role === 'coach') {
        await pool.query(
          `
            INSERT INTO coaches 
            (user_id,bio,rating,career_start)
            VALUES
            ($1,$2,$3,$4)
            `,
          [user.id, bio, 5, career_start]
        );

        try {
          await pool.query(`INSERT INTO settings (user_id) VALUES ($1)`, [user.id]);
        } catch (error) {
          console.log("error creating player's setting", error);
        }
      }

      await pool.query('COMMIT');

      const emaiNotificationData = {
        email,
        fullName: `${data?.first_name} ${data?.last_name}`,
        password,
      };
      await sendNewJoiningEmail(emaiNotificationData);
      const id = user.id;

      const fullName = `${data?.first_name || ''} ${data?.last_name || ''}`;
      const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

      const msg = `New ${roleLabel} registered ${fullName} (${email}).`;

      if (role === 'parent') {
        const route = `/portal/admin/parents/${id}`;
        const admins = await fetchAllAdmins();
        const promises = admins.map((admin) =>
          sendInAppNotificationBackend(admin.user_id, msg, route)
        );

        await Promise.allSettled(promises);
      } else if (role === 'player') {
        const route = `/portal/admin/players/${id}`;
        const admins = await fetchAllAdmins();
        const promises = admins.map((admin) =>
          sendInAppNotificationBackend(admin.user_id, msg, route)
        );

        await Promise.allSettled(promises);
      } else if (role === 'coach') {
        const route = `/portal/admin/coaches/${id}`;
        const admins = await fetchAllAdmins();
        const promises = admins.map((admin) =>
          sendInAppNotificationBackend(admin.user_id, msg, route)
        );

        await Promise.allSettled(promises);
      }

      return NextResponse.json({ message: 'Data saved' }, { status: 201 });
    }
  } catch (error: any) {
    await pool.query('ROLLBACK');
    console.log('POST /api/user error:', error);
    return NextResponse.json({ message: error?.message || 'Server error' }, { status: 500 });
  }
}

export async function createUserWithFirebase(pool: any, admin: any, data: any) {
  const { password, email, card_token, cardholder_name, ...rest } = data;

  if (!email) throw new Error('Email required');

  const exists = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);

  if (exists.rows.length > 0) {
    throw new Error('Email already exists');
  }

  try {
    await admin.auth().createUser({ email, password });
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.warn(`Email ${email} already exists, continuing...`);
    } else {
      throw error;
    }
  }

  const emaiNotificationData = {
    email,
    fullName: `${rest?.first_name} ${rest?.last_name}`,
    password,
  };
  await sendNewJoiningEmail(emaiNotificationData);
  const adminEmailProps = {
    email: email,
    fullName: `${rest?.first_name} ${rest?.last_name}`,
    role: data?.role || 'user',
  };
  await sendAdminNewSignupEmail(adminEmailProps);

  let squareCustomerId: string | null = null;
  let squareCardId: string | null = null;

  const squareClient = await getSquareClient();

  if (card_token) {
    try {
      const customerRes = await squareClient.customers.create({
        givenName: rest.first_name,
        familyName: rest.last_name,
        emailAddress: email,
        phoneNumber: rest.phone_no ?? '',
        idempotencyKey: crypto.randomUUID(),
      });

      squareCustomerId = customerRes.customer?.id ?? null;
      if (!squareCustomerId) throw new Error('Failed to create Square customer');

      const cardRes = await squareClient.cards.create({
        idempotencyKey: crypto.randomUUID(),
        sourceId: card_token,
        card: {
          customerId: squareCustomerId,
          cardholderName: cardholder_name,
        },
      });

      squareCardId = cardRes.card?.id ?? null;
      if (!squareCardId) throw new Error('Failed to save card');
    } catch (error: any) {
      throw new Error('Payment setup failed: ' + error.message);
    }
  }

  const insertData: Record<string, any> = { ...rest, email };

  if (squareCustomerId) insertData.square_customer_id = squareCustomerId;
  if (squareCardId) insertData.square_card_id = squareCardId;
  if (cardholder_name) insertData.cardholder_name = cardholder_name;

  const fields = Object.keys(insertData);
  const values = Object.values(insertData);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(',');

  const res = await pool.query(
    `INSERT INTO users (${fields.join(',')})
         VALUES (${placeholders})
         RETURNING id`,
    values
  );

  const role = insertData.role;
  const id = res.rows[0].id;

  const fullName = `${rest?.first_name || ''} ${rest?.last_name || ''}`;
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const msg = `New ${roleLabel} registered ${fullName} (${email}).`;

  if (role === 'parent') {
    const route = `/portal/admin/parents/${id}`;
    const admins = await fetchAllAdmins();
    const promises = admins.map((admin) => sendInAppNotificationBackend(admin.user_id, msg, route));

    await Promise.allSettled(promises);
  } else if (role === 'player') {
    const route = `/portal/admin/players/${id}`;
    const admins = await fetchAllAdmins();
    const promises = admins.map((admin) => sendInAppNotificationBackend(admin.user_id, msg, route));

    await Promise.allSettled(promises);
  } else if (role === 'coach') {
    const route = `/portal/admin/coaches/${id}`;
    const admins = await fetchAllAdmins();
    const promises = admins.map((admin) => sendInAppNotificationBackend(admin.user_id, msg, route));

    await Promise.allSettled(promises);
  }
  return id;
}

export const revalidate = 0;
