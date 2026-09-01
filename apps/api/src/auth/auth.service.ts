import { Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { TokenService } from "../common/token.service";
import { AuditService } from "../common/audit.service";
import type { LoginDto } from "@nalanda/shared";

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  /** Resolves the role-specific profile id (student/teacher/parent) for a user. */
  private async resolveProfileId(userId: string, role: string): Promise<string | undefined> {
    if (role === "STUDENT") {
      const [row] = await db.select({ id: schema.students.id }).from(schema.students).where(eq(schema.students.userId, userId));
      return row?.id;
    }
    if (role === "TEACHER") {
      const [row] = await db.select({ id: schema.teachers.id }).from(schema.teachers).where(eq(schema.teachers.userId, userId));
      return row?.id;
    }
    if (role === "PARENT") {
      const [row] = await db.select({ id: schema.parents.id }).from(schema.parents).where(eq(schema.parents.userId, userId));
      return row?.id;
    }
    return undefined;
  }

  async login(dto: LoginDto, meta: { ipAddress?: string; userAgent?: string }) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, dto.email));
    // Constant-shape response regardless of which check fails, to avoid
    // leaking whether an email exists.
    const passwordOk = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      await this.auditService.log({
        action: "LOGIN_FAILED",
        entity: "User",
        description: `Failed login attempt for ${dto.email}`,
        ...meta,
      });
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active. Contact the school administration.");
    }

    const profileId = await this.resolveProfileId(user.id, user.role);
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      profileId,
    });

    const { token: refreshToken, expiresAt } = this.tokenService.generateRefreshToken();
    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: this.tokenService.hashRefreshToken(refreshToken),
      expiresAt: expiresAt.toISOString(),
    });

    await db.update(schema.users).set({ lastLoginAt: new Date().toISOString() }).where(eq(schema.users.id, user.id));
    await this.auditService.log({ userId: user.id, action: "LOGIN", entity: "User", entityId: user.id, ...meta });

    return {
      accessToken,
      refreshToken,
      // mustChangePassword is informational only today — no route currently
      // enforces it server-side (see the migration's column comment in
      // schema.ts). A portal frontend can use it to prompt for a change.
      user: { id: user.id, email: user.email, role: user.role, profileId, mustChangePassword: user.mustChangePassword },
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const [row] = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.tokenHash, tokenHash));

    if (!row || row.revoked || new Date(row.expiresAt) < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired");
    }

    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, row.userId));
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    // Rotate: revoke the old refresh token, issue a new one.
    await db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.id, row.id));
    const { token: newRefreshToken, expiresAt } = this.tokenService.generateRefreshToken();
    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: this.tokenService.hashRefreshToken(newRefreshToken),
      expiresAt: expiresAt.toISOString(),
    });

    const profileId = await this.resolveProfileId(user.id, user.role);
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as any,
      profileId,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    await db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.tokenHash, tokenHash));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!user) throw new UnauthorizedException();

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, userId));
    await this.auditService.log({ userId, action: "PASSWORD_CHANGE", entity: "User", entityId: userId });
  }
}
