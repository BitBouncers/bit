import sql from "../config/db.js";

export async function notify(recipient, sender, message, to) {
  try {
    const now = new Date();
    await sql`INSERT INTO
        "Notification" (recipient_uid, sender_uid, message, "createdAt", timestamp, "to")
        VALUES (${recipient}, ${sender}, ${message || ""}, ${now}, ${now}, ${to || null})`;
  } catch (error) {
    console.log("notification.service.notify: ", error);
  }
}

export async function polling(req, res) {
  try {
    const result = await sql`
      SELECT
        CASE
          WHEN read THEN 1
          ELSE 0
        END AS read,
        uid, timestamp, message, "createdAt", "to"
      FROM
        "Notification" WHERE recipient_uid = ${req.userUID}
      ORDER BY timestamp DESC`;

    if (result.count > 0) {
      res.status(200).json(result);
    } else {
      res.status(204).end();
    }
  } catch (error) {
    console.log("notification.service.polling: ", error);
  }
}

export async function read(req, res) {
  const { read } = req.body;

  if (read.length === 0) return res.status(204).end();

  try {
    const result = await sql`UPDATE "Notification" SET read = true WHERE uid = ANY(${read}::uuid[])`;
    return res.json({
      success: result.count === read.length ? true : false,
      read,
    });
  } catch (error) {
    console.log("notification.service.read: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
