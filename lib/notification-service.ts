import nodemailer from 'nodemailer';
import SMTPConnection from 'nodemailer/lib/smtp-connection';
import pool from './db';
import { fetchAllAdmins, sendAdminPaymentNotificationEmail, sendPaymentReceiptEmail } from './email-templates';


const twilioClient = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const transporter = nodemailer.createTransport({
  host: process.env.BULK_EMAIL_HOST,
  port: process.env.BULK_EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.BULK_EMAIL_LOGIN,
    pass: process.env.BULK_EMAIL_PASSWORD,
  },
} as SMTPConnection.Options);




export const sendSingleEmail = async (message: string, subject: string, email: string) => {

  try {

    if (email) {
      await transporter.sendMail({
        from: process.env.BULK_EMAIL_USER,
        to: email,
        subject,
        text: message.replace(/<[^>]+>/g, ''),
        html: message,
      });

      console.log(`Email sent successfully to ${email}`);
    }

  } catch (error: any) {
    console.log(error)
    throw new Error(error?.message || "Error sending email");
  }
};

export const sendSignupEmail = async (email: string, password: string) => {

  if (!email || !password) return

  const subject = ""
  const htmlMessage = ""

  try {
    await sendSingleEmail(htmlMessage, subject, email)
  } catch (error: any) {
    throw new Error(error?.message);
  }
};


export const sendSingleSMS = async (message: string, id: string | number) => {
  try {
    const usersQuery = await pool.query('SELECT phone_no FROM users WHERE id = $1 LIMIT 1', [id]);
    const user = usersQuery.rows[0];

    if (user?.phone_no) {
      const response = await twilioClient.messages.create({
        body: message,
        // from: process.env.TWILIO_PHONE_NUMBER,
        messagingServiceSid : process.env.TWILIO_MESSAGING_SERVICE,
        to: user.phone,
      })


    } else {
      console.log(`User with id ${id} not found or missing phone.`);
    }
  } catch (error) {
    console.log('Error in sending sms:', error);
  }
};

export const sendPaymentReciept = async (data: any) => {
  if (!data?.id) return;

  try {

    const paymentRes = await pool.query(
      `SELECT * FROM payments WHERE id = $1`,
      [data.id]
    );
    const payment = paymentRes.rows?.[0];
    if (!payment) return;

    const { paid_by: userId, session_id, amount, paid_at: payment_date } = payment;

    if (!userId) return


    const userRes = await pool.query(
      `SELECT first_name, last_name, email FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows?.[0];
    if (!user) return;

    const { first_name, last_name, email } = user;
    const fullName = `${first_name} ${last_name}`


    const sessionRes = await pool.query(
      `SELECT name FROM sessions WHERE id = $1`,
      [session_id]
    );
    const session = sessionRes.rows?.[0];
    const sessionName = session?.name || "N/A";


    const paymentDate = new Date(payment_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });


    const emailData = {
      email,
      fullName,
      amount,
      paymentId: payment.id,
      sessionName,
      paymentDate,
    };
    await sendPaymentReceiptEmail(emailData);
    const allAdmins = await fetchAllAdmins()
    await Promise.all(
      allAdmins.map(async (admin) => {
        const adminEmailData = {
          adminEmail: admin.email,
          fullName,
          userEmail: email,
          amount,
          paymentId: payment?.transaction_id,
          sessionName,
          paymentMethod: payment?.method,
          paymentDate,
        };

        return sendAdminPaymentNotificationEmail(adminEmailData).catch((err) => {
          console.log(`Failed to send to ${admin.email}:`, err);
        });
      })
    );

    console.log(`Payment receipt sent to ${email}`);
  } catch (error: any) {
    console.error("Error sending payment receipt:", error.message || error);
  }
};

// export const sendNotification = async (title: string, page: string, sendTo: string) => {
//   try {
//     const TimeStamp = moment().valueOf()

//     const notification = {
//       TimeStamp,
//       page,
//       read: false,
//       title,
//       sendTo
//     }

//     const db = admin.firestore()
//     const docRef = db.collection("user-notification").doc()
//     await docRef.set(notification)

//   } catch (error: any) {
//     console.log("Error sending notification:", error?.message)
//   }
// }


