# Final Verification — Nalanda Academy Cloud

This document is an honest record of what was built, what was tested, how it was tested,
and what is still outstanding. It reflects the state after Phases 1–8 (Foundation,
Database, Auth, Admin Portal, Teacher Portal, Student Portal, Parent Portal).

## 1. Completed modules

### Backend (NestJS + Drizzle ORM, 30-table schema)
Auth, Users, Students, Teachers, Parents, Classes, Sections, Academic Years,
Admissions (with status-machine enforcement + auto-enrollment), Fee Structures,
Student Fees, Extra Fees (individual/class/section targeting), Payments
(Razorpay + offline), Receipts, Attendance, Results (with publish-gating),
Notices, Events, Faculty, Facilities, Documents, Notifications, Reports,
Messages (contact form), Settings, Audit Logs, Dashboard.

### Frontend (Next.js 14, App Router)
- **Admin Portal**: login, dashboard (live stats), students list (search/pagination).
- **Teacher Portal**: login, dashboard (assigned classes), mobile-optimized attendance
  marking (MARK ALL PRESENT + individual PRESENT/ABSENT/LATE/LEAVE overrides, sticky
  controls, fixed bottom save bar on mobile), profile.
- **Student Portal**: login, dashboard, profile (read-only official fields), attendance
  (monthly view + percentage), fees & payments (real Razorpay checkout flow + receipt
  modal), results (publish-gated), notices, events, notifications, documents, settings
  (change password).
- **Parent Portal**: all of the above, scoped through a child-switcher (dropdown +
  dedicated "My Children" page) backed by React context, so every page re-fetches for
  whichever linked child is selected.
- Public marketing site intentionally **not** rebuilt — being developed separately per
  instructions.

## 2. Test results

Two automated test scripts run against the live API + real SQLite database (not mocks):

| Suite | Coverage | Result |
|---|---|---|
| `test-payments.js` | Order creation, signature verification (valid/invalid), webhook (valid/invalid/duplicate), offline payments, receipts, ownership, payment history | **37/37 passed** |
| `test-phase5.js` | Academics RBAC, attendance marking/duplicate-protection/ownership, results publish-gating, notices/events publish-gating, faculty/facilities, documents ownership, messages, settings, audit logs, reports | **37/37 passed** |

Both suites were re-run against a **fresh migration + seed** immediately before this
document was written, and again after the final lint/build pass, to confirm nothing
regressed. Total: **74/74 automated assertions passing** on the final build.

## 3. Authentication verification

- Bcrypt password verification confirmed (wrong password → 401, correct → JWT issued).
- Short-lived access tokens (15 min) + rotating, hashed refresh tokens in httpOnly
  cookies, confirmed via direct cookie-based `/auth/refresh` calls.
- `/auth/me` and change-password flows exercised through the web app's `AuthProvider`
  (silent session restore on page load) and directly via curl.
- Every portal's `PortalShell` component redirects to that portal's login page if no
  valid session is present or the session's role doesn't match the portal.

## 4. Authorization verification

Enforced **in the backend**, not just hidden in the UI — verified by direct API calls
bypassing the frontend entirely:

- Unauthenticated request to a protected route → **401** (confirmed on `/payments/razorpay/order`, `/students`).
- Authenticated but wrong role → **403** (confirmed: STUDENT calling admin-only
  `/payments/offline`, `/messages`, `/audit-logs`; STUDENT attempting to create a class;
  STUDENT attempting to mark attendance).
- Cross-family / cross-class access → **403**, never a data leak (confirmed: an
  unrelated parent cannot read another family's attendance, documents, receipts, or pay
  their fees; a teacher not assigned to a class/section is rejected from marking its
  attendance).
- Resource that doesn't exist or isn't accessible → **404** (confirmed: bogus
  `studentFeeId`).
- SUPER_ADMIN-only surfaces (audit logs) reject ADMIN and below.

## 5. Payment verification

- **Never trusts frontend "success"** — a payment is only marked `PAID` by
  server-side Razorpay signature verification (`HMAC-SHA256(orderId|paymentId, key_secret)`)
  or by an independently-verified webhook signature over the *raw* request body.
- Client-supplied payment amounts are checked against the actual fee record; a
  mismatched amount is rejected with 400 before an order is even created.
- Idempotency confirmed twice, independently: re-POSTing a verify call for an
  already-PAID payment returns `alreadyProcessed: true` with no new receipt; replaying
  the identical webhook payload does the same.
- Receipts are generated exactly once per successful payment, with an atomically
  incremented receipt number, and are only visible to the paying student, their linked
  parent(s), or an admin.
- **Sandbox limitation (disclosed, not hidden)**: this container cannot reach
  `api.razorpay.com` (no network egress to non-package-registry domains), so live order
  creation cannot be exercised end-to-end here. The test suite proves this by showing
  the code path executes all real validation/ownership/amount checks and only fails at
  the actual outbound HTTP call (503, with a clear message) — then separately proves
  signature verification and webhook handling with real cryptography using a simulated
  order row. In a normal deployment environment with real Razorpay test-mode keys, order
  creation works unmodified — nothing about that code path is stubbed or faked.

## 6. Attendance verification

- Manual-only: no automatic/face-recognition marking exists anywhere in the codebase.
- MARK ALL PRESENT followed by individual overrides confirmed to update (not duplicate)
  the affected rows.
- Duplicate protection confirmed at the database level (`onConflictDoUpdate` against a
  unique index on student+date+class+section+academicYear) — re-marking the same
  student/date pair updates in place.
- Teacher-to-class ownership enforced: a teacher not assigned to a class/section gets
  403 attempting to view its roster or mark its attendance.
- Student/parent read access is ownership-scoped and percentage calculations are
  computed server-side from real rows, not client math.

## 7. Portal verification

- Teacher: login → dashboard (assigned classes only) → attendance (mobile-first: sticky
  class/date picker, thumb-reachable fixed save button, 44px+ tap targets) → profile.
  Confirmed via production build + live HTTP smoke test.
- Student: full nav (dashboard, profile, attendance, fees/payments, results, notices,
  events, notifications, documents, settings) all wired to real endpoints; verified
  ownership prevents viewing another student's data.
- Parent: child switcher (context-driven, no page reload) correctly re-scopes every
  page's API calls to the selected child; verified a parent cannot select or fetch data
  for a child not linked to their account (backend-enforced, confirmed via direct API
  call with a second unrelated parent account).

## 8. Build verification

```
apps/web  — npx tsc --noEmit           → 0 errors
apps/api  — npx tsc --noEmit           → 0 errors
apps/web  — npx next lint              → 0 warnings, 0 errors
apps/api  — npx eslint "src/**/*.ts"   → 0 warnings, 0 errors
apps/web  — npm run build              → succeeded, 33 routes compiled
apps/api  — npx nest build             → succeeded
```

Two real bugs were caught and fixed by this verification pass (not hypothetical):
an invalid Next.js page export (`teacherNav`) that failed static generation, and a
server→client component boundary violation (passing Lucide icon component references
from Server Components into Client Components) that broke static prerendering on the
teacher/student/parent login and settings pages. Both are fixed and confirmed by a
clean production build.

## 9. Known limitations

- **Razorpay live calls**: order creation cannot be exercised against real Razorpay
  servers from this sandboxed container (no network egress to `api.razorpay.com`).
  Signature verification and webhook handling — the security-critical parts — are fully
  real and tested with actual cryptography.
- **Cloud storage**: Document uploads store whatever `fileUrl` the caller supplies;
  there's no real S3/R2 integration yet (Phase 11, needs network egress this sandbox
  lacks). Ownership/visibility enforcement around documents is real.
- **Email**: no email provider is wired up yet (admission confirmations, fee reminders,
  password reset emails are not sent).
- **Public website**: intentionally not built here — being developed as a separate
  project per instructions, to be merged later.
- **SQLite vs Postgres**: local dev runs on SQLite because Prisma (the originally
  specified ORM) couldn't fetch its query-engine binary in this sandbox; Drizzle ORM
  replaced it. The schema avoids SQLite-only constructs, but a real migration run
  against Postgres has not been executed (no reachable Postgres instance from this
  container) — only inferred to be compatible from the schema design.
- **Reports module** covers attendance/fees/enrollment aggregates; it does not yet
  include exportable PDF/Excel reports.
- No automated frontend (Playwright/Cypress) test suite — verification here is via
  direct API testing (which exercises the same backend the frontend calls) plus manual
  HTTP smoke tests of every route and a clean production build.

## 10. Production deployment requirements

To take this from "verified in sandbox" to live:

1. **Database**: provision a real Postgres instance (Neon/Supabase/RDS), set
   `DATABASE_URL`, switch `packages/database` from the SQLite driver
   (`drizzle-orm/better-sqlite3`) to the Postgres driver (`drizzle-orm/postgres-js` or
   `node-postgres`), regenerate migrations, run `drizzle-kit generate` + a migration
   deploy step.
2. **Secrets**: set real `JWT_SECRET`, `JWT_REFRESH_SECRET` (long random values, not the
   sandbox dev defaults), `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOK_SECRET`
   from a real Razorpay account (test mode first), storage and email credentials.
3. **Storage**: wire up Cloudflare R2 or S3 for real file uploads with signed URLs,
   replacing the current metadata-only `fileUrl` pass-through in the Documents module.
4. **Email**: connect a provider (Resend/SMTP) for the transactional emails the spec
   calls for (admission status changes, fee reminders, password reset).
5. **Deploy**: `apps/web` to Vercel (or similar), `apps/api` to a container host
   (Render/Fly.io/Railway), point `NEXT_PUBLIC_API_URL` and CORS `WEB_URL` at each
   other's real domains, enable HTTPS everywhere (cookies are `secure` in production).
6. **Merge the public website** project once it's ready, keeping this backend as its
   API.
7. Re-run this same verification pass (migrate, seed with real school data instead of
   demo data, full test suite, RBAC spot-checks) against the production configuration
   before going live.
