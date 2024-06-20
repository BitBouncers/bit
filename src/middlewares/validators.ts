/* import { checkSchema } from "express-validator";
import dbConn from "../config/db.js";
import { adminAuth } from "../config/firebase.js";

async function checkEmailExists(email) {
  await adminAuth
    .getUserByEmail(email)
    .then((user) => {
      if (user) return Promise.reject();
      return Promise.resolve();
    })
    .catch((error) => {
      if (error.code === "auth/user-not-found") return Promise.resolve();
      return Promise.reject();
    });
}

async function checkImageExists(uid) {
  await sql`SELECT CASE WHEN EXISTS (SELECT 1 FROM "Image" WHERE uid = ${uid}) THEN 1 ELSE 0 END AS image_exists`
    .then((result) => {
      if (result[0].image_exists === 1) {
        return Promise.resolve();
      } else {
        return Promise.reject();
      }
    })
    .catch((error) => {
      console.log("checkImageExists: ", error.code, error.message);
      return Promise.reject();
    });
}

async function checkPatientExists(uid, { req }) {
  await sql`SELECT email, first_name, last_name FROM "User" WHERE uid = ${uid}`
    .then((result) => {
      if (result.count > 0) {
        req.patientEmail = result[0].email;
        req.patientName = result[0].first_name + " " + result[0].last_name;
        return Promise.resolve(req);
      }
      return Promise.reject();
    })
    .catch((error) => {
      console.log(error.code, error.message);
      return Promise.reject();
    });
}


async function checkRadiologistExists(uid, { req }) {
  await sql`SELECT uid FROM "User" WHERE uid = ${uid}`
    .then((result) => {
      if (result.count > 0) {
        return Promise.resolve(req);
      }
      return Promise.reject();
    })
    .catch((error) => {
      console.log(error.code, error.message);
      return Promise.reject();
    });
}

async function checkRatingsEnabled(uid) {
  const result = await sql`SELECT
      uid,
      CASE
        WHEN allow_ratings = true THEN 1
        ELSE 0
      END AS allow_ratings
    FROM "User" WHERE uid = ${uid}`;
  if (result.count === 0) return Promise.reject();
  if (result[0].allow_ratings === 1) {
    return Promise.resolve();
  } else {
    return Promise.reject();
  }
}

async function checkRoleIsRadiologist(uid, { req }) {
  await sql`SELECT uid FROM "User" WHERE uid = ${uid} AND role = 'RADIOLOGIST'`
    .then((result) => {
      if (result.count > 0) {
        return Promise.resolve(req);
      }
      return Promise.reject();
    })
    .catch((error) => {
      console.log(error.code, error.message);
      return Promise.reject();
    });
}

async function checkInvoiceExists(uid, { req }) {
  await sql
    .execute("SELECT uid, patient_uid, amount FROM Invoice WHERE uid = ? AND patient_uid = ?", [uid, req.userUID])
    .then((result) => {
      if (result.count > 0) {
        req.amount = result[0].amount;
        return Promise.resolve(req);
      }
      return Promise.reject();
    })
    .catch((error) => {
      console.log(error.code, error.message);
      return Promise.reject();
    });
}

async function checkInvoicePaid(uid) {
  await sql
    .execute("SELECT paid FROM Invoice WHERE uid = ?", [uid])
    .then((result) => {
      if (result.count > 0) {
        if (result[0].paid) return Promise.reject(); // paid
        return Promise.resolve(); // not paid
      }
      return Promise.reject();
    })
    .catch((error) => {
      console.log(error.code, error.message);
      return Promise.reject();
    });
}

// disable due to add patient feature implemented differently
// export const addPatientSchema = checkSchema(
//   {
//     email: {
//       emailExists: {
//         bail: true,
//         custom: checkEmailExists,
//         errorMessage: "Email already exists",
//       },
//       isEmail: {
//         trim: true,
//         errorMessage: "Invalid email",
//       },
//     },
//     dob: { isISO8601: { errorMessage: "Invalid date of birth" } },
//     first_name: { notEmpty: { errorMessage: "First name is required" } },
//     last_name: { notEmpty: { errorMessage: "Last name is required" } },
//     title: { optional: true },
//   },
//   ["body"]
// );

export const loginSchema = checkSchema(
  {
    email: { isEmail: { trim: true, errorMessage: "Invalid email" } },
    password: { notEmpty: { errorMessage: "Password is required" } },
  },
  ["body"]
);

export const invoiceSchema = checkSchema({
  uid: {
    in: ["params"],
    notEmpty: {
      bail: true,
      errorMessage: "Radiologist's uid is required",
    },
    checkUid: {
      bail: true,
      custom: (uid) => {
        if (uid === "Select a radiologist") return Promise.reject();
        else return Promise.resolve();
      },
      errorMessage: "Please select a radiologist",
    },
    isLength: {
      bail: true,
      options: { min: 28, max: 28 },
      errorMessage: "Invalid radiologist's uid",
    },
  },
  image: {
    in: ["body"],
    notEmpty: {
      bail: true,
      errorMessage: "Image uid is required",
    },
    checkUid: {
      bail: true,
      custom: checkImageExists,
      errorMessage: "Image does not exist",
    },
  },
});

export const invoicesSchema = checkSchema(
  {
    userId: {
      notEmpty: {
        bail: true,
        errorMessage: "User's uid is required",
      },
      isString: {
        bail: true,
        options: { min: 28, max: 28 },
        errorMessage: "Invalid user's uid",
      },
    },
  },
  ["params"]
);

export const paySchema = checkSchema(
  {
    invoice: {
      notEmpty: {
        bail: true,
        errorMessage: "Invoice uid is required",
      },
      existsAndBelongsToUser: {
        bail: true,
        custom: checkInvoiceExists,
        errorMessage: "Invoice does not exist",
      },
      isPaid: {
        bail: true,
        custom: checkInvoicePaid,
        errorMessage: "Invoice has already been paid",
      },
    },
  },
  ["body"]
);

export const rateRadiologistSchema = checkSchema(
  {
    uid: {
      notEmpty: {
        bail: true,
        errorMessage: "Radiologist's uid is required",
      },
      radiologistExists: {
        bail: true,
        custom: checkRadiologistExists,
        errorMessage: "Radiologist does not exist",
      },
      isRadiologist: {
        bail: true,
        custom: checkRoleIsRadiologist,
        errorMessage: "User is not a radiologist",
      },
      ratingsEnabled: {
        bail: true,
        custom: checkRatingsEnabled,
        errorMessage: "Radiologist currently has ratings disabled",
      },
    },
    rating: {
      isInt: {
        bail: true,
        options: { min: 1, max: 5 },
        errorMessage: "Invalid rating",
      },
    },
  },
  ["body"]
);

export const uploadImageSchema = checkSchema({
  patient: {
    notEmpty: {
      bail: true,
      errorMessage: "Patient's uid is required",
    },
    patientExists: {
      bail: true,
      custom: checkPatientExists,
      errorMessage: "Patient does not exist",
    },
  },
  recommendation: {
    optional: {
      options: {
        values: "null",
      },
    },
    radiologistExists: {
      bail: true,
      custom: checkRadiologistExists,
      errorMessage: "Radiologist does not exist",
    },
    isRadiologist: {
      bail: true,
      custom: checkRoleIsRadiologist,
      errorMessage: "User is not a radiologist",
    },
  },
  url: {
    notEmpty: {
      bail: true,
      errorMessage: "Image url is required",
    },
    isURL: {
      bail: true,
      options: {
        host_whitelist: ["firebasestorage.googleapis.com"],
      },
      errorMessage: "Invalid image url",
    },
  },
});

export const updateEmailSchema = checkSchema(
  {
    email: {
      emailExists: {
        bail: true,
        custom: checkEmailExists,
        errorMessage: "This email is already in use",
      },
      isEmail: {
        trim: true,
        errorMessage: "Invalid email",
      },
    },
  },
  ["body"]
);

export const updateProfileSchema = checkSchema({
  profile_image_url: {
    isString: {
      bail: true,
      options: { min: 0 },
      errorMessage: "Invalid profile image url",
    },
    optional: {
      options: {
        values: "falsy",
      },
    },
  },
}); */

export const portalSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
        },
      },
      required: ["email"],
    },
  },
  additionalProperties: false,
};

export const readNotificationSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        read: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["read"],
    },
  },
  additionalProperties: false,
};

export const readNotificationSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        read: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["read"],
    },
  },
  additionalProperties: false,
};

export const readNotificationSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        read: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["read"],
    },
  },
  additionalProperties: false,
};

export const sendPasswordResetSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        email: {
          type: "string",
          format: "email",
        },
      },
      required: ["email"],
    },
  },
  additionalProperties: false,
};

export const signupSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: {
          type: "string",
          minLength: 8,
        },
        dob: {
          type: "string",
          pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        },
        first_name: {
          type: "string",
          minLength: 1,
        },
        last_name: {
          type: "string",
          minLength: 1,
        },
        role: {
          type: "string",
          transform: ["trim", "toLowerCase"],
          default: "patient",
          enum: ["patient", "radiologist", "physician"],
        },
        hospital: { type: "string" },
        title: { type: "string" },
      },
    },
    required: ["email", "password", "dob", "first_name", "last_name", "role"],
  },
  additionalProperties: false,
};

export const updateImageNoteSchema = {
  schema: {
    body: {
      type: "object",
      properties: {
        note: { type: "string" },
      },
    },
    params: {
      type: "object",
      properties: {
        image_uid: {
          type: "string",
          format: "uuid",
        },
      },
    },
    required: ["image_uid", "note"],
  },
  additionalProperties: false,
};
