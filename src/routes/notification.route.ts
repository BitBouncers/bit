import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import { isAuthorizedOrStaff } from "src/middlewares/isAuthorizedOrStaff";
import { readNotificationSchema } from "src/middlewares/validators";
import { notificationService } from "src/services";

const notificationRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  fastify.get("/polling", {
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: notificationService.polling,
  });

  fastify.put("/read", {
    ...readNotificationSchema,
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: notificationService.read,
  });

  done();
};

export const autoPrefix = "/notification";

export default notificationRoutes;
