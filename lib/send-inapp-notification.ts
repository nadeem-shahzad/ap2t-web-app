"use server"
import pool from "@/lib/db";
import { TriggerFirebaseForNotifications } from "@/lib/triggerFirebase";

export async function sendInAppNotificationBackend(to: number, msg: string, route: string) {
  try {
    const query = `
      INSERT INTO notifications ("to", msg, route, read)
      VALUES ($1, $2, $3, false)
      RETURNING *;
    `;
    const values = [to, msg, route];
    const result = await pool.query(query, values);
    // Do not finish the notification workflow until Firestore has been updated.
    // The client-side listener uses this document write as its refetch signal.
    await TriggerFirebaseForNotifications(to);

    return result.rows[0];
  } catch (error) {
    console.log("Error sending notification:", error);
  }
}
