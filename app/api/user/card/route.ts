import pool from "@/lib/db";
import { fetchAllAdmins, sendAdminPaymentNotificationEmail, sendPaymentReceiptEmail } from "@/lib/email-templates";
import { sendInAppNotificationBackend } from "@/lib/send-inapp-notification";
import { getSquareClient } from "@/lib/square";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    const { token, id, cardholder, } = await req.json()
    const squareClient = await getSquareClient();

    try {
        if (!id || !token) return NextResponse.json({ message: "Parameters missing" }, { status: 400 })

        const userQuery = await pool.query(`SELECT first_name, last_name, email, phone_no FROM users WHERE id = $1`, [id])

        const user = userQuery.rows[0] ?? null

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 400 })


        let squareCustomerId: string | null = null;
        let squareCardId: string | null = null;

        if (token) {
            try {
                const customerRes = await squareClient.customers.create({
                    givenName: user.first_name,
                    familyName: user.last_name,
                    emailAddress: user.email,
                    phoneNumber: user.phone_no ?? "",
                    idempotencyKey: crypto.randomUUID(),
                })

                squareCustomerId = customerRes.customer?.id ?? null
                if (!squareCustomerId) throw new Error("Failed to create Square customer")

                const cardRes = await squareClient.cards.create({
                    idempotencyKey: crypto.randomUUID(),
                    sourceId: token,
                    card: {
                        customerId: squareCustomerId,
                        cardholderName: cardholder || "",
                    },
                })

                squareCardId = cardRes.card?.id ?? null
                if (!squareCardId) throw new Error("Failed to save card")

            } catch (error: any) {
                throw new Error("Payment setup failed: " + error.message)

            }
        }

        await pool.query(`UPDATE users SET square_customer_id = $1, square_card_id  = $2, cardholder_name= $3 WHERE id = $4`, [squareCustomerId, squareCardId, cardholder, id])


        const sessionsToBePaidRaw = await pool.query(`
SELECT 
    s.id AS sessionId,
    s.name AS sessionName,
    s.date,
    s.end_date,
    p.id AS paymentId,
    p.amount,
    p.status AS paymentStatus
FROM sessions s
JOIN payments p 
    ON p.session_id = s.id
WHERE p.user_id = $1
  AND (
        p.status = 'failed'
        OR (
          p.status = 'pending'
          AND (
            s.status = 'completed'
            OR (
              s.is_daily_payment = true
              AND p.session_date IS NOT NULL
              AND p.session_date::date <= CURRENT_DATE
            )
          )
        )
      );
        `, [id])
        const sessionsToBePaid = sessionsToBePaidRaw.rows;

        if (!squareCardId) throw new Error("Card not found");
        if (!squareCustomerId) throw new Error("Customer not found");

        for (const session of sessionsToBePaid) {
            try {
                const paymentRes = await squareClient.payments.create({
                    sourceId: squareCardId,
                    idempotencyKey: crypto.randomUUID(),
                    amountMoney: {
                        amount: BigInt(Math.round(Number(session.amount) * 100)),
                        currency: "USD",
                    },
                    customerId: squareCustomerId ?? undefined,
                });

                const transactionId = paymentRes.payment?.id || moment().valueOf().toString();

                await pool.query(
                    `UPDATE payments 
       SET status = 'paid', paid_at = NOW(), paid_by = $1, method = $2, transaction_id = $3 
       WHERE id = $4`,
                    [id, "Debit / Credit Card", transactionId, session.paymentId]
                );

                 await sendPaymentReceiptEmail({
                        email: user?.email,
                        fullName: user?.first_name + " " + user?.last_name,
                        amount: session?.amount,
                        paymentId: transactionId,
                        sessionName: session?.sessionName,
                        paymentDate: new Date().toISOString(),
                    });

                    await sendAdminPaymentNotificationEmail({
                        fullName: user?.first_name + " " + user?.last_name,
                        userEmail: user?.email,
                        amount: session?.amount,
                        sessionName: session?.sessionName,
                        paymentId: transactionId,
                        paymentMethod: "Debit / Credit Card",
                        paymentDate: new Date().toISOString(),
                    });

                    const paymentMsg = `${user.fullName} payment for "${session.sessionName}": paid - $${session.amount}.`;
                   const admins = await fetchAllAdmins();
                   const promises = admins.map(admin =>
                     sendInAppNotificationBackend(
                       admin.user_id,
                       paymentMsg,
                       `/portal/admin/payments`
                     )
                   );
                   
                   await Promise.allSettled(promises);

                   const parentidRaw=await pool.query(`SELECT parent_id FROM players WHERE user_id=$1`,[id])
                   const parent_id=parentidRaw.rows[0]
                   const parentMsg=`Payment payed for session ${session.sessionName} paid - $${session.amount}.`
                   sendInAppNotificationBackend(
                       parent_id,
                       parentMsg,
                       `/portal/parent/dashboard`
                     )

            } catch (err) {
                console.error("Payment failed for session:", session.sessionId);

               await pool.query(
                    `UPDATE payments SET status = 'failed', method = 'Debit / Credit Card' WHERE id = $1`,
                    [session?.paymentId]
                );
            }
        }


        return NextResponse.json({ message: "Card added successfully" })


    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    const { token, id, cardholder, card_id: old_card, customer_id } = await req.json()

    const squareClient = await getSquareClient();

    try {
        if (!id || !token) return NextResponse.json({ message: "Parameters missing" }, { status: 400 })

        let squareCustomerId = customer_id;
        let squareCardId: string | null = null;


        try {

            if (!squareCustomerId) throw new Error("Failed to create Square customer")

            // await squareClient.cards.disable({ cardId: old_card })

            const cardRes = await squareClient.cards.create({
                idempotencyKey: crypto.randomUUID(),
                sourceId: token,
                card: {
                    customerId: squareCustomerId,
                    cardholderName: cardholder || "",
                },
            })

            squareCardId = cardRes.card?.id ?? null
            if (!squareCardId) throw new Error("Failed to save card")

        } catch (error: any) {
            throw new Error("Payment setup failed: " + error.message)

        }


        await pool.query(`UPDATE users SET  square_card_id  = $1, cardholder_name= $2 WHERE id = $3`, [squareCardId, cardholder, id])


        const sessionsToBePaidRaw = await pool.query(`
SELECT 
    s.id AS sessionId,
    s.name AS sessionName,
    s.date,
    s.end_date,
    p.id AS paymentId,
    p.amount,
    p.status AS paymentStatus
FROM sessions s
JOIN payments p 
    ON p.session_id = s.id
WHERE p.user_id = $1
  AND (
        p.status = 'failed'
        OR (
          p.status = 'pending'
          AND (
            s.status = 'completed'
            OR (
              s.is_daily_payment = true
              AND p.session_date IS NOT NULL
              AND p.session_date::date <= CURRENT_DATE
            )
          )
        )
      );
        `, [id])
        const sessionsToBePaid = sessionsToBePaidRaw.rows;

        if (!squareCardId) throw new Error("Card not found");
        if (!squareCustomerId) throw new Error("Customer not found");

        for (const session of sessionsToBePaid) {
            try {
                const paymentRes = await squareClient.payments.create({
                    sourceId: squareCardId,
                    idempotencyKey: crypto.randomUUID(),
                    amountMoney: {
                        amount: BigInt(Math.round(Number(session?.amount) * 100)),
                        currency: "USD",
                    },
                    customerId: squareCustomerId ?? undefined,
                });

                const transactionId = paymentRes?.payment?.id || moment().valueOf().toString();

                await pool.query(
                    `UPDATE payments 
       SET status = 'paid', paid_at = NOW(), paid_by = $1, method = $2, transaction_id = $3 
       WHERE id = $4`,
                    [id, "Debit / Credit Card", transactionId, session.paymentId]
                );

                const emailDataRaw = await pool.query(`SELECT email, first_name,last_name FROM users WHERE id=$1`, [id])
                const user = emailDataRaw.rows?.[0] ?? null
                if (user) {

                    await sendPaymentReceiptEmail({
                        email: user?.email,
                        fullName: user?.first_name + " " + user?.last_name,
                        amount: session?.amount,
                        paymentId: transactionId,
                        sessionName: session?.sessionName,
                        paymentDate: new Date().toISOString(),
                    });

                    await sendAdminPaymentNotificationEmail({
                        fullName: user?.first_name + " " + user?.last_name,
                        userEmail: user?.email,
                        amount: session?.amount,
                        sessionName: session?.sessionName,
                        paymentId: transactionId,
                        paymentMethod: "Debit / Credit Card",
                        paymentDate: new Date().toISOString(),
                    });
                     const paymentMsg = `${user.fullName} payment for ${session.sessionName} paid - $${session.amount}.`;
                   const admins = await fetchAllAdmins();
                   const promises = admins.map(admin =>
                     sendInAppNotificationBackend(
                       admin.user_id,
                       paymentMsg,
                       `/portal/admin/payments`
                     )
                   );
                   
                   await Promise.allSettled(promises);

                   const parentidRaw=await pool.query(`SELECT parent_id FROM players WHERE user_id=$1`,[id])
                   const parent_id=parentidRaw.rows[0]
                   const parentMsg=`Payment payed for session ${session.sessionName} paid - $${session.amount}.`
                   sendInAppNotificationBackend(
                       parent_id,
                       parentMsg,
                       `/portal/parent/dashboard`
                     )
                     sendInAppNotificationBackend(
                       id,
                       parentMsg,
                       `/portal/parent/dashboard`
                     )
                }

            } catch (err) {
                console.log("Payment failed for session:", session?.sessionId);

                await pool.query(
                    `UPDATE payments SET status = 'failed', method = 'Debit / Credit Card' WHERE id = $1`,
                    [session?.paymentId]
                );
            }
        }

        return NextResponse.json({ message: "Card updated successfully" })


    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const squareClient = await getSquareClient();
    try {
        const searchParams = req.nextUrl.searchParams
        const id = searchParams.get("id")

        if (!id) return NextResponse.json({ message: "ID is missing" }, { status: 400 })

        const userQuery = await pool.query(`SELECT first_name, last_name, email, phone_no, square_customer_id, square_card_id FROM users WHERE id = $1`, [id])
        const user = userQuery.rows[0] ?? null

        if (!user) return NextResponse.json({ message: "User not found" }, { status: 400 })
        let finalData = {}

        if (user?.square_card_id) {
            const response = await squareClient.cards.get({ cardId: user?.square_card_id });
            finalData = { ...response?.card, expMonth: response?.card?.expMonth?.toString(), expYear: response?.card?.expYear?.toString(), version: response.card?.version?.toString() }
        }
        return NextResponse.json(finalData, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({ message: error?.message || "Server error" }, { status: 500 })
    }


}


export const revalidate = 0
