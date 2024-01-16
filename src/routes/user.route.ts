import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { userService } from "../services/index";

const userRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  // fastify.get("/me", [isAuthenticated], userController.me);
  // fastify.get( "/:uid/images", [isAuthenticated, isAuthorized], userController.images);
  // fastify.get("/patients", [isAuthenticated, isStaff], userController.patients);
  // fastify.get("/profile", [isAuthenticated], userController.profile);

  // fastify.put( "/email", [isAuthenticated, updateEmailSchema, errors], userController.updateNewEmail);
  // fastify.put( "/profile", [isAuthenticated, updateProfileSchema, errors], userController.updateProfile);

  // fastify.post( "/rate", [isAuthenticated, rateRadiologistSchema, errors], userController.rateRadiologist);
  // fastify.post( "/upload-image", [isAuthenticated, isStaff, uploadImageSchema, errors], userController.uploadImage); // router.get("/radiologists", async (request, reply) => { reply.type("application/json").code(200); return { radiologists: [] }; });

  // fastify.post( "/:uid/assign/radiologist", [isAuthenticated, isAuthorized], userController.assignRadiologist);
  // fastify.delete( "/:uid/remove/radiologist", [isAuthenticated, isAuthorized], userController.removeRadiologist);

  // fastify.get("/radiologists", async function (request, reply) { return { radiologists: [] }; });
  fastify.get("/meet-our-radiologists", userService.meetOurRadiologists);

  fastify.log.info("routes/user registered");

  done();
};

export const autoPrefix = "/user";

export default userRoutes;
