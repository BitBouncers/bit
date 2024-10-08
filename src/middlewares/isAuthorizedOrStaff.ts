import { FastifyReply, FastifyRequest, UserUIDParams } from "fastify";

/** Middleware that allows user as the owner or staff users */
export const isAuthorizedOrStaff = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = await request.server.pg.query(`
      SELECT uid, role FROM "User" WHERE uid = '${request.userUID}';
    `);

    if (!user.rowCount) {
      return reply.code(404).send({ error: "User not found" });
    }

    // We allow if the owner matches the user making the request
    // or if the user is a physician or radiologist
    const isAuthorizedOrStaff =
      ["PHYSICIAN", "RADIOLOGIST"].includes(user.rows[0].role) ||
      request.userUID ===
        (request as FastifyRequest<UserUIDParams>).params.uid || // invoices api
      request.userUID === user.rows[0].uid; // match firebase auth uid to our db uid

    if (!isAuthorizedOrStaff) {
      return reply
        .code(401)
        .send({ error: "You are not authorized to make this request" });
    }
  } catch (error: unknown) {
    console.log("isAuthorizedOrStaff middleware: ", error);
    return reply
      .code(401)
      .send({ error: "You are not authorized to make this request" });
  }
};
