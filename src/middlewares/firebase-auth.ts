import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { FirebaseError } from "firebase/app";
import { adminAuth } from "src/config/firebase";

export const isAuthenticated = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  if (
    request.headers?.authorization &&
    request.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    const authToken = request.headers.authorization.split(" ")[1];
    if (!authToken) {
      return reply.code(401).send({ error: "Missing bearer token." });
    }

    adminAuth
      .verifyIdToken(authToken)
      .then((decodedToken) => {
        if (decodedToken.uid) {
          request.userUID = decodedToken.uid;
        }
        done();
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
        }
        return reply.code(401).send({
          error: "You are not authorized to make this request.",
        });
      });
  } else {
    reply.code(401).send({ error: "Malformed authorization header." });
  }
};
