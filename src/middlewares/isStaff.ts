import { FastifyReply, FastifyRequest } from "fastify";
import postgres from "postgres";

const { PostgresError } = postgres;

/** Middleware that allows the user if a physician or radiologist. */
export const isStaff = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = await request.server.pg.query(
      `SELECT uid, role FROM "User" WHERE uid = '${request.userUID as string}';`
    );

    if (user.rows && ["PHYSICIAN", "RADIOLOGIST"].includes(user.rows[0].role)) {
      return;
    } else {
      return reply
        .code(401)
        .send({ error: "You are not authorized to make this request." });
    }
  } catch (error: unknown) {
    console.log("isStaff middleware: ", error);
    if (error instanceof PostgresError) {
      console.log(error.name, error.message);
    }
    return reply
      .code(401)
      .send({ error: "There was an error with your request." });
  }
};
