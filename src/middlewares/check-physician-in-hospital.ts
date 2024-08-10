import {
  AuthSignupPhysician,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from "fastify";

export const checkPhysicianExistsInHospital = async (
  request: FastifyRequest<AuthSignupPhysician>,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) => {
  const { dob, first_name, last_name, hospital, role } = request.body;

  if (role === "physician") {
    await request.server.pg
      .query(
        `
      SELECT
        U.uid, U.first_name, U.last_name, U.dob, U.claimed_as_physician
      FROM "User" AS U
      JOIN
        "HospitalPhysician" AS HP ON U.uid = HP.physician_uid
      WHERE HP.hospital_uid = '${hospital}'
      AND
        U.first_name = '${first_name}'
      AND
        U.last_name = '${last_name}'
      AND
        U.dob = '${dob}'
      AND
        U.claimed_as_physician = false
      `
      )
      .then((result) => {
        if (result.rowCount === 0) {
          return reply
            .code(400)
            .send({ error: "Physician does not exist in hospital" });
        } else if (result.rows[0].claimed_as_physician === 0) {
          request.userUID = result.rows[0].uid;
          done();
        } else if (result.rows[0].claimed_as_physician === 1) {
          return reply
            .code(400)
            .send({ error: "This email is already in use" });
        } else {
          return reply
            .code(400)
            .send({ error: "Unable to create your physician account" });
        }
      })
      .catch((error) =>
        console.log(
          "checkPhysicianExistsInHospital: ",
          error.code,
          error.message
        )
      );
  }

  done();
};
