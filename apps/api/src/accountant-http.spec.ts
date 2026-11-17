import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import express from "express";
import bcrypt from "bcryptjs";
import { db, schema } from "@nalanda/database";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/http-exception.filter";
import { makeBase, makeParent, makeStudent } from "./campus.fixtures";

/**
 * Real HTTP, real guards, real login: an accountant signs in and we call endpoints the way the browser does.
 * Catches wiring mistakes that service-level tests can't (token payload, guards, route order, filters).
 */
describe("accountant over HTTP", () => {
  let app: NestExpressApplication;
  let base: string;
  const uid = Math.random().toString(36).slice(2, 8);
  const tokens: Record<string, string> = {};

  const call = async (method: string, path: string, token?: string, body?: unknown) => {
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const login = async (email: string, password: string) => {
    const r = await call("POST", "/auth/login", undefined, { email, password });
    expect(r.status).toBeLessThan(300);
    return r.body.accessToken as string;
  };

  beforeAll(async () => {
    process.env.JWT_SECRET ||= "test-access-secret";
    process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
    app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false });
    app.use(cookieParser());
    app.use(express.json());
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.listen(0);
    base = await app.getUrl();
    if (base.includes("[::1]")) base = base.replace("[::1]", "localhost");

    const hash = await bcrypt.hash("Passw0rd!x", 4);
    for (const [key, role] of [["admin", "ADMIN"], ["acc", "ACCOUNTANT"]] as const) {
      await db.insert(schema.users).values({ email: `${key}-${uid}@x.test`, passwordHash: hash, role });
    }
    const [accUser] = await db.select().from(schema.users).where((await import("drizzle-orm")).eq(schema.users.email, `acc-${uid}@x.test`));
    await db.insert(schema.staffAccounts).values({ userId: accUser.id, name: "Test Accountant" });
    tokens.admin = await login(`admin-${uid}@x.test`, "Passw0rd!x");
    tokens.acc = await login(`acc-${uid}@x.test`, "Passw0rd!x");
  }, 60000);

  afterAll(async () => { await app?.close(); });

  it("an accountant can reach the money screens", async () => {
    for (const path of ["/fees/admin/overview", "/fees/pending", "/fees/student-fees", "/payments", "/payments/receipts", "/payroll/structures", "/payroll/payslips", "/concessions", "/concessions/report", "/reports/fees", "/students?search=zz", "/fees/structures", "/classes"]) {
      const r = await call("GET", path, tokens.acc);
      expect({ path, status: r.status }).toEqual({ path, status: 200 });
    }
  });

  it("the student list an accountant gets contains no personal details", async () => {
    const b = await makeBase();
    const s = await makeStudent(b);
    const r = await call("GET", `/students?search=${s.studentId}`, tokens.acc);
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveLength(1);
    expect(JSON.stringify(r.body)).not.toMatch(/dateOfBirth|address|fatherName|motherName|"phone"|photoUrl|userId/);
  });

  it("an accountant is refused everything else with 403 (and unauthenticated gets 401)", async () => {
    const b = await makeBase();
    const s = await makeStudent(b);
    const parent = await makeParent(s);
    const forbidden: [string, string, unknown?][] = [
      ["GET", "/staff-accounts"], ["POST", "/staff-accounts", { role: "ACCOUNTANT", name: "Evil Twin", email: "evil@x.test" }],
      ["GET", `/students/${s.id}`], ["GET", `/parents/${parent.id}`], ["GET", `/parents/${parent.id}/children`],
      ["GET", `/teachers/${b.teacher.id}`], ["GET", `/teachers/${b.teacher.id}/assignments`], ["GET", "/teachers"], ["GET", "/parents"],
      ["POST", "/fees/student-fees/x/waive", { reason: "free money" }], ["DELETE", "/fees/structures/x"],
      ["POST", "/concessions/grants", { studentId: s.id, concessionId: "x", academicYearId: b.year.id, reason: "nope" }],
      ["PUT", "/payroll/attendance", { date: "2024-01-02", records: [{ teacherId: b.teacher.id, status: "PRESENT" }] }],
      ["GET", "/reports/attendance"], ["GET", "/reports/enrollment"], ["GET", "/certificates"], ["GET", "/dashboard/admin"], ["GET", "/dashboard/admin/recent-payments"], ["GET", "/audit-logs"], ["GET", "/settings"], ["PUT", "/settings/school_name", { value: "Hacked" }], ["GET", "/store/dashboard/summary"], ["GET", "/transport/routes"], ["GET", "/hostels"],
      ["GET", `/attendance/student/${s.id}`], ["GET", `/results/student/${s.id}`], ["GET", `/documents/student/${s.id}`],
      ["GET", `/timetable/student/${s.id}`], ["GET", `/transport/student/${s.id}`], ["GET", `/hostels/student/${s.id}`], ["GET", `/promotions/student/${s.id}`],
      ["GET", "/homework"], ["GET", "/leave"], ["GET", "/library/requests"], ["PUT", `/payroll/structures/${b.teacher.id}`, { basic: -1 }],
    ];
    for (const [method, path, body] of forbidden) {
      const r = await call(method, path, tokens.acc, body);
      // PUT with an invalid body is rejected by validation (400) after the role check passes: it must not succeed either way.
      expect({ method, path, ok: r.status < 300 }).toEqual({ method, path, ok: false });
      if (!path.startsWith("/payroll/structures")) expect({ method, path, status: r.status }).toEqual({ method, path, status: 403 });
    }
    expect((await call("GET", "/fees/admin/overview")).status).toBe(401);
  });

  it("an accountant's fee statement and an admin's staff-login listing both work end to end", async () => {
    const b = await makeBase();
    const s = await makeStudent(b);
    const stmt = await call("GET", `/fees/student/${s.id}`, tokens.acc);
    expect(stmt.status).toBe(200);

    const list = await call("GET", "/staff-accounts", tokens.admin);
    expect(list.status).toBe(200);
    expect(list.body.some((a: any) => a.email === `acc-${uid}@x.test` && a.role === "ACCOUNTANT")).toBe(true);
    expect(JSON.stringify(list.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it("an admin creates an accountant who then signs in and works, and blocking them cuts access", async () => {
    const email = `new-acc-${uid}@x.test`;
    const created = await call("POST", "/staff-accounts", tokens.admin, { role: "ACCOUNTANT", name: "New Accountant", email });
    expect(created.status).toBeLessThan(300);
    const token = await login(email, created.body.temporaryPassword);
    expect((await call("GET", "/payments", token)).status).toBe(200);
    expect((await call("GET", "/staff-accounts", token)).status).toBe(403);

    expect((await call("PATCH", `/staff-accounts/${created.body.account.id}/status`, tokens.admin, { status: "INACTIVE" })).status).toBeLessThan(300);
    const again = await call("POST", "/auth/login", undefined, { email, password: created.body.temporaryPassword });
    expect(again.status).toBe(401);
  });
});
