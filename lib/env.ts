export function getFirebaseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error(
      "Missing env variable: FIREBASE_SERVICE_ACCOUNT_KEY"
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      "Invalid FIREBASE_SERVICE_ACCOUNT_KEY: must be a valid JSON string"
    );
  }
}
