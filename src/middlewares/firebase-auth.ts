/* import { adminAuth } from "../config/firebase.js";

function getAuthToken(req, _res, next) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    req.authToken = req.headers.authorization.split(" ")[1];
  }
  next();
}

export function isAuthenticated(req, res, next) {
  getAuthToken(req, res, async () => {
    try {
      const userInfo = await adminAuth.verifyIdToken(req.authToken);
      if (userInfo.uid) {
        req.userUID = userInfo.uid;
        next();
      }
    } catch (error) {
      console.log(error.code, error.message);
      res
        .status(401)
        .send({ error: "You are not authorized to make this request." });
    }
  });
} */
