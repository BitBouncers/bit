import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import { authService } from "src/services";

const authRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  // fastify.post( "/add-patient", [isAuthenticated, isStaff], authService.addPatient);

  fastify.post("/login", authService.loginThroughFirebase);

  // fastify.post("/portal/:role", [portalSchema, errors], authService.portal);
  // fastify.post( "/reset-password", [sendResetPasswordSchema, errors], authService.sendResetPassword);
  // fastify.post("/signup", [signupSchema, errors], authService.signup);
  //
  fastify.get("/token", {
    preHandler: isAuthenticated,
    handler: authService.verifyToken,
  });

  done();
};

export const autoPrefix = "/auth";

export default authRoutes;
