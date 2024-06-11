import {
  FastifyInstance,
  FastifyPluginCallback,
  RegisterOptions,
} from "fastify";
import { hospitalService } from "src/services";

const hospitalRoutes: FastifyPluginCallback = (
  fastify: FastifyInstance,
  _opts: RegisterOptions,
  done
) => {
  fastify.get("/hospitals", hospitalService.hospitals);

  done();
};

export const autoPrefix = "/hospital";

export default hospitalRoutes;
