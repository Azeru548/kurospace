import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

type ServiceAccountShape = {
  project_id: string;
  client_email: string;
  private_key: string;
};

/**
 * Firebase Admin for server routes (webhooks, paid-order updates).
 *
 * Preferred (local):
 *   FIREBASE_SERVICE_ACCOUNT_PATH=./kuro-9b9d6-firebase-adminsdk-....json
 *
 * Or:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 *   FIREBASE_ADMIN_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY
 */
function loadServiceAccount(): ServiceAccountShape | null {
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      console.error("[firebase-admin] Service account file not found:", resolved);
      return null;
    }
    const sa = JSON.parse(fs.readFileSync(resolved, "utf8")) as ServiceAccountShape;
    return {
      project_id: sa.project_id,
      client_email: sa.client_email,
      private_key: sa.private_key.replace(/\\n/g, "\n"),
    };
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const sa = JSON.parse(json) as ServiceAccountShape;
    return {
      project_id: sa.project_id,
      client_email: sa.client_email,
      private_key: sa.private_key.replace(/\\n/g, "\n"),
    };
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const sa = loadServiceAccount();
  if (sa) {
    return initializeApp({
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key,
      }),
    });
  }

  // Fallback (will fail for privileged writes without credentials)
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || undefined,
  });
}

export function getAdminDb(): Firestore {
  getAdminApp();
  return getFirestore();
}

export function isAdminConfigured(): boolean {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const resolved = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    return fs.existsSync(resolved);
  }
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY)
  );
}
