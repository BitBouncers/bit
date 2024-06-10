import { FastifyPluginCallback } from "fastify";
import { hospitalService } from "../services/index";

const hospitalRoutes: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.get("/hospitals", hospitalService.hospitals);

  done();
};

export default hospitalRoutes;
