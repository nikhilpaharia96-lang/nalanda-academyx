# Nalanda Academy Cloud — Admin Portal Updates

This zip contains only the files that were added or changed across two increments:
1. Rich Admin Dashboard + reusable admin sidebar
2. Add Student / Add Teacher (with login account creation, secure credentials, reset password)

## How to upload to GitHub

The folder structure inside this zip **exactly matches your repo's folder structure**.
For each file below, go to that same path in your GitHub repo and either:
- **Replace** the file (if it already exists there) — open it, click the pencil/edit icon, select all, delete, paste the new content, commit.
- **Add as new** (if it doesn't exist yet) — use "Add file → Create new file" or "Add file → Upload files" and keep the exact same path.

If you have GitHub Desktop or `git` installed locally, the easiest way is:
1. Clone your repo locally (if not already).
2. Extract this zip **directly into your repo's root folder**, overwriting when prompted.
3. Run `git status` to see the same file list as below.
4. Commit and push.

## Files included

### Backend (apps/api)
- apps/api/src/auth/auth.service.ts
- apps/api/src/common/db-errors.ts *(new)*
- apps/api/src/dashboard/dashboard.controller.ts
- apps/api/src/dashboard/dashboard.module.ts
- apps/api/src/dashboard/dashboard.service.ts *(new)*
- apps/api/src/students/students.controller.ts
- apps/api/src/students/students.service.ts
- apps/api/src/teachers/teachers.controller.ts
- apps/api/src/teachers/teachers.service.ts

### Database (packages/database)
- packages/database/schema.ts
- packages/database/schema.pg.ts
- packages/database/migrations/0001_tiresome_gressill.sql *(new — SQLite migration)*
- packages/database/migrations/meta/0001_snapshot.json *(new)*
- packages/database/migrations/meta/_journal.json
- packages/database/migrations-postgres/0001_wonderful_reaper.sql *(new — Postgres migration)*
- packages/database/migrations-postgres/meta/0001_snapshot.json *(new)*
- packages/database/migrations-postgres/meta/_journal.json

### Shared (packages/shared)
- packages/shared/index.ts
- packages/shared/schemas/student.ts
- packages/shared/schemas/teacher.ts *(new)*

### Frontend (apps/web)
- apps/web/src/lib/admin-nav.tsx *(new)*
- apps/web/src/lib/api-client.ts
- apps/web/src/components/admin-shell.tsx
- apps/web/src/app/admin/dashboard/page.tsx
- apps/web/src/app/admin/students/page.tsx
- apps/web/src/app/admin/students/new/page.tsx *(new)*
- apps/web/src/app/admin/teachers/page.tsx *(new)*
- apps/web/src/app/admin/teachers/new/page.tsx *(new)*
- apps/web/src/app/admin/[...comingSoon]/page.tsx *(new — folder name has square brackets, this is intentional Next.js syntax)*

## After uploading — required steps

1. **Run the database migration** so the new columns actually exist:
   ```bash
   npm run db:migrate            # for local SQLite dev
   npm run db:migrate:postgres   # for your Render Postgres database
   ```
2. **Rebuild the packages in order** (database → shared → api → web) before starting the app, since `packages/database` and `packages/shared` are compiled, not run directly from source:
   ```bash
   npm run build --workspace=packages/database
   npm run build --workspace=packages/shared
   npm run build:api
   npm run build:web
   ```
3. Restart your API and web servers.

Both migrations are purely additive (`ALTER TABLE ADD COLUMN`) — no existing data is touched or dropped.
