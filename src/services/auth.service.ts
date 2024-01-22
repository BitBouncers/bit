import { FirebaseError } from "firebase/app";
import { login } from "src/config/firebase";

/* export async function addPatient(request, reply) {
  const { email, dob, first_name, last_name, title } = request.body;

  const emailExists = await dbConn
    .execute("SELECT uid FROM User WHERE email = ?", [email])
    .catch((error) => {
      console.log(error.code, error.message);
      return reply.status(409).send({ msg: "Unable to add patient" });
    });

  if (emailExists.length > 0) {
    const patient_uid = emailExists[0].uid;

    try {
      const patientRelations = await sql`
        SELECT COUNT(*)::int AS count
        FROM "PatientRelation"
        WHERE
          patient_uid = ${patient_uid}
        AND EXISTS (
          SELECT uid FROM "User"
          WHERE role = 'PHYSICIAN'
          AND uid = "PatientRelation".staff_uid
        )
      `;

      if (patientRelations.rows[0]["count(*)"] > 1) {
        return reply.status(409).send({
          errors: [
            {
              msg: "This patient is already assigned to another physician.",
            },
          ],
        });
      }

      await dbConn.execute(
        "INSERT IGNORE INTO PatientRelation(patient_uid, staff_uid) VALUES(?, ?)",
        [emailExists.rows[0].uid, request.userUID]
      );

      notify(
        emailExists.rows[0].uid,
        request.userUID,
        "You have been added as a patient."
      );

      return reply.send({ success: true, msg: "Successfully added patient" });
    } catch (error) {
      console.log("auth.addPatient: ", error.message);
      return reply.status(409).send({ msg: "Unable to add patient" });
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
        await sql`INSERT INTO User(uid, email, dob, first_name, last_name, title, role) VALUES(${userRecord.uid}, ${email}, ${dob}, ${first_name}, ${last_name}, ${title}, ${role})`.then(
          async () => {
            await adminAuth
              .updateUser(userRecord.uid, {
                displayName: title ? `${title} ${first_name} ${last_name}` : `${first_name} ${last_name}`,
              })
              .then(() => {
                sendPasswordResetEmail(auth, email).then(() => {
                  console.log("Password reset email sent to: ", email);
                  reply.status(200).send({
                    msg: "Successfully added new patient",
                  });
                });
              })
              .catch((error) =>
                console.log("Error updating displayName: ", error)
              );
          });
        await dbConn
          .execute(
            "INSERT IGNORE INTO PatientRelation(patient_uid, staff_uid) VALUES(?, ?)",
            [userRecord.uid, request.userUID]
          )
          .catch((error) =>
            console.log("auth.service.addPatient: ", error.code, error.message)
          );
      });
  } catch (error) {
    console.log("Error inserting new user:", error.message);
    reply.status(409).send({
      errors: [{ msg: "Unable to add patient", path: "auth/add-patient" }],
    });
  }
} */

import { FastifyReply, FastifyRequest } from "fastify";

/* export async function portal(request, reply) {
  const { role } = request.params;
  const { email } = request.body;
  try {
    const result = await dbConn.execute(
      "SELECT role FROM User WHERE email = ?",
      [email]
    );
    if (role.toUpperCase() === result.rows[0].role) {
      return reply.status(200).send({ success: true });
    } else {
      return reply.status(409).send({ msg: "Unable to access portal" });
    }
  } catch (error) {
    console.log("auth.service.portal: ", error);
    reply.status(409).send({ msg: "Unable to access portal" });
  }
} */

/* export async function sendResetPassword(request, reply) {
  try {
    await sendPasswordResetEmail(auth, request.body.email);
    reply.send({ success: true });
  } catch (error) {
    console.log("user.service.resetPassword: ", error);
    reply.send({ success: false });
  }
} */

/* export async function signup(request, reply) {
  const { email, password, dob, first_name, last_name, title, role } = request.body;
  const isPhysician = request.body.role === "physician";

  if (isPhysician) {
    await adminAuth
      .updateUser(request.userUID, {
        email: email,
        password: password,
      })
      .then((userRecord) => {
        sql`UPDATE User SET email = ${email}, title = ${title}, claimed_as_physician = true, role = 'PHYSICIAN', title = 'Dr.' WHERE uid = ${userRecord.uid}`
          .then((result) => {
            if (result.rowsAffected > 0) {
              reply
                .status(200)
                .send({ msg: "Successfully created physician account" });
            }
            adminAuth
              .updateUser(userRecord.uid, {
                displayName: title + " " + first_name + " " + last_name,
              })
              .catch((error) => console.log("Error updating displayName: ", error));
          })
          .catch((error) => {
            console.log("Error adding physician: ", error.body.message);
            return reply.status(409).send({
              errors: [
                { msg: "Unable to create account", path: "auth/signup" },
              ],
            });
          });
      })
      .catch((error) => {
        console.log("Error creating new user:", error.errorInfo);
        return reply
          .status(409)
          .send({ errors: [{ msg: error.message, path: "auth/signup" }] });
      });
  } else {
    await adminAuth
      .createUser({
        email: email,
        password: password,
      })
      .then((userRecord) => {
        // Create a new user in the planetscale database since we use firebase auth
        // for authentication and planetscale for storing user data
        sql`
          INSERT INTO
            User(uid, email, dob, first_name, last_name, title, role)
          VALUES(${userRecord.uid}, ${email}, ${dob}, ${first_name}, ${last_name}, ${title}, ${role})`
          .then((result) => {
            if (result.rowsAffected > 0) {
              reply.status(200).send({ msg: "Successfully created new user" });
            }
            adminAuth
              .updateUser(userRecord.uid, {
                displayName: title ? `${title} ${first_name} ${last_name}` : `${first_name} ${last_name}`,
              })
              .catch((error) => console.log("Error updating displayName: ", error));
          })
          .catch((error) => {
            console.log("Error inserting new user:", error.body.message);
            reply.status(409).send({
              errors: [
                { msg: "Unable to create account", path: "auth/signup" },
              ],
            });
          });
      })
      .catch((error) => {
        console.log("Error creating new user:", error.errorInfo);
        return reply
          .status(409)
          .send({ errors: [{ msg: error.message, path: "auth/signup" }] });
      });
  }
} */

interface IAuthService {
  loginThroughFirebase: (
    request: FastifyRequest<{ Body: { email: string; password: string } }>,
    reply: FastifyReply
  ) => Promise<FirebaseError | bit.AuthLoginResponse | undefined>;
}

export default class AuthService implements IAuthService {
  loginThroughFirebase = async (
    request: FastifyRequest<{ Body: { email: string; password: string } }>,
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
}
