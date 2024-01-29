import { FastifyReply, FastifyRequest, UserUIDParams } from "fastify";

export const isAuthorizedOrStaff = async (
  request: FastifyRequest<UserUIDParams>,
  reply: FastifyReply
) => {
  try {
    const user = await request.server.prisma.user.findFirst({
      select: { role: true, uid: true },
      where: { uid: request.userUID },
    });

    if (!user) {
      return reply.code(404).send({ error: "User not found" });
    }

    // We allow if the owner matches the user making the request
    // or if the user is a physician or radiologist
    const isAuthorizedOrStaff =
      ["PHYSICIAN", "RADIOLOGIST"].includes(user.role) ||
      request.userUID === request.params?.uid || // invoices api
      request.userUID === user.uid; // match firebase auth uid to our db uid

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
