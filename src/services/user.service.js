import crypto from "crypto";
import sql from "../config/db.js";
import { adminAuth, auth, signInWithEmailAndPassword } from "../config/firebase.js";
import { notify } from "./notification.service.js";

export async function assignRadiologist(req, res) {
  await sql`INSERT INTO PatientRelation(patient_uid, staff_uid)
    VALUES(${req.userUID}, ${req.params.uid})`
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
}

export async function rateRadiologist(req, res) {
  const { uid, rating, comment } = req.body;
  const now = new Date();

  try {
    const rating_uid = crypto.randomUUID();
    await sql`INSERT INTO "Rating" (uid, comment, rating, rated_uid, user_uid, "createdAt", "editedAt")
      VALUES(${rating_uid}, ${comment || ""}, ${rating}, ${uid}, ${req.userUID}, ${now}, ${now})`.then((result) => {
      if (result.count > 0) {
        res.json({ success: true, msg: "Rating submitted successfully." });
        notify(uid, req.userUID, "A patient has rated your service.");
      } else {
        res.json({ success: false });
      }
    });
  } catch (error) {
    if (error.detail.includes("already exists")) {
      await sql`SELECT rating FROM "Rating" WHERE rated_uid = ${uid} AND user_uid = ${req.userUID}`.then(
        async (result) => {
          if (result[0].rating === rating) {
            return res.json({
              success: true,
              msg: "Same rating already exists.",
            });
          }

          await sql`UPDATE "Rating" SET comment = ${comment || ""}, rating = ${rating} WHERE rated_uid = ${uid} AND user_uid = ${req.userUID}`
            .then((result) => {
              if (result.count > 0) {
                res.json({
                  success: true,
                  msg: "Rating updated successfully.",
                });
                notify(uid, req.userUID, "A patient has updated their rating.");
              }
            })
            .catch((error) => {
              console.log("user.service.rateRadiologist: ", error);
              res.json({ success: false });
            });
        }
      );
    }
  }
}

export async function removeRadiologist(req, res) {
  await sql`DELETE FROM PatientRelation WHERE patient_uid = ${req.userUID} AND staff_uid = ${req.params.uid}`
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
}

export async function images(req, res) {
  const result = await sql`
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
      WHERE U.role = 'PATIENT' AND U.uid = ${req.params.uid}
      GROUP BY I.uid, I.url, I."createdAt", U.first_name, U.last_name, UA_uploaded.title, UA_uploaded.first_name, UA_uploaded.last_name`.catch(
    (error) => {
      console.log("user.service.images: ", error);
    }
  );

  res.json({ images: result });
}

export async function me(req, res) {
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
}

export async function patients(req, res) {
  const result = await sql`SELECT role FROM "User" WHERE uid = ${req.userUID}`
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

  res.json({ patients: result });
}

export async function profile(req, res) {
  const results = await sql
    .begin(async (sql) => {
      const user = await sql`
        SELECT
          title, first_name, last_name, TO_CHAR(dob, 'MM-DD-YYYY') AS dob, email, profile_image_url, allow_ratings, SC.bio, SC.expertise, SC.years_of_exp
        FROM "User" U
        LEFT JOIN "StaffCredentials" SC ON U.uid = SC.uid
        WHERE U.uid = ${req.userUID}
      `;

      const staff = await sql`
      SELECT
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
          PR.patient_uid = ${req.userUID}
      `;

      return [user, staff];
    })
    .catch((error) => {
      console.log("user.service.profile: ", error);
      res.status(204).json({});
    });

  res.json({ profile: results[0][0], staff: results[1] });
}

export async function meetOurRadiologists(_req, res) {
  const result = await sql`
      SELECT U.uid, U.title, U.first_name, U.last_name, U.profile_image_url,
        SC.expertise
      FROM "User" U
      LEFT JOIN "StaffCredentials" SC ON U.uid = SC.uid
      WHERE U.role = 'RADIOLOGIST'
      ORDER BY RANDOM()
      LIMIT 6;
`.catch((error) => {
    console.log("user.service.meetOurRadiologists: ", error);
    res.json({ radiologists: [] });
  });

  res.json({ radiologists: result });
}

export async function radiologists(_req, res) {
  const result = await sql`
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
        SC.bio, SC.expertise, SC.years_of_exp
    `.catch((error) => {
    console.log("user.service.radiologists: ", error);
    res.json({ radiologists: [] });
  });

  res.json({ radiologists: result });
}

export async function uploadImage(req, res) {
  try {
    const uuid = crypto.randomUUID();
    const results = await sql.begin(async (sql) => {
      const image = await sql`
        INSERT INTO "Image" (uid, uploaded_by, uploaded_for, url)
        VALUES(${uuid}, ${req.userUID}, ${req.body.patient}, ${req.body.url})
        ON CONFLICT (uid) DO NOTHING
      `;
      const imageNote = await sql`
        INSERT INTO "ImageNote" (image_uid, author_uid, note, recommend_uid)
        VALUES(${uuid}, ${req.userUID}, ${req.body.notes ?? ""}, ${req.body.recommendation})
      `;
      return [image.count, imageNote.count];
    });
    if (results.length === 2 && results[0] > 0 && results[1] > 0) {
      notify(req.body.patient, req.userUID, "You have a new image from your physician.", "/imagelibrary");

      if (!req.body.notes) {
        notify(req.userUID, req.body.patient, "Don't forget to add your notes to your patient's image.", "/patients");
      }
    }
  } catch (error) {
    console.log("user.service.uploadImage: ", error);
    res.status(422).json({ success: false });
  }

  res.json({ success: true });
}

export async function updateNewEmail(req, res) {
  const { email, password } = req.body;

  const currentUser = await adminAuth.getUser(req.userUID);

  try {
    // Reauthenticate the user before updating the email
    await signInWithEmailAndPassword(auth, currentUser.email, password);

    await adminAuth.updateUser(req.userUID, { email });

    // Update the email in the database
    await sql`UPDATE User SET email = ${email} WHERE uid = ${req.userUIDi}`.catch((error) => console.log(error));

    res.json({ success: true, msg: "Email updated successfully." });
  } catch (error) {
    console.log("user.service.updateNewEmail:", error);
    if (error.code === "auth/invalid-login-credentials") {
      return res.status(422).json({ success: false, errors: [{ msg: "Incorrect password" }] });
    } else if (error.code === "auth/too-many-requests") {
      return res.status(422).json({
        success: false,
        errors: [{ msg: "Too many requests. Try again later." }],
      });
    } else {
      res.status(422).json({ success: false });
    }
  }
}

export async function updateProfile(req, res) {
  const enabled = req.body.enableRatingSystem ?? true;
  const newBio = req.body.bio ?? "";
  let profile_image_url,
    bio = null;

  try {
    await sql.begin(async (sql) => {
      const user = await sql`
        SELECT role
        FROM "User"
        WHERE uid = ${req.userUID}`;
      profile_image_url = await sql`
        UPDATE "User"
        SET profile_image_url = ${req.body.profile_image_url}, allow_ratings = ${enabled}
        WHERE uid = ${req.userUID}
      `;
      if (user.count > 0 && user[0].role !== "PATIENT") {
        bio = await sql`
          INSERT INTO "StaffCredentials" (bio, uid)
          VALUES(${newBio}, ${req.userUID})
          ON CONFLICT (uid) DO UPDATE SET bio = EXCLUDED.bio
        `;
      }
      return [profile_image_url, bio];
    });

    res.json({ success: true, data: { ...req.body } });
  } catch (error) {
    console.log("user.service.uploadImage: ", error);
    res.status(422).json({ success: false });
  }
}

const patientsAsRadiologistQuery = async (uid) => {
  const radiologists = await sql`SELECT U.uid, TO_CHAR(U.dob, 'MM-DD-YYYY') AS dob, U.first_name, U.last_name, U.email, U.profile_image_url,
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
        PR.staff_uid = ${uid}
        AND EXISTS (
          SELECT 1
          FROM "Invoice" inv
          WHERE inv.radiologist_uid = ${uid}
          AND inv.image_uid = I.uid
          AND inv.paid = true
      )
      GROUP BY U.uid, U.dob, U.first_name, U.last_name, U.email, U.profile_image_url`;

  return radiologists;
};

const patientsAsPhysicianQuery = async (uid) => {
  const radiologists = await sql`SELECT U.uid, TO_CHAR(U.dob, 'MM-DD-YYYY') as dob, U.first_name, U.last_name, U.email, U.profile_image_url, \
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
      WHERE PR.staff_uid = ${uid}
      GROUP BY U.uid, U.dob, U.first_name, U.last_name, U.email, U.profile_image_url`;

  return radiologists;
};
