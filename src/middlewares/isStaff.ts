import { DatabaseError } from "@planetscale/database";
import { eq } from "drizzle-orm";
import { user } from "drizzle/schema";
import { FastifyReply, FastifyRequest } from "fastify";

/** Middleware that allows the user if a physician or radiologist. */
export const isStaff = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!request.userUID) {
      return reply
        .code(401)
        .send({ error: "There was an error with your request." });
    }

    const u = await request.server.db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.uid, request.userUID));

    if (u.length > 0 && ["PHYSICIAN", "RADIOLOGIST"].includes(u[0].role)) {
      return;
    } else {
      return reply
        .code(401)
        .send({ error: "You are not authorized to make this request." });
    }
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      console.log(error.body.code, error.body.message);
    }
    console.log("isStaff middleware: ", error);
    return reply
      .code(401)
      .send({ error: "There was an error with your request." });
  }
};
