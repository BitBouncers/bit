import * as Pg from "pg";

interface NotifyProps {
  recipient: string;
  sender: string;
  message: string;
  to?: string;
}

export async function notify(
  pg: Pg.Pool,
  { recipient, sender, message, to }: NotifyProps
) {
  try {
    const now = new Date();
    await pg.query(`
      INSERT INTO
      "Notification" (recipient_uid, sender_uid, message, "createdAt", timestamp, "to")
      VALUES (${recipient}, ${sender}, ${message || ""}, ${now}, ${now}, ${to || null})
    `);
  } catch (error) {
    console.log("notification.service.notify: ", error);
  }
}
