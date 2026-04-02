export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getFirebaseServiceAccount() {
  try {
    return JSON.parse(getRequiredEnv("FIREBASE_SERVICE_ACCOUNT_KEY"));
  } catch (error) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_KEY must be a valid JSON string. ${
        error instanceof Error ? error.message : "Unknown parsing error."
      }`
    );
  }
}
