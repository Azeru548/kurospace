/**
 * Turn Firebase Auth (and related) errors into user-facing messages.
 * Firebase often returns: "Firebase: Error (auth/operation-not-allowed)."
 * which used to display as just "Error" after naive stripping.
 */
export function formatAuthError(err: unknown): string {
  const code =
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : extractCodeFromMessage(err instanceof Error ? err.message : String(err));

  const map: Record<string, string> = {
    "auth/operation-not-allowed":
      "Email/Password sign-in is not enabled in Firebase. Open Firebase Console → Authentication → Sign-in method → enable Email/Password.",
    "auth/email-already-in-use":
      "That email is already registered. Try logging in instead.",
    "auth/invalid-email": "That email address looks invalid. Check and try again.",
    "auth/weak-password": "Password is too weak. Use at least 6 characters.",
    "auth/invalid-credential":
      "Wrong email or password. If you don't have an account yet, sign up first.",
    "auth/invalid-login-credentials":
      "Wrong email or password. If you don't have an account yet, sign up first.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "No account found with that email. Sign up first.",
    "auth/too-many-requests":
      "Too many attempts. Wait a few minutes and try again.",
    "auth/network-request-failed":
      "Network error. Check your internet connection and try again.",
    "auth/invalid-api-key":
      "Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_* in .env.local.",
    "auth/configuration-not-found":
      "Firebase Auth is not set up for this project. Enable Authentication in the Firebase Console.",
    "permission-denied":
      "Firestore blocked this write. Publish the firestore.rules from this project in Firebase Console → Firestore → Rules.",
    "unavailable":
      "Firestore is unavailable. Create a Firestore database in Firebase Console if you haven't already.",
  };

  if (code && map[code]) return map[code];

  if (err instanceof Error && err.message) {
    // Keep code visible if present
    if (code) return `${err.message.replace(/^Firebase:\s*/i, "")} [${code}]`;
    return err.message.replace(/^Firebase:\s*/i, "");
  }

  return "Something went wrong. Check the browser console for details.";
}

function extractCodeFromMessage(message: string): string | null {
  const m = message.match(/\((auth\/[a-z0-9-]+)\)/i) || message.match(/\(([a-z-]+)\)/i);
  return m ? m[1]! : null;
}
