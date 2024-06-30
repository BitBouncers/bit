import { FastifyReply, FastifyRequest } from "fastify";
import { FirebaseError } from "firebase/app";
import { adminAuth } from "src/config/firebase";

export const isAuthenticated = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (
    request.headers?.authorization &&
    request.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const authToken = request.headers.authorization.split(" ")[1];
    if (!authToken) {
      return reply.code(401).send({ error: "Missing bearer token." });
    }

    try {
      await adminAuth
        .verifyIdToken(authToken)
        .then((decodedToken) => {
          if (decodedToken.uid) {
            request.userUID = decodedToken.uid;
          }
        })
        .catch((error: unknown) => {
          if (
            (error instanceof FirebaseError &&
              error.code === "auth/id-token-expired") ||
            error instanceof Error
          ) {
            return reply.code(401).send({
              error: "Your session has expired. Please login again.",
            });
          } else if (
            (error instanceof FirebaseError &&
              error.code === "auth/argument-error") ||
            error instanceof Error
          ) {
            return reply.code(401).send({
              error: "Make sure you passed the entire string JWT",
            });
          }
          return reply.code(401).send({
            error: "You are not authorized to make this request.",
          });
        });
    } catch (error: unknown) {
      console.log("isAuthenticated: ", error);
      return reply.code(401).send({ error: "Malformed authorization header." });
    }
  }
};
