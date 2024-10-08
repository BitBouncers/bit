import {
  FastifyInstance,
  FastifyPluginCallback,
  FastifyPluginOptions,
} from "fastify";
import { checkRateRadiologists } from "src/middlewares/check-rate-radiologist";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import { isAuthorizedOrStaff } from "src/middlewares/isAuthorizedOrStaff";
import { isStaff } from "src/middlewares/isStaff";
import {
  rateRadiologistSchema,
  updateEmailSchema,
  updateProfileSchema,
  uploadImageSchema,
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

  fastify.post("/rate", {
    ...rateRadiologistSchema,
    preHandler: [isAuthenticated, checkRateRadiologists],
    handler: userService.rateRadiologist,
  });

  fastify.post("/upload-image", {
    ...uploadImageSchema,
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: userService.uploadImage,
  });

  fastify.post("/:uid/assign/radiologist", {
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: userService.assignRadiologist,
  });

  fastify.delete("/:uid/remove/radiologist", {
    preHandler: [isAuthenticated, isAuthorizedOrStaff],
    handler: userService.removeRadiologist,
  });

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
