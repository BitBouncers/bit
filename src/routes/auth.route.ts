import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { checkPhysicianExistsInHospital } from "src/middlewares/check-physician-in-hospital";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import {
  portalSchema,
  sendPasswordResetSchema,
  signupSchema,
} from "src/middlewares/validators";
import { authService } from "src/services";

const authRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  fastify.post("/add-patient", {
    preHandler: isAuthenticated,
    handler: authService.addPatient,
  });

  fastify.post("/login", authService.loginThroughFirebase);
  fastify.post("/portal/:role", { ...portalSchema }, authService.portal);
  fastify.post(
    "/reset-password",
    { ...sendPasswordResetSchema },
    authService.sendPasswordReset
  );
  fastify.post(
    "/signup",
    { ...signupSchema, preHandler: checkPhysicianExistsInHospital },
    authService.signup
  );

  fastify.get("/token", {
    preHandler: isAuthenticated,
    handler: authService.verifyToken,
  });

  done();
};

export const autoPrefix = "/auth";

export default authRoutes;
