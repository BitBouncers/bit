import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";

const imageRoutes: FastifyPluginCallback = (
  _fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  // fastify.put("/:image_uid", [isAuthenticated, updateImageNoteSchema, errors, isStaff], imageService.updateImageNote);

  done();
};

export const autoPrefix = "/image";

export default imageRoutes;
