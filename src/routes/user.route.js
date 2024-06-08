import express from "express";
import { userController } from "../controllers/index.js";
import { isAuthorized, isStaff } from "../middlewares/authorization.js";
import errors from "../middlewares/errors.js";
import { isAuthenticated } from "../middlewares/firebase-auth.js";
import {
  rateRadiologistSchema,
  uploadImageSchema,
  updateEmailSchema,
  updateProfileSchema,
} from "../middlewares/validators.js";

const router = express.Router();

router.get(
  "/:uid/images",
  [isAuthenticated, isAuthorized],
  userController.images
);
router.post(
  "/:uid/assign/radiologist",
  [isAuthenticated, isAuthorized],
  userController.assignRadiologist
);
router.delete(
  "/:uid/remove/radiologist",
  [isAuthenticated, isAuthorized],
  userController.removeRadiologist
);
router.get("/me", [isAuthenticated], userController.me);
router.get("/meet-our-radiologists", [], userController.meetOurRadiologists);
router.get("/patients", [isAuthenticated, isStaff], userController.patients);
router.get("/profile", [isAuthenticated], userController.profile);
router.get("/radiologists", [], userController.radiologists);

router.put(
  "/email",
  [isAuthenticated, updateEmailSchema, errors],
  userController.updateNewEmail
);
router.put(
  "/profile",
  [isAuthenticated, updateProfileSchema, errors],
  userController.updateProfile
);

router.post(
  "/rate",
  [isAuthenticated, rateRadiologistSchema, errors],
  userController.rateRadiologist
);
router.post(
  "/upload-image",
  [isAuthenticated, isStaff, uploadImageSchema, errors],
  userController.uploadImage
);

export default router;
