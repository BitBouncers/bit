import { FastifyReply, FastifyRequest, RateRadiologist } from "fastify";

export const checkRateRadiologists = async (
  request: FastifyRequest<RateRadiologist>,
  reply: FastifyReply
) => {
  const path = "/api/user/rate";

  if (request.body.uid == undefined) {
    return reply.code(400).send({
      errors: [
        {
          msg: "Radiologist's uid is required",
          path,
        },
      ],
    });
  }

  const result = await request.server.pg.transact(async (client) => {
    const uid = await client.query(
      `
      SELECT uid
      FROM "User"
      WHERE uid = $1`,
      [request.body.uid]
    );
    if (!uid.rowCount) {
      return reply.code(400).send({
        errors: [
          {
            msg: "Radiologist does not exist",
            path,
          },
        ],
      });
    }

    const role = await client.query(
      `
      SELECT role
      FROM "User"
      WHERE uid = $1 AND role = 'RADIOLOGIST'`,
      [request.body.uid]
    );
    if (!role.rowCount) {
      return reply.code(400).send({
        errors: [
          {
            msg: "User is not a radiologist",
            path,
          },
        ],
      });
    }

    const ratingsEnabled = await client.query(
      `
    SELECT
      CASE
          WHEN allow_ratings = true THEN 1
          ELSE 0
      END as allow_ratings
    FROM "User" WHERE uid = $1`,
      [request.body.uid]
    );

    return {
      uid: uid.rows[0].uid ?? undefined,
      role: role.rows[0].role ?? undefined,
      allow_ratings: ratingsEnabled.rows[0].allow_ratings,
    };
  });

  if (!result.uid) {
    return reply.code(400).send({
      errors: [
        {
          msg: "Radiologist's uid is required",
          path,
        },
      ],
    });
  }

  if (!result.role) {
    return reply.code(400).send({
      errors: [
        {
          msg: "Radiologist does not exist",
          path,
        },
      ],
    });
  }

  if (!result.allow_ratings) {
    return reply.code(400).send({
      errors: [
        {
          msg: "Radiologist current has ratings disabled",
          path,
        },
      ],
    });
  }
};
