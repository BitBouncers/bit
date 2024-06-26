import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyPluginOptions,
} from "fastify";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import { isAuthorizedOrStaff } from "src/middlewares/isAuthorizedOrStaff";
import { isStaff } from "src/middlewares/isStaff";
import {
  updateEmailSchema,
  updateProfileSchema,
} from "src/middlewares/validators";
import { userService } from "src/services";

const userRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions,
  done
) => {
  fastify.get("/me", {
    preHandler: [isAuthenticated],
    handler: userService.me,
  });

  fastify.get("/:uid/images", {
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: userService.images,
  });

  fastify.get("/patients", {
    preHandler: [isAuthenticated, isStaff],
    handler: userService.patients,
  });

  fastify.get("/profile", {
    preHandler: [isAuthenticated],
    handler: userService.profile,
  });

  fastify.put("/email", {
    ...updateEmailSchema,
    preHandler: [isAuthenticated],
    handler: userService.updateEmail,
  });
  fastify.put("/profile", {
    ...updateProfileSchema,
    preHandler: [isAuthenticated],
    handler: userService.updateProfile,
  });

  // fastify.post( "/rate", [isAuthenticated, rateRadiologistSchema, errors], userController.rateRadiologist);
  // fastify.post( "/upload-image", [isAuthenticated, isStaff, uploadImageSchema, errors], userController.uploadImage); // router.get("/radiologists", async (request, reply) => { reply.type("application/json").code(200); return { radiologists: [] }; });

  // fastify.post( "/:uid/assign/radiologist", [isAuthenticated, isAuthorized], userController.assignRadiologist);
  // fastify.delete( "/:uid/remove/radiologist", [isAuthenticated, isAuthorized], userController.removeRadiologist);

  fastify.get("/radiologists", {
    preHandler: [isAuthenticated],
    handler: userService.radiologists,
  });

  fastify.get("/meet-our-radiologists", {
    handler: userService.meetOurRadiologists,
  });

  done();
};

export const autoPrefix = "/user";

export default userRoutes;
