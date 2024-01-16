import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";

const authRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  // fastify.post( "/add-patient", [isAuthenticated, isStaff], authService.addPatient);
  // fastify.post("/login", [loginSchema, errors], authService.login);
  // fastify.post("/portal/:role", [portalSchema, errors], authService.portal);
  // fastify.post( "/reset-password", [sendResetPasswordSchema, errors], authService.sendResetPassword);
  // fastify.post("/signup", [signupSchema, errors], authService.signup);
  // fastify.get("/token", [isAuthenticated], authService.token);

  fastify.log.info("routes/auth registered");

  done();
};

export const autoPrefix = "/auth";

export default authRoutes;
