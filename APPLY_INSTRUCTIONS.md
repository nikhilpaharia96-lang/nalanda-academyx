# Fees & Payments module — how to apply

You have two ways to get this into your repo. **The patch is the recommended
path** — the zip is a fallback in case `git apply` isn't convenient for you.

## Option A — git patch (recommended)

```bash
git checkout -b feature/fees-payments
git apply nalanda-fees-payments.patch
npm install               # picks up the new pdfkit dependency
```

Then review the diff (`git diff`) before committing, exactly like reviewing
any other PR.

## Option B — zip

This folder mirrors your repo's structure. Copy each file over the matching
path in your working copy (all are either new files or full-file overwrites
of files you already have), then `npm install` for the new `pdfkit` dep.

## After applying (either option)

1. **Run the new migration** against your Render Postgres database:
   ```bash
   cd packages/database
   # however you already run migrations in this repo, e.g.:
   npm run migrate:postgres
   ```
   The new migration is `packages/database/migrations-postgres/0002_previous_the_watchers.sql`
   — it only adds nullable/defaulted columns, one index, and two FKs. No
   drops, nothing destructive, safe to run against production data.

2. **Build sanity check** (already verified clean on my end, but worth
   re-running after you merge):
   ```bash
   npm install
   cd apps/api && npm run build
   cd ../web && npm run build
   ```

3. Nothing else changes — no new environment variables, no changes to your
   Razorpay keys/webhook secret, no changes to auth.

## Note on timing

I built this against your repo's `main` as of the start of this
conversation. Partway through, new commits landed upstream (exams module,
teachers module, admin/students/new — none of it touching fees/payments).
I re-based this patch against that newer `main` and re-verified the full
build (API + web, all 43 routes) after merging, so it's current as of
this patch's generation — but if you've pushed anything since, re-check
before applying.
