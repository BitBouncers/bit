import {
  FastifyReply,
  FastifyRequest,
  RateRadiologist,
  UpdateEmail,
  UpdateProfile,
  UploadImage,
  UserUIDParams,
} from "fastify";
import { FirebaseAuthError } from "firebase-admin/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { DatabaseError, Pool, QueryResult } from "pg";
import { adminAuth, auth } from "src/config/firebase";
import { notify } from "src/utils/notify";

type Role = "Patient" | "Physician" | "Radiologist" | "Admin";

type MeRole = {
  role: Role;
};

interface IUserService {
  me: (request: FastifyRequest, reply: FastifyReply) => Promise<MeRole>;

  images: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  radiologists: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  meetOurRadiologists: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  patients: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  profile: (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => Promise<void>;

  rateRadiologist: (
    request: FastifyRequest<RateRadiologist>,
    reply: FastifyReply
  ) => Promise<void>;

  updateEmail: (
    request: FastifyRequest<UpdateEmail>,
    reply: FastifyReply
  ) => Promise<void>;

  uploadImage: (
    request: FastifyRequest<UploadImage>,
    reply: FastifyReply
  ) => Promise<void>;

  updateProfile: (
    request: FastifyRequest<UpdateProfile>,
    reply: FastifyReply
  ) => Promise<void>;
}

export default class UserService implements IUserService {
  me = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.userUID) {
      return reply
        .code(401)
        .send({ error: "There was an error with your request." });
    }

    const user = await request.server.pg.query(
      `SELECT role FROM "User" WHERE uid = '${request.userUID}';`
    );

    if (user && ["PHYSICIAN", "RADIOLOGIST"].includes(user.rows[0].role)) {
      return reply.send({
        role:
          user.rows[0].role.charAt(0) +
          user.rows[0].role.slice(1).toLowerCase(),
      });
    } else {
      return reply.send({ role: "Patient" });
    }
  };

  images = async (
    request: FastifyRequest<UserUIDParams>,
    reply: FastifyReply
  ) => {
    try {
      const images = await request.server.pg.query(
        `
        SELECT
          I.uid, I.url, I."createdAt", U.first_name, U.last_name,
          UA_uploaded.title AS "uploadedBy_title",
          UA_uploaded.first_name AS "uploadedBy_first_name",
          UA_uploaded.last_name AS "uploadedBy_last_name",
          CASE
            WHEN COUNT(INN.note) > 0 THEN JSON_AGG(JSON_BUILD_OBJECT(
            'uid', INN.author_uid, 'note', INN.note, 'full_name',
            CONCAT(UA.title, ' ' , UA.first_name, ' ' , UA.last_name),
            'role',
            UA.role,
            'recommendation',
              CASE
                WHEN URA.uid IS NOT NULL THEN CONCAT(URA.first_name, ' ' , URA.last_name)
              ELSE NULL
            END
            ))
            ELSE '[]'::json
          END AS authors
        FROM "User" U
        JOIN "Image" I ON U.uid = I.uploaded_for
        LEFT JOIN "User" UA_uploaded ON I.uploaded_by = UA_uploaded.uid
        LEFT JOIN (
          SELECT INN.uid, INN.note, INN.image_uid, INN.author_uid, INN."createdAt", INN.recommend_uid
          FROM "ImageNote" INN
          JOIN "User" UA ON INN.author_uid = UA.uid
          WHERE UA.role IN ('PHYSICIAN', 'RADIOLOGIST')
        ) AS INN ON I.uid = INN.image_uid
        LEFT JOIN "User" URA ON INN.recommend_uid = URA.uid AND URA.role = 'RADIOLOGIST'
        LEFT JOIN "User" UA ON INN.author_uid = UA.uid
        WHERE U.role = 'PATIENT' AND U.uid = '${request.params.uid}'
        GROUP BY I.uid, I.url, I."createdAt", U.first_name, U.last_name, UA_uploaded.title, UA_uploaded.first_name, UA_uploaded.last_name;
    `
      );

      reply.send({ images: images.rows });
    } catch (error: unknown) {
      console.log("user.service.images: ", error);
      reply.send({ images: [] });
    }
  };

  radiologists = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await request.server.pg.query(`
      SELECT
        U.uid, U.title, U.first_name, U.last_name, U.email, U.profile_image_url,
        SC.bio, SC.expertise, SC.years_of_exp,
        AVG(R.rating) as average_rating
      FROM "User" U
      LEFT JOIN
        "StaffCredentials" SC ON U.uid = SC.uid
      LEFT JOIN
        "Rating" R ON U.uid = R.rated_uid
      WHERE U.role = 'RADIOLOGIST'
      GROUP BY
        U.uid, U.title, U.first_name, U.last_name, U.email, U.profile_image_url,
        SC.bio, SC.expertise, SC.years_of_exp;
  `);

    reply.send({ radiologists: result.rows });
  };

  meetOurRadiologists = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const result = await request.server.pg.query(
      `
      SELECT U.uid, U.title, U.first_name, U.last_name, U.profile_image_url,
        SC.expertise
      FROM "User" U
      LEFT JOIN "StaffCredentials" SC ON U.uid = SC.uid
      WHERE U.role = 'RADIOLOGIST'
      ORDER BY RANDOM()
      LIMIT 6
    `
    );

    if (!result.rowCount) {
      return reply.send({ radiologists: [] });
    }

    reply.send({ radiologists: result.rows });
  };

  patients = async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await request.server.pg
      .query(`SELECT role FROM "User" WHERE uid = '${request.userUID}';`)
      .then(async (result) => {
        if (result.rowCount === 1 && result.rows[0] === "RADIOLOGIST") {
          return await patientsAsRadiologistQuery(
            request.server.pg.pool,
            request.userUID
          );
        } else {
          return await patientsAsPhysicianQuery(
            request.server.pg.pool,
            request.userUID
          );
        }
      });

    if (result.length === 0) {
      console.log("user.service.patients: ", result);
      reply.send({ patients: [] });
    }

    reply.send({ patients: result });
  };

  profile = async (request: FastifyRequest, reply: FastifyReply) => {
    const results = await request.server.pg
      .transact(async (client) => {
        const user = await client.query(
          `SELECT
          title, first_name, last_name, TO_CHAR(dob, 'MM-DD-YYYY') AS dob, email, profile_image_url, allow_ratings, SC.bio, SC.expertise, SC.years_of_exp
        FROM "User" U
        LEFT JOIN "StaffCredentials" SC ON U.uid = SC.uid
        WHERE U.uid = $1`,
          [request.userUID]
        );
        const staff = await client.query(
          `SELECT
        U.uid AS uid,
        U.first_name AS first_name,
        U.last_name AS last_name,
        U.role AS role,
        U.title AS title
      FROM
          "User" AS U
      INNER JOIN
          "PatientRelation" AS PR ON U.uid = PR.staff_uid
      WHERE
          PR.patient_uid = $1`,
          [request.userUID]
        );
        return [user, staff];
      })
      .catch((error) => {
        console.log("user.service.profile: ", error);
        return reply.code(204).send({});
      });

    reply.send({ profile: results[0].rows[0], staff: results[1].rows });
  };

  rateRadiologist = async (
    request: FastifyRequest<RateRadiologist>,
    reply: FastifyReply
  ) => {
    const { uid, rating, comment } = request.body;
    const now = new Date();

    try {
      const rating_uid = crypto.randomUUID();
      await request.server.pg
        .query(
          `
          INSERT INTO
            "Rating" (uid, comment, rating, rated_uid, user_uid, "createdAt", "editedAt")
          VALUES($1, $2, $3, $4, $5, $6, $7)
          `,
          [rating_uid, comment || "", rating, uid, request.userUID, now, now]
        )

        .then((result) => {
          if (result.rowCount && result.rowCount > 0) {
            reply.send({
              success: true,
              msg: "Rating submitted successfully.",
            });
            notify(request.server.pg.pool, {
              recipient: uid,
              sender: request.userUID!,
              message: "A patient has rated your service.",
            });
          } else {
            reply.send({ success: false });
          }
        });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ((error as DatabaseError).code === "23505") {
          await request.server.pg
            .query(
              `
              SELECT rating
              FROM "Rating"
              WHERE rated_uid = $1 AND user_uid = $2
              `,
              [uid, request.userUID]
            )
            .then(async (result) => {
              if (result.rows[0].rating === rating) {
                return reply.send({
                  success: true,
                  msg: "Same rating already exists.",
                });
              }

              await request.server.pg
                .query(
                  `
                    UPDATE "Rating"
                    SET comment = $1, rating = $2
                    WHERE rated_uid = $3 AND user_uid = $4
                  `,
                  [comment || "", rating, uid, request.userUID]
                )
                .then((result) => {
                  if (result.rowCount && result.rowCount > 0) {
                    reply.send({
                      success: true,
                      msg: "Rating updated successfully.",
                    });
                    notify(request.server.pg.pool, {
                      recipient: uid,
                      sender: request.userUID!,
                      message: "A patient has updated their rating.",
                    });
                  }
                })
                .catch((error) => {
                  console.log("user.service.rateRadiologist: ", error);
                  reply.send({ success: false });
                });
            });
        }
      }
    }
  };

  updateEmail = async (
    request: FastifyRequest<UpdateEmail>,
    reply: FastifyReply
  ) => {
    const { email, password } = request.body;

    if (!request.userUID) return reply.code(422).send({ success: false });

    const currentUser = await adminAuth.getUser(request.userUID);

    if (!currentUser.email) return reply.code(422).send({ success: false });

    try {
      // Reauthenticate the user before updating the email
      await signInWithEmailAndPassword(auth, currentUser.email, password);

      await adminAuth.updateUser(request.userUID, { email });

      // Update the email in the database
      await request.server.pg.query(
        `
        UPDATE "User"
        SET email = $1
        WHERE uid = $2
        `,
        [email, request.userUID]
      );

      reply.send({ success: true, msg: "Email updated successfully." });
    } catch (error) {
      console.log("user.service.updateNewEmail:", error);
      if (error instanceof FirebaseAuthError)
        if (error.code === "auth/invalid-login-credentials") {
          return reply
            .code(422)
            .send({ success: false, errors: [{ msg: "Incorrect password" }] });
        } else if (error.code === "auth/too-many-requests") {
          return reply.code(422).send({
            success: false,
            errors: [{ msg: "Too many requests. Try again later." }],
          });
        } else {
          reply.code(422).send({ success: false });
        }
    }
  };

  uploadImage = async (
    request: FastifyRequest<UploadImage>,
    reply: FastifyReply
  ) => {
    if (!request.userUID) return reply.code(422).send({ success: false });

    const patient = await request.server.pg.query(
      `
        SELECT uid
        FROM "User" WHERE uid = $1
      `,
      [request.body.patient]
    );

    if (!patient.rowCount) {
      return reply.code(400).send({
        errors: [{ msg: "Patient does not exist" }],
      });
    }

    const radiologist = await request.server.pg.query(
      `
        SELECT uid
        FROM "User"
        WHERE uid = $1 AND role = 'RADIOLOGIST'
      `,
      [request.body.recommend]
    );

    if (!radiologist.rowCount) {
      return reply.code(400).send({
        errors: [{ msg: "An error occurred with the selected radiologist" }],
      });
    }

    try {
      const uuid = crypto.randomUUID();
      const results = await request.server.pg.transact(async (client) => {
        const image = await client.query(
          `
          INSERT INTO "Image" (uid, uploaded_by, uploaded_for, url)
          VALUES($1, $2, $3, $4)
          ON CONFLICT (uid) DO NOTHING
          `,
          [uuid, request.userUID, request.body.patient, request.body.url]
        );

        const imageNote = await client.query(
          `
          INSERT INTO "ImageNote" (image_uid, author_uid, note, recommend_uid)
          VALUES($1, $2, $3, $4)
          `,
          [
            uuid,
            request.userUID,
            request.body.notes ?? "",
            request.body.recommend,
          ]
        );

        return [image.rowCount, imageNote.rowCount];
      });

      if (results[0] && results[1] && results[0] > 0 && results[1] > 0) {
        notify(request.server.pg.pool, {
          recipient: request.body.patient,
          sender: request.userUID,
          message: "You have a new image from your physician.",
          to: "/imagelibrary",
        });

        if (!request.body.notes) {
          notify(request.server.pg.pool, {
            recipient: request.userUID,
            sender: request.body.patient,
            message: "Don't forget to add your notes to your patient's image.",
            to: "/patients",
          });
        }
      }
    } catch (error) {
      console.log("user.service.uploadImage: ", error);
      reply.code(422).send({ success: false });
    }

    reply.send({ success: true });
  };

  updateProfile = async (
    request: FastifyRequest<UpdateProfile>,
    reply: FastifyReply
  ) => {
    const enabled = request.body.enableRatingSystem ?? true;
    const newBio = request.body.bio ?? "";
    let profile_image_url,
      bio: QueryResult<never> | string | null = null;

    try {
      await request.server.pg.transact(async (client) => {
        const user = await client.query(
          `
        SELECT role
        FROM "User"
        WHERE uid = $1`,
          [request.userUID]
        );

        profile_image_url = await client.query(
          `
        UPDATE "User"
        SET profile_image_url = $1, allow_ratings = $2
        WHERE uid = $3`,
          [request.body.profile_image_url, enabled, request.userUID]
        );

        if (
          user.rowCount &&
          user.rowCount > 0 &&
          user.rows[0].role !== "PATIENT"
        ) {
          bio = await request.server.pg.query(
            `
          INSERT INTO "StaffCredentials" (bio, uid)
          VALUES($1, $2)
          ON CONFLICT (uid) DO UPDATE SET bio = EXCLUDED.bio
        `,
            [newBio, request.userUID]
          );
        }
        return [profile_image_url, bio];
      });

      reply.send({ success: true, data: { ...request.body } });
    } catch (error) {
      console.log("user.service.uploadImage: ", error);
      reply.code(422).send({ success: false });
    }
  };
}

/* export async function assignRadiologist(req, res) {
  await dbConn
    .execute(
      "INSERT INTO PatientRelation (patient_uid, staff_uid) VALUES (?, ?)",
      [req.userUID, req.params.uid]
    )
    .then((result) => {
      if (result.count > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false });
      }
    })
    .catch((error) => {
      console.log("user.service.assignRadiologist: ", error.detail);
      if (error.detail.includes("duplicate")) {
        return res.json({
          success: false,
          message: "You have already assigned this radiologist to your account.",
        });
      }
      res.json({ success: false });
    });
} */

/* export async function removeRadiologist(req, res) {
  await dbConn
    .execute(
      "DELETE FROM PatientRelation WHERE patient_uid = ? AND staff_uid = ?",
      [req.userUID, req.params.uid]
    )
    .then((result) => {
      if (result.count > 0) {
        res.json({ success: true });
      } else {
        res.json({ success: false, msg: "Specified radiologist not found." });
      }
    })
    .catch((error) => {
      console.log("user.service.removeRadiologist: ", error.body);
      res.json({ success: false });
    });
} */

/* export async function images(req, res) {
  const result = await dbConn
    .execute(
      "\
      SELECT \
        I.uid, I.url, I.createdAt, U.first_name, U.last_name, \
        UA_uploaded.title as uploadedBy_title, \
        UA_uploaded.first_name AS uploadedBy_first_name, \
        UA_uploaded.last_name AS uploadedBy_last_name, \
        IF(COUNT(INN.note) > 0, \
          JSON_ARRAYAGG( \
            JSON_OBJECT( \
              'uid', INN.author_uid, \
              'note', INN.note, \
              'full_name', CONCAT(UA.title, ' ', UA.first_name, ' ', UA.last_name), \
              'role', UA.role, \
              'recommendation', \
              CASE \
                WHEN URA.uid IS NOT NULL THEN CONCAT(URA.first_name, ' ', URA.last_name) \
                ELSE NULL \
              END \
            ) \
          ), \
          JSON_ARRAY() \
        ) AS authors \
      FROM User U \
      JOIN Image I ON U.uid = I.uploaded_for \
      LEFT JOIN User UA_uploaded ON I.uploaded_by = UA_uploaded.uid \
      LEFT JOIN ( \
        SELECT INN.uid, INN.note, INN.image_uid, INN.author_uid, INN.createdAt, INN.recommend_uid \
        FROM ImageNote INN \
        JOIN User UA ON INN.author_uid = UA.uid \
        WHERE UA.role IN ('PHYSICIAN', 'RADIOLOGIST') \
      ) AS INN ON I.uid = INN.image_uid \
      LEFT JOIN User URA ON INN.recommend_uid = URA.uid AND URA.role = 'RADIOLOGIST' \
      LEFT JOIN User UA ON INN.author_uid = UA.uid \
      WHERE U.role = 'PATIENT' AND U.uid = ? \
      GROUP BY I.uid, I.url",
      [req.params.uid]
    )
    .catch((error) => {
      console.log("user.service.images: ", error);
    }
  );

  res.json({ images: result.rows });
} */

/* export async function me(req, res) {
  try {
    const result = await sql`SELECT role FROM "User" WHERE uid = ${req.userUID}`;

    if (result.count === 1) {
      res.json({
        role: result[0].role.charAt(0) + result[0].role.slice(1).toLowerCase(),
      });
    } else {
      res.json({ role: "Patient" });
    }
  } catch (error) {
    console.log("user.service.me: ", error);
    res.json({ role: "Patient" });
  }
} */

/* export async function patients(req, res) {
  const result = await dbConn
    .execute("SELECT role FROM User WHERE uid = ?", [req.userUID])
    .then(async (result) => {
      if (result.count === 1 && result[0].role === "RADIOLOGIST") {
        return await patientsAsRadiologistQuery(req.userUID).catch((error) => {
          console.log("user.service.patientsAsRadiologistQuery: ", error);
        });
      } else {
        return await patientsAsPhysicianQuery(req.userUID).catch((error) => {
          console.log("user.service.patientsAsPhysicianQuery: ", error);
        });
      }
    })
    .catch((error) => {
      console.log("user.service.patients: ", error);
      res.json({ patients: [] });
    });

  res.json({ patients: result.rows });
} */

const patientsAsRadiologistQuery = async (
  pg: Pool,
  uid: string | undefined
) => {
  const radiologists =
    await pg.query(`SELECT U.uid, TO_CHAR(U.dob, 'MM-DD-YYYY') AS dob, U.first_name, U.last_name, U.email, U.profile_image_url,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'uid', I.uid,
            'url', I.url,
            'authors', COALESCE(authors_subquery.authors, '[]'::json)
            )
          ) FILTER (WHERE I.uid IS NOT NULL),
        '[]'::json
      ) AS images
      FROM "User" U
      JOIN "PatientRelation" PR ON U.uid = PR.patient_uid
      LEFT JOIN "Image" I ON U.uid = I.uploaded_for
      LEFT JOIN (
        SELECT
          INN.image_uid,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'uid', INN.author_uid,
              'note', INN.note,
              'role', UA.role,
              'full_name', CONCAT(UA.title, ' ', UA.first_name, ' ', UA.last_name)
            )
          ) AS authors
        FROM "ImageNote" INN
        JOIN "User" UA ON INN.author_uid = UA.uid
        WHERE UA.role IN ('PHYSICIAN', 'RADIOLOGIST')
        GROUP BY INN.image_uid
      ) AS authors_subquery ON I.uid = authors_subquery.image_uid
      WHERE
        PR.staff_uid = '${uid}'
        AND EXISTS (
          SELECT 1
          FROM "Invoice" inv
          WHERE inv.radiologist_uid = '${uid}'
          AND inv.image_uid = I.uid
          AND inv.paid = true
      )
      GROUP BY U.uid, U.dob, U.first_name, U.last_name, U.email, U.profile_image_url
    `);

  return radiologists.rows;
};

const patientsAsPhysicianQuery = async (pg: Pool, uid: string | undefined) => {
  const radiologists =
    await pg.query(`SELECT U.uid, TO_CHAR(U.dob, 'MM-DD-YYYY') as dob, U.first_name, U.last_name, U.email, U.profile_image_url,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'uid', I.uid,
            'url', I.url,
            'authors', COALESCE(authors_subquery.authors, '[]'::json)
          )
        ) FILTER (WHERE I.uid IS NOT NULL),
        '[]'::json
      ) AS images
      FROM "User" U
      JOIN "PatientRelation" PR ON U.uid = PR.patient_uid
      LEFT JOIN "Image" I ON U.uid = I.uploaded_for
      LEFT JOIN (
        SELECT
          INN.image_uid,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'uid', INN.author_uid,
              'note', INN.note,
              'role', UA.role,
              'full_name', CONCAT(UA.title, ' ', UA.first_name, ' ', UA.last_name)
            )
          ) AS authors
        FROM "ImageNote" INN
        JOIN "User" UA ON INN.author_uid = UA.uid
        WHERE UA.role IN ('PHYSICIAN', 'RADIOLOGIST')
        GROUP BY INN.image_uid
      ) AS authors_subquery ON I.uid = authors_subquery.image_uid
      WHERE PR.staff_uid = '${uid}'
      GROUP BY U.uid, U.dob, U.first_name, U.last_name, U.email, U.profile_image_url`);

  return radiologists.rows;
};
