import { ConflictException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { db, schema } from "@nalanda/database";
import { eq } from "drizzle-orm";
import { StaffAccountsService } from "./staff-accounts.service";
import { AuthService } from "../auth/auth.service";
import { TokenService } from "../common/token.service";
import { AuditService } from "../common/audit.service";
import { admin } from "../campus.fixtures";

describe("StaffAccountsService (accountant logins)", () => {
  const audit = new AuditService();
  const service = new StaffAccountsService(audit);
  const auth = new AuthService(new TokenService(), audit);
  const uid = () => Math.random().toString(36).slice(2, 9);
  beforeAll(() => { process.env.JWT_SECRET ||= "test-access-secret"; process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret"; });

  it("creates an ACCOUNTANT login with a temporary password the person can sign in with", async () => {
    const email = `Acc-${uid()}@School.In`;
    const res = await service.create({ role: "ACCOUNTANT", name: "Ramesh Gupta", email, phone: "9876543210", designation: "Accounts Officer" }, admin.sub);

    expect(res.temporaryPassword).toBeTruthy();
    expect(res.account).toMatchObject({ name: "Ramesh Gupta", role: "ACCOUNTANT", email: email.toLowerCase() });
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase()));
    expect(user).toMatchObject({ role: "ACCOUNTANT", status: "ACTIVE", mustChangePassword: true });
    expect(user.passwordHash).not.toContain(res.temporaryPassword!); // stored hashed
    expect(await bcrypt.compare(res.temporaryPassword!, user.passwordHash)).toBe(true);

    const login = await auth.login({ email: email.toLowerCase(), password: res.temporaryPassword! }, {});
    expect(login.user).toMatchObject({ role: "ACCOUNTANT", profileId: res.account.id, mustChangePassword: true });
  });

  it("uses a given password instead of generating one, and rejects a duplicate email", async () => {
    const email = `acc-${uid()}@school.in`;
    const res = await service.create({ role: "ACCOUNTANT", name: "Sunita Rao", email, password: "ChosenPass123" }, admin.sub);
    expect(res.temporaryPassword).toBeUndefined();
    await expect(auth.login({ email, password: "ChosenPass123" }, {})).resolves.toBeDefined();

    await expect(service.create({ role: "ACCOUNTANT", name: "Someone Else", email: email.toUpperCase() }, admin.sub)).rejects.toBeInstanceOf(ConflictException);
    // the failed attempt must not leave a half-created user behind
    expect((await db.select().from(schema.users).where(eq(schema.users.email, email)))).toHaveLength(1);
  });

  it("lists accounts without exposing password hashes", async () => {
    const email = `acc-${uid()}@school.in`;
    await service.create({ role: "ACCOUNTANT", name: "Listed Person", email }, admin.sub);
    const rows = await service.list();
    const row = rows.find((r) => r.email === email)!;
    expect(row).toMatchObject({ name: "Listed Person", role: "ACCOUNTANT", status: "ACTIVE" });
    expect(JSON.stringify(rows)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it("deactivating blocks login and signs the person out everywhere; reactivating restores it", async () => {
    const email = `acc-${uid()}@school.in`;
    const { account, temporaryPassword } = await service.create({ role: "ACCOUNTANT", name: "Leaver", email }, admin.sub);
    const first = await auth.login({ email, password: temporaryPassword! }, {});
    expect(first.refreshToken).toBeTruthy();

    await service.setStatus(account.id, "INACTIVE", admin.sub);
    await expect(auth.login({ email, password: temporaryPassword! }, {})).rejects.toBeInstanceOf(UnauthorizedException);
    const tokens = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.userId, account.userId));
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.every((t) => t.revoked)).toBe(true);

    await service.setStatus(account.id, "ACTIVE", admin.sub);
    await expect(auth.login({ email, password: temporaryPassword! }, {})).resolves.toBeDefined();
  });

  it("reset gives a new password, kills the old one and revokes sessions", async () => {
    const email = `acc-${uid()}@school.in`;
    const { account, temporaryPassword } = await service.create({ role: "ACCOUNTANT", name: "Forgetful", email }, admin.sub);
    await auth.login({ email, password: temporaryPassword! }, {});

    const reset = await service.resetPassword(account.id, admin.sub);
    expect(reset.temporaryPassword).not.toBe(temporaryPassword);
    await expect(auth.login({ email, password: temporaryPassword! }, {})).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(auth.login({ email, password: reset.temporaryPassword }, {})).resolves.toBeDefined();
    const tokens = await db.select().from(schema.refreshTokens).where(eq(schema.refreshTokens.userId, account.userId));
    expect(tokens.filter((t) => !t.revoked)).toHaveLength(1); // only the one from the new login
  });

  it("unknown account ids are not found", async () => {
    await expect(service.resetPassword("nope", admin.sub)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.setStatus("nope", "INACTIVE", admin.sub)).rejects.toBeInstanceOf(NotFoundException);
  });
});
