import { FirebaseApp, initializeApp, getApps, getApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** True once every value Firebase Web Push needs is actually set. Every
 *  push-related call in this app checks this first and no-ops (rather than
 *  throwing) when it's false — the rest of the dashboard works fine with no
 *  Firebase project configured at all. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseVapidKey,
);

let app: FirebaseApp | null = null;

/** Lazily initializes (once) and returns the Firebase app — never called
 *  outside the browser or without a complete config; callers must check
 *  `isFirebaseConfigured` first. */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}
