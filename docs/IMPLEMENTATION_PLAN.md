# Nalanda Academy Cloud — Implementation Plan

## 0. Environment note (read first)

This build is happening inside a sandboxed dev container with **no network egress to
databases, cloud storage, or payment gateways** — only package registries (npm, GitHub,
PyPI) are reachable. Consequences:

- The Prisma `datasource` is set to `sqlite` for local development in this container,
  but the schema deliberately avoids SQLite-only features so switching to
  `postgresql` in production is a one-line change (`provider = "postgresql"` +
  a real `DATABASE_URL`) plus `prisma migrate deploy`.
- Razorpay, Cloudflare R2/S3, and SMTP are implemented as real client code behind
  provider abstractions, but they need **your real credentials** in `.env` to actually
  call out — they cannot be exercised end-to-end from this container. Where a live
  network call would be required, the code path is real (order creation, signature
  verification, webhook handling) but is unit-tested against mocked HTTP rather than
  a live Razorpay sandbox, since this container can't reach `api.razorpay.com`.
- Deployment (Vercel/Render/Neon) can't be executed from here — I'll produce
  deployment-ready config (`vercel.json`, Dockerfile, migration scripts) instead.

Everything else — auth, RBAC, database schema/migrations, CRUD, attendance logic,
resource-ownership checks, receipt generation, validation — is real and runs in this
container against SQLite.

## 1. Architecture

Monorepo, npm workspaces (no Turborepo, to keep the container build fast and simple):

```
apps/web   — Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
apps/api   — NestJS + TypeScript
packages/database — Prisma schema, migrations, seed
packages/shared    — Zod schemas & shared TS types used by both apps
```

## 2. Database

PostgreSQL-compatible Prisma schema (running on SQLite in-container). CUID ids,
explicit foreign keys, unique constraints (e.g. one attendance row per
student+date+section), indexes on lookup fields, `createdAt`/`updatedAt` on every
model, soft-delete via `status`/`active` flags where the spec calls for it.

Full model list: User, Student, Parent, ParentStudent, Teacher, Class, Section,
AcademicYear, TeacherClassAssignment, AdmissionApplication, AdmissionDocument,
FeeStructure, StudentFee, ExtraFee, Payment, PaymentReceipt, Attendance, ResultYear,
StudentResult, Notice, Event, EventImage, Faculty, Facility, Notification, Document,
ContactMessage, AuditLog.

## 3. Authentication

- Argon2/bcrypt password hashing, JWT access token (15 min) + refresh token (7 days,
  httpOnly cookie), role stored in the token, `RolesGuard` + `JwtAuthGuard` on every
  protected route.
- Every controller method that takes a resource id checks **ownership**, not just
  role — e.g. a STUDENT calling `GET /students/:id/attendance` is rejected unless
  `:id` resolves to their own `Student` row; a PARENT is rejected unless the student
  is in their linked children.

## 4. API modules (NestJS)

`auth, users, students, parents, teachers, classes, sections, academic-years,
admissions, fees, payments, attendance, results, notices, events, faculty,
facilities, notifications, documents, reports, messages, settings, audit-logs,
storage` — one Nest module each, with controller/service/DTOs, following the spec's
module list exactly.

## 5. Phased delivery (this is a multi-session build)

This spec is realistically a multi-week engineering project. I'm delivering it in
the phases below, each one a real, runnable increment — not a mockup:

| Phase | Scope | Status |
|---|---|---|
| 1 | Monorepo, tooling, env config | **This session** |
| 2 | Full Prisma schema, migrations, seed | **This session** |
| 3 | Auth: login/refresh/logout, role guards, ownership guard | **This session** |
| 4 | Admin portal: dashboard, Students CRUD (full vertical slice: DB → API → UI) | **This session** |
| 5 | Admin: remaining modules (Teachers, Parents, Classes, Admissions, Fees, Notices, Events, Faculty, Facilities) | Next |
| 6 | Teacher portal + manual attendance flow | Next |
| 7 | Student portal | Next |
| 8 | Parent portal + child switcher | Next |
| 9 | Payments (Razorpay order/verify/webhook) + receipts | Next |
| 10 | Public website (all marketing pages, dynamic content) | Next |
| 11 | Cloud storage abstraction (R2/S3) + signed URLs | Next |
| 12 | Security pass, audit logging everywhere, rate limiting | Next |
| 13 | QA pass, docs, final report | Next |

Given the size, I'm building Phases 1–4 now as a solid, real foundation (not
placeholders) and will continue with the rest in follow-up turns so each phase can
actually be verified before moving on, per the spec's own instruction (§79) to work
phase by phase.
