import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const anonymousAnalysisLimit = 1;
export const anonymousAnalysisCookieName = "kevixo_anonymous_analysis_v1";

const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const opaqueIdPattern = /^[A-Za-z0-9_-]{43}$/;

export function createAnonymousAnalysisIdentity({
  cookieHeader,
  visitorId,
  secret,
}: {
  cookieHeader: string | null;
  visitorId?: string;
  secret: string | undefined;
}) {
  const signingSecret = readSigningSecret(secret);
  const existingOpaqueId = readValidCookieOpaqueId(cookieHeader, signingSecret);
  const opaqueId = existingOpaqueId ?? createOpaqueId(visitorId, signingSecret);

  return {
    subjectHash: createHash("sha256")
      .update(`kevixo-anonymous-analysis:${opaqueId}`, "utf8")
      .digest("hex"),
    setCookie: existingOpaqueId ? undefined : serializeCookie(opaqueId, signingSecret),
  };
}

function createOpaqueId(visitorId: string | undefined, secret: string) {
  const normalizedVisitorId = visitorId?.trim();
  if (normalizedVisitorId && visitorIdPattern.test(normalizedVisitorId)) {
    return createHmac("sha256", secret)
      .update(`visitor:${normalizedVisitorId.toLowerCase()}`, "utf8")
      .digest("base64url");
  }
  return randomBytes(32).toString("base64url");
}

function readValidCookieOpaqueId(cookieHeader: string | null, secret: string) {
  const value = readCookie(cookieHeader, anonymousAnalysisCookieName);
  if (!value) return undefined;
  const [opaqueId, signature, extra] = value.split(".");
  if (extra || !opaqueIdPattern.test(opaqueId ?? "") || !opaqueIdPattern.test(signature ?? "")) {
    return undefined;
  }

  const expected = signOpaqueId(opaqueId, secret);
  const actualBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return undefined;
  }
  return opaqueId;
}

function readCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}

function serializeCookie(opaqueId: string, secret: string) {
  const value = `${opaqueId}.${signOpaqueId(opaqueId, secret)}`;
  return `${anonymousAnalysisCookieName}=${value}; Path=/; Max-Age=${cookieMaxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

function signOpaqueId(opaqueId: string, secret: string) {
  return createHmac("sha256", secret).update(`cookie:${opaqueId}`, "utf8").digest("base64url");
}

function readSigningSecret(value: string | undefined) {
  const secret = value?.trim();
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("ANALYSIS_ANONYMOUS_COOKIE_SECRET must contain at least 32 bytes.");
  }
  return secret;
}
