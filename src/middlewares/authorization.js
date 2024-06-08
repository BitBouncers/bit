import sql from "../config/db.js";

export const isAuthorized = async (req, res, next) => {
  try {
    const user = await sql`SELECT uid, role FROM "User" WHERE uid = ${req.userUID}`;
    // We allow if the owner matches the user making the request
    // or if the user is a physician or radiologist
    const isOwnerOrAuthorized =
      (user.count > 0 && ["PHYSICIAN", "RADIOLOGIST"].includes(user[0].role)) ||
      req.userUID === req.params.userId || // invoices api
      req.userUID === user[0].uid; // match firebase auth uid to our db uid

    if (isOwnerOrAuthorized) {
      next();
    } else {
      res.status(401).send({ error: "You are not authorized to make this request" });
    }
  } catch (error) {
    console.log(error.code, error.message);
    res.status(401).send({ error: "You are not authorized to make this request" });
  }
};

// We allow if the user is a physician or radiologist
export const isStaff = async (req, res, next) => {
  try {
    const user = await sql`SELECT uid, role FROM "User" WHERE uid = ${req.userUID}`;

    if (user.count > 0 && ["PHYSICIAN", "RADIOLOGIST"].includes(user[0].role)) {
      next();
    } else {
      res.status(401).send({ error: "You are not authorized to make this request" });
    }
  } catch (error) {
    console.log(error.code, error.message);
    res.status(401).send({ error: "You are not authorized to make this request" });
  }
};
