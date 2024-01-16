import { FastifyPluginCallback } from "fastify";

const notificationRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  // [isAuthenticated, isAuthorized],
  // fastify.get("/polling", notificationController.polling);

  // [isAuthenticated, isAuthorized, readNotificationSchema, errors],
  // fastify.put("/read", notificationController.read);

  fastify.log.info("routes/notification registered");

  done();
};

export default notificationRoutes;
