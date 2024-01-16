import { hospitalService } from "../services/index";

const hospitalRoutes = (fastify, opts, done) => {
  fastify.get("/hospitals", hospitalService.hospitals);

  fastify.log.info("routes/hospital registered")

  done();
};

export default hospitalRoutes;
