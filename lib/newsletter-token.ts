import jwt from "jsonwebtoken";

/**
 * Newsletter links carry a signed JWT holding the subscriber's email. The purpose
 * claim stops a token issued for one action (e.g. unsubscribing) being replayed
 * for another.
 */
type TokenPurpose = "subscribe" | "unsubscribe";

type TokenPayload = { email?: string; purpose?: string };

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return secret;
}

export function signNewsletterToken(email: string, purpose: TokenPurpose, expiresIn?: jwt.SignOptions["expiresIn"]) {
  return jwt.sign({ email, purpose }, getSecret(), expiresIn ? { expiresIn } : undefined);
}

/** Returns the email in a valid token for this purpose, or null if the token is invalid or expired. */
export function readNewsletterToken(token: string, purpose: TokenPurpose): string | null {
  const secret = getSecret();

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    return payload.email && payload.purpose === purpose ? payload.email : null;
  } catch {
    return null;
  }
}
