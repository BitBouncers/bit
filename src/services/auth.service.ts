import crypto from "crypto";
import {
  AuthAddPatient,
  AuthLoginBody,
  AuthLoginPortal,
  AuthPasswordReset,
  AuthSignupBody,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { FirebaseError } from "firebase/app";
import {
  adminAuth,
  auth,
  login,
  sendPasswordResetEmail,
} from "src/config/firebase";
import { notify } from "src/utils/notify";

interface IAuthService {
  addPatient: (
    request: FastifyRequest<AuthAddPatient>,
    reply: FastifyReply
  ) => Promise<void>;

  loginThroughFirebase: (
    request: FastifyRequest<AuthLoginBody>,
    reply: FastifyReply
  ) => Promise<FirebaseError | bit.AuthLoginResponse | undefined>;

  portal: (
    request: FastifyRequest<AuthLoginPortal>,
    reply: FastifyReply
  ) => Promise<void>;

  sendPasswordReset: (
    request: FastifyRequest<AuthPasswordReset>,
    reply: FastifyReply
  ) => Promise<void>;

  signup: (
    request: FastifyRequest<AuthSignupBody>,
    reply: FastifyReply
  ) => Promise<void>;

  verifyToken: (
    request: FastifyRequest<AuthLoginBody>,
    reply: FastifyReply
  ) => Promise<void>;
}

export default class AuthService implements IAuthService {
  addPatient = async (
    request: FastifyRequest<AuthAddPatient>,
    reply: FastifyReply
  ) => {
    const { email, dob, first_name, last_name, title } = request.body;

    const emailExists = await request.server.pg
      .query(`SELECT uid FROM "User" WHERE email = '${email}'`)
      .catch((error: unknown) => {
        console.log("auth.addPatient.emailExists: ", error);
        return reply.code(409).send({ msg: "Unable to add patient" });
      });

    if (emailExists.rowCount) {
      const patient_uid = emailExists.rows[0].uid;

      try {
        const patientRelations = await request.server.pg.query(`
        SELECT COUNT(*)::int AS count
        FROM "PatientRelation"
        WHERE
          patient_uid = '${patient_uid}'
        AND EXISTS (
          SELECT uid FROM "User"
          WHERE role = 'PHYSICIAN'
          AND uid = "PatientRelation".staff_uid
        )
      `);

        if (patientRelations.rowCount) {
          return reply.code(409).send({
            errors: [
              {
                msg: "This patient is already assigned to another physician.",
              },
            ],
          });
        }

        await request.server.pg.query(`
        INSERT INTO "PatientRelation" (patient_uid, staff_uid)
        VALUES ('${emailExists.rows[0].uid}', '${request.userUID}')
        ON CONFLICT (patient_uid, staff_uid) DO NOTHING
      `);

        if (request.userUID) {
          notify(request.server.pg.pool, {
            recipient: emailExists.rows[0].uid,
            sender: request.userUID,
            message: "You have been added as a patient.",
          });
        } else {
          console.log(
            "auth.addpatient: unable to notify, missing request.userUID"
          );
        }

        return reply.send({ success: true, msg: "Successfully added patient" });
      } catch (error: unknown) {
        console.log("auth.addPatient: ", error);
        return reply.code(409).send({ msg: "Unable to add patient" });
      }
    }

    const role = "PATIENT";
    try {
      await adminAuth
        .createUser({
          email: email,
          password: crypto.randomBytes(18).toString("hex"),
        })
        .then(async (userRecord) => {
          await request.server.pg
            .query(
              `
              INSERT INTO "User" (uid, email, dob, first_name, last_name, title, role)
              VALUES ('${userRecord.uid}', '${email}', '${dob}', '${first_name}',
                      '${last_name}', '${title}', '${role}')
              `
            )
            .then(async () => {
              await adminAuth
                .updateUser(userRecord.uid, {
                  displayName: title
                    ? `${title} ${first_name} ${last_name}`
                    : `${first_name} ${last_name}`,
                })
                .then(() => {
                  sendPasswordResetEmail(auth, email).then(() => {
                    console.log("Password reset email sent to: ", email);
                    reply.code(200).send({
                      msg: "Successfully added new patient",
                    });
                  });
                })
                .catch((error: unknown) =>
                  console.log("Error updating displayName: ", error)
                );
            });
          await request.server.pg
            .query(
              `INSERT IGNORE INTO PatientRelation(patient_uid, staff_uid) VALUES('${userRecord.uid}', '${request.userUID}')`
            )
            .catch((error) =>
              console.log(
                "auth.service.addPatient: ",
                error.code,
                error.message
              )
            );
        });
    } catch (error: unknown) {
      console.log("Error inserting new user:", error);
      reply.code(409).send({
        errors: [{ msg: "Unable to add patient", path: "auth/add-patient" }],
      });
    }
  };

  loginThroughFirebase = async (
    request: FastifyRequest<AuthLoginBody>,
    reply: FastifyReply
  ) => {
    const { email, password } = request.body;
    const res = await login(email, password);

    if (res instanceof FirebaseError) {
      const r = { errors: [{ msg: res.message, path: "auth/login" }] };
      if (res.code === "auth/invalid-credential") {
        r.errors[0].msg = "The email or password you entered is incorrect.";
      }
      return reply.code(409).send(r);
    }

    reply.send(res);
  };

  portal = async (
    request: FastifyRequest<AuthLoginPortal>,
    reply: FastifyReply
  ) => {
    try {
      const { role } = request.params;
      const { email } = request.body;

      const result = await request.server.pg.query(
        `SELECT role FROM "User" WHERE email = '${email}'`
      );

      if (
        result.rowCount &&
        result.rowCount > 0 &&
        result.rows[0].role &&
        role.toUpperCase() === result.rows[0].role
      ) {
        return reply.code(200).send({ success: true });
      } else {
        return reply.code(409).send({ msg: "Unable to access portal" });
      }
    } catch (error) {
      console.log("auth.service.portal: ", error);
      reply.code(409).send({ msg: "Unable to access portal" });
    }
  };

  sendPasswordReset = async (
    request: FastifyRequest<AuthPasswordReset>,
    reply: FastifyReply
  ) => {
    try {
      await sendPasswordResetEmail(auth, request.body.email);
      reply.send({ success: true });
    } catch (error) {
      console.log("user.service.resetPassword: ", error);
      reply.send({ success: false });
    }
  };

  signup = async (
    request: FastifyRequest<AuthSignupBody>,
    reply: FastifyReply
  ) => {
    const { email, password, dob, first_name, last_name, title, role } =
      request.body;
    const isPhysician = role === "physician";

    if (isPhysician) {
      await adminAuth
        .updateUser(request.userUID as string, {
          email: email,
          password: password,
        })
        .then((userRecord) => {
          request.server.pg
            .query(
              `UPDATE User SET email = '${email}', title = '${title}', claimed_as_physician = true, role = 'PHYSICIAN', title = 'Dr.' WHERE uid = '${userRecord.uid}'`
            )
            .then((result) => {
              if (result.rowCount && result.rowCount > 0) {
                reply.send({ msg: "Successfully created physician account" });
              }
              adminAuth
                .updateUser(userRecord.uid, {
                  displayName: title + " " + first_name + " " + last_name,
                })
                .catch((error) =>
                  console.log("Error updating displayName: ", error)
                );
            })
            .catch((error) => {
              console.log("Error adding physician: ", error.detail);
              return reply.code(409).send({
                errors: [
                  { msg: "Unable to create account", path: "auth/signup" },
                ],
              });
            });
        })
        .catch((error) => {
          console.log("Error creating new user: ", error.errorInfo);
          return reply
            .code(409)
            .send({ errors: [{ msg: error.message, path: "auth/signup" }] });
        });
    } else {
      await adminAuth
        .createUser({
          email: email,
          password: password,
        })
        .then((userRecord) => {
          // Create a new user in the supabase db since we use firebase auth
          // for authentication and supabase for storing user data
          request.server.pg
            .query(
              `
          INSERT INTO
            "User" (uid, email, dob, first_name, last_name, title, role)
          VALUES ('${userRecord.uid}', '${email}', '${dob}', '${first_name}', '${last_name}', '${title}', '${role}')`
            )
            .then((result) => {
              if (result.rowCount) {
                reply.send({ msg: "Successfully created new user" });
              }
              adminAuth
                .updateUser(userRecord.uid, {
                  displayName: title
                    ? `${title} ${first_name} ${last_name}`
                    : `${first_name} ${last_name}`,
                })
                .catch((error) =>
                  console.log("Error updating displayName: ", error)
                );
            })
            .catch((error) => {
              console.log("Error inserting new user:", error.detail);
              reply.code(409).send({
                errors: [
                  { msg: "Unable to create account", path: "auth/signup" },
                ],
              });
            });
        })
        .catch((error) => {
          console.log("Error creating new user: ", error.errorInfo);
          reply
            .code(409)
            .send({ errors: [{ msg: error.message, path: "auth/signup" }] });
        });
    }
  };

  verifyToken = async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({ msg: "You are authenticated." });
  };
}
