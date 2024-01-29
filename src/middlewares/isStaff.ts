import { DatabaseError } from "@planetscale/database";
import { FastifyReply, FastifyRequest } from "fastify";

/** Middleware that allows the user if a physician or radiologist. */
export const isStaff = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = await request.server.prisma.user.findFirst({
      select: { role: true },
      where: { uid: request.userUID },
    });

    if (user && ["PHYSICIAN", "RADIOLOGIST"].includes(user.role)) {
      return;
    } else {
      return reply
        .code(401)
        .send({ error: "You are not authorized to make this request." });
    }
  } catch (error: unknown) {
    console.log("isStaff middleware: ", error);
    if (error instanceof DatabaseError) {
      console.log(error.body.code, error.body.message);
    }
    return reply
      .code(401)
      .send({ error: "There was an error with your request." });
  }
};
