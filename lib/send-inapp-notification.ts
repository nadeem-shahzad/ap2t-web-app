"use server"
import pool from "@/lib/db";
import { TriggerFirebaseForNotifications } from "./trigger-firebase";


export async function sendInAppNotificationBackend(to: number, msg: string, route: string) {
  if (!to) return
  try {
    const query = `
      INSERT INTO notifications ("to", msg, route, read)
      VALUES ($1, $2, $3, false)
      RETURNING *;
    `;
    const values = [to, msg, route];
    const result = await pool.query(query, values);
    TriggerFirebaseForNotifications(to);

    return result.rows[0];
  } catch (error) {
    console.log("Error sending notification:", error);
  }
}