import {
  cert,
  getApps,
  initializeApp as initializeAdminApp,
} from "firebase-admin/app";
import { Auth, getAuth as getAdminAuth } from "firebase-admin/auth";
import {
  FirebaseError,
  initializeApp as initializeAppNormal,
} from "firebase/app";
import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  FIREBASE_ADMIN_CREDENTIALS,
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from "../utils/environment";

let firebaseAdmin, adminAuth: Auth;

// Firebase Admin SDK
if (!FIREBASE_ADMIN_CREDENTIALS) {
  console.error(
    "FIREBASE_ADMIN_CREDENTIALS is not defined in the environment variables"
  );
  process.exit(1);
}

const credential = JSON.parse(FIREBASE_ADMIN_CREDENTIALS);

if (!getApps().length) {
  firebaseAdmin = initializeAdminApp(
    {
      credential: cert(credential),
    },
    "radiologyarchive-firebase-admin"
  );
  adminAuth = getAdminAuth(firebaseAdmin);
}

// Firebase SDK
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
};

const firebase = initializeAppNormal(
  firebaseConfig,
  "radiologyarchive-firebase"
);

const auth = getAuth(firebase);

const login = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      const user = userCredential.user;
      const returnUser: bit.AuthLoginResponse = {
        localId: user.uid,
        displayName: user.displayName,
        idToken: await user.getIdToken(false),
        refreshToken: user.refreshToken,
      };
      return returnUser;
    })
    .catch((error: FirebaseError) => {
      return error;
    });
};

export { adminAuth, auth, login, sendPasswordResetEmail, updateProfile };
