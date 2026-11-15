import { Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { toFriendlyConflictError } from "../common/db-errors";

@Injectable()
export class StaffAccountsService {
  constructor(private readonly auditService: AuditService) {}

  list() {
    return db
      .select({
        id: schema.staffAccounts.id,
        userId: schema.users.id,
        name: schema.staffAccounts.name,
        email: schema.users.email,
        phone: schema.staffAccounts.phone,
        designation: schema.staffAccounts.designation,
        role: schema.users.role,
        status: schema.users.status,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.staffAccounts.createdAt,
      })
      .from(schema.staffAccounts)
      .innerJoin(schema.users, eq(schema.users.id, schema.staffAccounts.userId))
      .orderBy(schema.staffAccounts.name);
  }

  /** Creates the login (users row) and the person's details. A temporary password is generated unless one is given. */
  async create(dto: { role: string; name: string; email: string; phone?: string; designation?: string; password?: string }, actorId: string) {
    const email = dto.email.trim().toLowerCase();
    const tempPassword = dto.password || randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let userId: string;
    try {
      const [user] = await db.insert(schema.users).values({ email, passwordHash, role: dto.role, mustChangePassword: true }).returning();
      userId = user.id;
    } catch (err) {
      throw toFriendlyConflictError(err, "email");
    }
    try {
      const [account] = await db
        .insert(schema.staffAccounts)
        .values({ userId, name: dto.name.trim(), phone: dto.phone ?? null, designation: dto.designation ?? null })
        .returning();
      await this.auditService.log({ userId: actorId, action: `STAFF_ACCOUNT_CREATE_${dto.role}`, entity: "StaffAccount", entityId: account.id, description: `Created ${dto.role} login for ${email}` });
      return { account: { ...account, email, role: dto.role }, temporaryPassword: dto.password ? undefined : tempPassword };
    } catch (err) {
      // Don't leave a login with no profile behind.
      await db.delete(schema.users).where(eq(schema.users.id, userId));
      throw err;
    }
  }

  private async getOrThrow(id: string) {
    const [row] = await db.select().from(schema.staffAccounts).where(eq(schema.staffAccounts.id, id));
    if (!row) throw new NotFoundException("Staff account not found");
    return row;
  }

  async resetPassword(id: string, actorId: string) {
    const account = await this.getOrThrow(id);
    const tempPassword = randomBytes(9).toString("base64url");
    await db.update(schema.users).set({ passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true }).where(eq(schema.users.id, account.userId));
    await db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.userId, account.userId));
    await this.auditService.log({ userId: actorId, action: "STAFF_ACCOUNT_PASSWORD_RESET", entity: "StaffAccount", entityId: id, description: `Password reset for ${account.name}` });
    return { temporaryPassword: tempPassword };
  }

  /** Deactivating blocks new logins and signs the person out everywhere (refresh tokens revoked). */
  async setStatus(id: string, status: "ACTIVE" | "INACTIVE", actorId: string) {
    const account = await this.getOrThrow(id);
    await db.update(schema.users).set({ status, updatedAt: new Date().toISOString() }).where(eq(schema.users.id, account.userId));
    if (status === "INACTIVE") await db.update(schema.refreshTokens).set({ revoked: true }).where(eq(schema.refreshTokens.userId, account.userId));
    await this.auditService.log({ userId: actorId, action: `STAFF_ACCOUNT_${status}`, entity: "StaffAccount", entityId: id, description: `${account.name} set to ${status}` });
    return { id, status };
  }
}
