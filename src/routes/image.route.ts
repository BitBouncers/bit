import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";

const imageRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  // fastify.put("/:image_uid", [isAuthenticated, updateImageNoteSchema, errors, isStaff], imageService.updateImageNote);

  fastify.log.info("routes/image registered");

  done();
};

export const autoPrefix = "/image";

export default imageRoutes;
