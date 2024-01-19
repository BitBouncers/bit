import { eq } from "drizzle-orm";
import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { rating, staffCredentials, user } from "../../drizzle/schema";

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

  fastify.get("/radiologists", async (_request, reply) => {
    const radiologists = await fastify.db
      .select({
        uid: user.uid,
        title: user.title,
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        profile_image_url: user.profileImageUrl,
        bio: staffCredentials.bio,
        expertise: staffCredentials.expertise,
        years_of_exp: staffCredentials.yearsOfExp,
        average_rating: rating.rating,
      })
      .from(user)
      .leftJoin(staffCredentials, eq(user.uid, staffCredentials.uid))
      .leftJoin(rating, eq(user.uid, rating.userUid))
      .where(eq(user.role, "RADIOLOGIST"));

    reply.send({ radiologists });
  });

  fastify.get("/meet-our-radiologists", async (_request, reply) => {
    const radiologists = await fastify.db
      .select({
        uid: user.uid,
        title: user.title,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_image_url: user.profileImageUrl,
        expertise: staffCredentials.expertise,
      })
      .from(user)
      .leftJoin(staffCredentials, eq(user.uid, staffCredentials.uid))
      .where(eq(user.role, "RADIOLOGIST"))
      .catch((error: unknown) => {
        console.log("user.service.meetOurRadiologists: ", error);
        return reply.send({ radiologists: [] });
      });

    if (!radiologists) {
      return reply.send({ radiologists: [] });
    }

    reply.send(radiologists);
  });

  done();
};

export const autoPrefix = "/user";

export default userRoutes;
