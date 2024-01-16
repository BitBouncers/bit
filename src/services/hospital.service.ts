import { FastifyReply, FastifyRequest } from "fastify";

export async function hospitals(
  _request: FastifyRequest,
  _reply: FastifyReply
) {
  /* const result = await dbConn
  .execute("SELECT uid, name from Hospital ORDER BY name")
  .catch((error) => {
    console.log("hospital.service.hospitals: ", error);
    res.json({ hospitals: [] });
  });

res.json({ hospitals: result.rows }); */
}
