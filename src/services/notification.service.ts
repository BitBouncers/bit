import { notification } from "../../drizzle/schema";
import db from "../config/db";

export async function notify(
  receipient: string,
  senderUid: string,
  message: string,
  to?: string
) {
  try {
    const now = new Date().toISOString();
    return db
      .insert(notification)
      .values({
        recipientUid: receipient,
        senderUid,
        message,
        createdAt: now,
        timestamp: now,
        to,
      })
      .execute();

    /* const { rows } = await db.execute(
      "INSERT INTO \
        Notification (recipient_uid, sender_uid, message, createdAt, timestamp, `to`) \
        VALUES (?, ?, ?, ?, ?, ?)",
      [receipient, sender, message, now, now, to]
    ); */
  } catch (error) {
    console.log("notification.service.notify: ", error);
  }
}

/* export async function polling(request, reply) {
  try {
    const { rows } = await dbConn.execute(
      "\
      SELECT \
        uid, `read`, timestamp, message, DATE(createdAt) as createdAt, `to` \
      FROM \
        Notification WHERE recipient_uid = ? \
      ORDER BY timestamp DESC",
      [request.userUID]
    );
    if (rows.length > 0) {
      reply.status(200).send(rows);
    } else {
      reply.status(204).end();
    }
  } catch (error) {
    console.log("notification.service.polling: ", error);
  }
} */

/* export async function read(request, reply) {
  const { read } = request.body;

  if (read.length === 0) return reply.status(204).end();

  try {
    const result = await dbConn.execute(
      "UPDATE Notification SET `read` = 1 WHERE uid IN (?)",
      [read]
    ); */
/* return reply.send({
      success: result.rowsAffected === read.length ? true : false,
      read,
    });
  } catch (error) {
    console.log("notification.service.read: ", error);
    // return reply.status(500).send({ message: "Internal server error" });
  }
} */
