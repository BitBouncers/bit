import { FastifyPluginCallback } from "fastify";

const notificationRoutes: FastifyPluginCallback = (_fastify, _opts, done) => {
  // [isAuthenticated, isAuthorized],
  // fastify.get("/polling", notificationController.polling);

  // [isAuthenticated, isAuthorized, readNotificationSchema, errors],
  // fastify.put("/read", notificationController.read);

  done();
};

export default notificationRoutes;
