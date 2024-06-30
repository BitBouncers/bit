import { FastifyReply, FastifyRequest } from "fastify";

interface IHospitalService {
  hospitals: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
}

export default class HospitalService implements IHospitalService {
  hospitals = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await request.server.pg.query(
        // eslint-disable-next-line quotes
        `SELECT uid, name from "Hospital" ORDER BY name`
      );

      if (result.rows) {
        return reply.send({ hospitals: [] });
      }

      reply.send({ hospitals: result.rows });
    } catch (error: unknown) {
      console.log("hospital.service.hospitals: ", error);
      reply.send({ hospitals: [] });
    }
  };
}
