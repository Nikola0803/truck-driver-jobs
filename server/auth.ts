import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "tdj-local-secret-change-in-production";
const EXPIRES_IN = "30d";

export interface TokenPayload {
  sub: string;   // user id
  email: string;
  is_admin: boolean;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
