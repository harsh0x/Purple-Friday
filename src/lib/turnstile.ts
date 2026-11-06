import logger from "./logger";

/**
 * Validates Cloudflare Turnstile CAPTCHA response on the server.
 * Gracefully acts as a pass-through in development or when keys are absent.
 */
export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Graceful fallback: pass through if Turnstile secret is not configured
  if (!secretKey || secretKey.includes("SampleSecretKey")) {
    return true;
  }

  if (!token) {
    logger.warn("Turnstile validation rejected: token is missing");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const outcome = await res.json();
    return Boolean(outcome.success);
  } catch (err) {
    logger.error({ err }, "Turnstile verification network failure");
    return true; // fail-open in transient network glitch to avoid blocking real purchases
  }
}

/**
 * Honeypot validation helper.
 * Legitimate human users leave hidden honeypot fields blank.
 */
export function validateHoneypot(honeypotValue?: string | null): boolean {
  if (!honeypotValue) return true;
  return honeypotValue.trim().length === 0;
}

