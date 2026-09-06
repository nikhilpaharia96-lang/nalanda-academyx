import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { randomBytes, createHmac } from "crypto";
import type { AuthenticatedUser } from "./types/authenticated-user";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_DAYS = 7;

@Injectable()
export class TokenService {
  private get accessSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not configured");
    return secret;
  }

  private get refreshSecret() {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error("JWT_REFRESH_SECRET is not configured");
    return secret;
  }

  signAccessToken(payload: AuthenticatedUser): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: ACCESS_TOKEN_TTL });
  }

  verifyAccessToken(token: string): AuthenticatedUser {
    return jwt.verify(token, this.accessSecret) as AuthenticatedUser;
  }

  /** Refresh tokens are opaque random strings; only their hash is stored server-side. */
  generateRefreshToken(): { token: string; expiresAt: Date } {
    const token = randomBytes(48).toString("base64url");
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
    return { token, expiresAt };
  }

  hashRefreshToken(token: string): string {
    // A dedicated HMAC (not bcrypt) is fine here: refresh tokens already have
    // 384 bits of entropy, so we only need a fast, deterministic digest for
    // lookup — bcrypt's per-hash salt would prevent indexed lookup entirely.
    return createHmac("sha256", this.refreshSecret).update(token).digest("hex");
  }
}
