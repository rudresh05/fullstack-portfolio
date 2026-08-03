import { createPrivateKey } from "node:crypto";
import admin from "firebase-admin";

type ServiceAccountConfig = {
  project_id?: string;
  projectId?: string;
  client_email?: string;
  clientEmail?: string;
  private_key?: string;
  privateKey?: string;
};

function readServiceAccount(): ServiceAccountConfig {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is missing.");
  }

  const json =
    (raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))
      ? raw.slice(1, -1)
      : raw;

  try {
    return JSON.parse(json) as ServiceAccountConfig;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must be valid, single-line service-account JSON.");
  }
}

export function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const config = readServiceAccount();
  const privateKey = (config.private_key ?? config.privateKey)?.replace(/\\n/g, "\n").trim();
  const projectId = config.project_id ?? config.projectId;
  const clientEmail = config.client_email ?? config.clientEmail;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT must include project_id, client_email, and private_key.");
  }

  if (
    !privateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
    !privateKey.endsWith("-----END PRIVATE KEY-----")
  ) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT.private_key is not a complete PEM private key.");
  }

  try {
    createPrivateKey(privateKey);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT.private_key is invalid. Replace the deployed secret with the exact JSON from a newly downloaded Firebase service-account key.",
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });

  return admin;
}
