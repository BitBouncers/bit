import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { isAuthenticated } from "src/middlewares/firebase-auth";
import { isStaff } from "src/middlewares/isStaff";
import { updateImageNoteSchema } from "src/middlewares/validators";
import { imageService } from "src/services";

const imageRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  fastify.patch("/:image_uid", {
    ...updateImageNoteSchema,
    preHandler: [isAuthenticated, isStaff],
    handler: imageService.updateImageNote,
  });

  done();
};

export const autoPrefix = "/image";

export default imageRoutes;
