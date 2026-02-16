/**
 * Google reCAPTCHA Enterprise verification
 * Verifies reCAPTCHA tokens server-side to prevent spam and bot submissions
 */

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

/**
 * Verify a reCAPTCHA token with Google's API
 * @param token - The reCAPTCHA token from the client
 * @param expectedAction - Optional expected action name (e.g., "submit_contact_form")
 * @returns Promise<boolean> - True if verification succeeds
 */
export async function verifyRecaptcha(
  token: string,
  expectedAction?: string
): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error("[reCAPTCHA] RECAPTCHA_SECRET_KEY not configured");
    // In development, allow requests without verification
    if (process.env.NODE_ENV === "development") {
      console.warn("[reCAPTCHA] Skipping verification in development mode");
      return true;
    }
    throw new Error("reCAPTCHA configuration error");
  }

  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      }
    );

    const data: RecaptchaVerifyResponse = await response.json();

    if (!data.success) {
      console.error("[reCAPTCHA] Verification failed:", data["error-codes"]);
      return false;
    }

    // Optional: Verify the action matches
    if (expectedAction && data.action !== expectedAction) {
      console.error(
        `[reCAPTCHA] Action mismatch: expected "${expectedAction}", got "${data.action}"`
      );
      return false;
    }

    // Optional: Check score for Enterprise reCAPTCHA (v3)
    // Score ranges from 0.0 (likely bot) to 1.0 (likely human)
    if (data.score !== undefined && data.score < 0.5) {
      console.warn(`[reCAPTCHA] Low score: ${data.score}`);
      return false;
    }

    console.log(
      `[reCAPTCHA] Verification successful. Score: ${data.score || "N/A"}`
    );
    return true;
  } catch (error) {
    console.error("[reCAPTCHA] Verification error:", error);
    return false;
  }
}
