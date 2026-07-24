import { SignJWT, jwtVerify } from "jose";
import { createHash, randomUUID } from "crypto";

const COOKIE = "mc_visitor";
const VISITOR_TOKEN_COOKIE = "mc_visitor_token";

function secretKey() {
  const raw = process.env.AUTH_SECRET || "dev-only-auth-secret";
  return new TextEncoder().encode(raw);
}

export function readVisitorIdFromCookie(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  return match?.[1] || null;
}

export function readVisitorTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${VISITOR_TOKEN_COOKIE}=([^;]+)`));
  return match?.[1] || null;
}

export function mintVisitorId(): string {
  return createHash("sha256").update(randomUUID()).digest("hex").slice(0, 24);
}

export async function issueVisitorToken(visitorId: string): Promise<string> {
  return new SignJWT({ sub: visitorId, typ: "visitor" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifyVisitorToken(
  token: string
): Promise<{ visitorId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== "visitor" || typeof payload.sub !== "string") return null;
    return { visitorId: payload.sub };
  } catch {
    return null;
  }
}

/** Resolve visitor identity from cookie, Bearer visitorToken, or mint new. */
export async function resolveVisitor(request: Request): Promise<{
  visitorId: string;
  isNew: boolean;
  setCookies: string[];
  visitorToken: string;
}> {
  const setCookies: string[] = [];

  const bearer = readVisitorTokenFromRequest(request);
  if (bearer) {
    const verified = await verifyVisitorToken(bearer);
    if (verified) {
      return {
        visitorId: verified.visitorId,
        isNew: false,
        setCookies: [],
        visitorToken: bearer,
      };
    }
  }

  let visitorId = readVisitorIdFromCookie(request);
  const isNew = !visitorId;
  if (!visitorId) {
    visitorId = mintVisitorId();
    setCookies.push(
      `${COOKIE}=${visitorId}; Path=/; Max-Age=31536000; SameSite=Lax`
    );
  }

  const visitorToken = await issueVisitorToken(visitorId);
  setCookies.push(
    `${VISITOR_TOKEN_COOKIE}=${visitorToken}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly`
  );

  return { visitorId, isNew, setCookies, visitorToken };
}

export { COOKIE as VISITOR_COOKIE, VISITOR_TOKEN_COOKIE };
