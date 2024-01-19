import { hospitalService } from "../services/index";

const hospitalRoutes = (fastify, _opts, done) => {
  fastify.get("/hospitals", hospitalService.hospitals);

  done();
};

export default hospitalRoutes;
