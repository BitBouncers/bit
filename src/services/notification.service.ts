import {
  FastifyReply,
  FastifyRequest,
  NotificationReadBody,
  UserUIDParams,
} from "fastify";

interface INotificationService {
  polling: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  read: (
    request: FastifyRequest<NotificationReadBody>,
    reply: FastifyReply
  ) => Promise<void>;
}

export default class NotificationService implements INotificationService {
  polling = async (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => {
    try {
      const { rows } = await request.server.pg.query(`
      SELECT
        CASE
          WHEN read THEN 1
          ELSE 0
        END AS read,
        uid, timestamp, message, "createdAt", "to"
      FROM
        "Notification" WHERE recipient_uid = ${request.userUID}
      ORDER BY timestamp DESC
    `);
      if (rows) {
        reply.status(200).send(rows);
      } else {
        reply.status(204);
      }
    } catch (error) {
      console.log("notification.service.polling: ", error);
    }
  };

  read = async (
    request: FastifyRequest<NotificationReadBody>,
    reply: FastifyReply
  ) => {
    const { read } = request.body;

    if (read.length === 0) return reply.status(204);

    try {
      const result = await request.server.pg.query(
        `UPDATE "Notification" SET read = true WHERE uid = ANY(${read}::uuid[])`
      );
      return reply.send({
        success: result.rowCount === read.length ? true : false,
        read,
      });
    } catch (error) {
      console.log("notification.service.read: ", error);
      return reply.status(500).send({ message: "Internal server error" });
    }
  };
}
