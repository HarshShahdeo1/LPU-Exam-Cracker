import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { getFirebaseServiceAccount } from "@/lib/env";

function getFirebaseAdminApp() {
  if (getApps().length) {
    return getApp();
  }

  const serviceAccount = getFirebaseServiceAccount();

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  });
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
