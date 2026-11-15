import { ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { buildAccessMatrix } from "./access-matrix";
import { RolesGuard } from "./common/guards/roles.guard";
import { FeesController } from "./fees/fees.controller";
import { ConcessionsController } from "./concessions/concessions.controller";
import { StaffAccountsController } from "./staff-accounts/staff-accounts.controller";
import { StudentsController } from "./students/students.controller";
import { PayrollController } from "./payroll/payroll.controller";

/**
 * Who can call what. These lists are deliberately written out in full: adding a route, or widening
 * who may call one, fails this test until a person has reviewed it and updated the list below.
 */

// Routes where the ACCOUNTANT role is allowed. Everything money-related that an accountant runs day to day;
// approvals and destructive actions (waive a fee, delete a structure, grant a concession, staff attendance,
// student/teacher management, settings, certificates ...) are NOT here.
const ACCOUNTANT_ROUTES = [
  "DELETE /payroll/payslips/:id",
  "GET /concessions",
  "GET /concessions/report",
  "GET /concessions/student/:studentId",
  "GET /fees/admin/overview",
  "GET /fees/extra",
  "GET /fees/pending",
  "GET /fees/pending/breakdown",
  "GET /fees/reports/summary",
  "GET /fees/student-fees",
  "GET /payments",
  "GET /payments/receipts",
  "GET /payroll/attendance",
  "GET /payroll/attendance/summary",
  "GET /payroll/payslips",
  "GET /payroll/payslips/:id/pdf",
  "GET /payroll/structures",
  "GET /reports/fees",
  "GET /students",
  "PATCH /fees/structures/:id",
  "POST /fees/extra",
  "POST /fees/structures",
  "POST /fees/structures/:id/generate",
  "POST /payments/offline",
  "POST /payroll/payslips/:id/adjust",
  "POST /payroll/payslips/:id/pay",
  "POST /payroll/payslips/generate",
  "PUT /payroll/structures/:teacherId",
];

// Signed-in routes with no @Roles. Any role reaches the handler, so EACH of these must enforce access
// inside its service (ownership checks, allow-lists, or data that is public/own-only). Reviewed one by one.
const OPEN_BUT_CHECKED_IN_SERVICE = [
  "GET /academic-years",
  "GET /attendance/student/:studentId",
  "GET /auth/me",
  "GET /classes",
  "GET /documents/:id",
  "GET /documents/mine",
  "GET /documents/student/:studentId",
  "GET /events",
  "GET /events/:slug",
  "GET /facilities",
  "GET /faculty",
  "GET /fees/structures",
  "GET /fees/student/:studentId",
  "GET /fees/types",
  "GET /homework",
  "GET /hostels/student/:studentId",
  "GET /leave",
  "GET /library/books",
  "GET /notices",
  "GET /notices/:slug",
  "GET /notifications",
  "GET /parents/:id",
  "GET /parents/:id/children",
  "GET /payments/:id/receipt",
  "GET /payments/:id/receipt/pdf",
  "GET /promotions/student/:studentId",
  "GET /results/student/:studentId",
  "GET /results/years",
  "GET /results/years/:year",
  "GET /sections",
  "GET /store/categories",
  "GET /store/orders/:id",
  "GET /store/settings",
  "GET /students/:id",
  "GET /teachers/:id",
  "GET /teachers/:id/assignments",
  "GET /timetable/slots",
  "GET /timetable/student/:studentId",
  "GET /transport/student/:studentId",
  "PATCH /notifications/:id/read",
  "POST /auth/change-password",
  "POST /documents",
  "POST /payments/razorpay/order",
  "POST /payments/razorpay/verify",
];

// Routes with no login required.
const PUBLIC_ROUTES = [
  "GET /admissions/classes",
  "GET /health",
  "POST /admissions",
  "POST /auth/login",
  "POST /auth/logout",
  "POST /auth/refresh",
  "POST /messages",
  "POST /payments/razorpay/webhook",
];

const matrix = buildAccessMatrix(AppModule);

describe("access matrix", () => {
  it("ACCOUNTANT can call exactly the reviewed set of routes", () => {
    const actual = matrix.filter((r) => r.roles?.includes("ACCOUNTANT")).map((r) => r.route).sort();
    expect(actual).toEqual([...ACCOUNTANT_ROUTES].sort());
  });

  it("the set of signed-in routes without @Roles is exactly the reviewed set", () => {
    const actual = matrix.filter((r) => !r.roles && r.guards.some((g) => g.includes("Jwt"))).map((r) => r.route).sort();
    expect(actual).toEqual([...OPEN_BUT_CHECKED_IN_SERVICE].sort());
  });

  it("the set of routes with no login is exactly the reviewed set", () => {
    const actual = matrix.filter((r) => !r.guards.some((g) => g.includes("Jwt"))).map((r) => r.route).sort();
    expect(actual).toEqual([...PUBLIC_ROUTES].sort());
  });

  it("accountants never get routes that change who can log in or that approve money decisions", () => {
    const never = ["/staff-accounts", "/teachers", "/parents", "/settings", "/students/:id", "/waive", "/concessions/grants", "/promotions", "/certificates"];
    const hits = matrix.filter((r) => r.roles?.includes("ACCOUNTANT") && !r.route.startsWith("GET /students") && never.some((n) => r.route.includes(n)));
    expect(hits).toEqual([]);
  });
});

describe("RolesGuard with real handlers", () => {
  const guard = new RolesGuard(new Reflector());
  const ctx = (controller: any, handler: string, role: string) =>
    ({
      getHandler: () => controller.prototype[handler],
      getClass: () => controller,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as any;
  const allowed = (c: any, h: string, role: string) => {
    try { return guard.canActivate(ctx(c, h, role)); } catch (e) { if (e instanceof ForbiddenException) return false; throw e; }
  };

  it("lets an accountant record fees and run payroll", () => {
    expect(allowed(FeesController, "createStructure", "ACCOUNTANT")).toBe(true);
    expect(allowed(FeesController, "generate", "ACCOUNTANT")).toBe(true);
    expect(allowed(PayrollController, "pay", "ACCOUNTANT")).toBe(true);
    expect(allowed(ConcessionsController, "report", "ACCOUNTANT")).toBe(true);
    expect(allowed(StudentsController, "list", "ACCOUNTANT")).toBe(true);
  });

  it("keeps approvals, destructive actions and people-management away from accountants", () => {
    expect(allowed(FeesController, "waive", "ACCOUNTANT")).toBe(false);
    expect(allowed(FeesController, "deleteStructure", "ACCOUNTANT")).toBe(false);
    expect(allowed(ConcessionsController, "grant", "ACCOUNTANT")).toBe(false);
    expect(allowed(ConcessionsController, "revoke", "ACCOUNTANT")).toBe(false);
    expect(allowed(StaffAccountsController, "list", "ACCOUNTANT")).toBe(false);
    expect(allowed(StaffAccountsController, "create", "ACCOUNTANT")).toBe(false);
    expect(allowed(StudentsController, "create", "ACCOUNTANT")).toBe(false);
    expect(allowed(PayrollController, "mark", "ACCOUNTANT")).toBe(false); // marking staff attendance
  });

  it("still lets admins do all of it, and keeps teachers/students/parents out of finance", () => {
    for (const role of ["SUPER_ADMIN", "ADMIN"]) {
      expect(allowed(FeesController, "waive", role)).toBe(true);
      expect(allowed(StaffAccountsController, "create", role)).toBe(true);
    }
    for (const role of ["TEACHER", "STUDENT", "PARENT"]) {
      expect(allowed(FeesController, "createStructure", role)).toBe(false);
      expect(allowed(PayrollController, "generate", role)).toBe(false);
      expect(allowed(StaffAccountsController, "list", role)).toBe(false);
    }
  });
});
