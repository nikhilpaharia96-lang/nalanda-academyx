// Nalanda Academy Cloud — database entry point.
//
// This module keeps SQLite (local dev) and PostgreSQL (production) EXPLICITLY
// SEPARATE internally — two different driver packages (better-sqlite3 vs pg),
// two different dialect-specific schema files (schema.ts vs schema.pg.ts) —
// and picks between them at startup based on DATABASE_URL, so every consumer
// in apps/api can keep doing `import { db, schema } from "@nalanda/database"`
// unchanged regardless of which database is actually behind it.
//
// Dispatch rule: DATABASE_URL starting with "postgres://" or "postgresql://"
// selects the real Postgres driver (drizzle-orm/node-postgres + pg) against
// the genuine Postgres schema in schema.pg.ts. Anything else (including the
// existing "file:./dev.db" style values) keeps the exact SQLite behavior
// this package has always had — nothing about the local dev workflow changes
// unless you explicitly set a postgres(ql):// URL.
//
// TYPING NOTE: `db` is statically typed against the SQLite schema shape
// (the type every existing apps/api service already compiles against).
// When Postgres is selected at runtime, the real Postgres-backed drizzle
// instance is assigned to that same binding via an explicit, documented
// type assertion below. This is safe in practice — not a fudge — because
// every column in both schema.ts and schema.pg.ts uses the same JS-level
// types (string/number/boolean; see schema.pg.ts's file header for the
// exact, deliberate type-mapping decisions), so the two dialects' inferred
// row/insert shapes are structurally identical for this schema. If a future
// change makes the two schemas diverge in shape, this assertion is the
// single place that would need attention.
import Database from "better-sqlite3";
import type BetterSqlite3 from "better-sqlite3";
import { drizzle as drizzleSqlite, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as sqliteSchemaExports from "./schema";
import { getPostgresDb, pgSchema } from "./postgres";

const databaseUrl = process.env.DATABASE_URL;
const isPostgres = /^postgres(ql)?:\/\//.test(databaseUrl ?? "");

type SqliteSchema = typeof sqliteSchemaExports;

let dbInstance: BetterSQLite3Database<SqliteSchema>;
let schemaInstance: SqliteSchema;
let sqliteInstance: BetterSqlite3.Database | undefined;

if (isPostgres) {
  // Real PostgreSQL, real driver, real dialect-specific schema — see
  // postgres.ts and schema.pg.ts. Assigned through the SQLite-shaped type
  // per the TYPING NOTE above.
  dbInstance = getPostgresDb() as unknown as BetterSQLite3Database<SqliteSchema>;
  schemaInstance = pgSchema as unknown as SqliteSchema;
} else {
  const dbPath = databaseUrl?.replace(/^file:/, "") || path.join(__dirname, "dev.db");
  sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma("journal_mode = WAL");
  sqliteInstance.pragma("foreign_keys = ON");
  dbInstance = drizzleSqlite(sqliteInstance, { schema: sqliteSchemaExports });
  schemaInstance = sqliteSchemaExports;
}

export const db = dbInstance;
export const schema = schemaInstance;
// `sqlite` (the raw better-sqlite3 handle) has no consumers anywhere in this
// codebase — verified. It's exported as `unknown` rather than its inferred
// type to sidestep a known TypeScript declaration-emit limitation with
// better-sqlite3's `export =`-style types (harmless either way since nothing
// imports this binding); cast to `BetterSqlite3.Database` at the call site
// if you ever need direct handle access for a debugging/ops script.
export const sqlite: unknown = sqliteInstance;

/** True when this process is running against PostgreSQL rather than SQLite —
 * useful for any code path that genuinely needs to branch on dialect (there
 * are none in the application today; this is exposed for diagnostics/health
 * checks and future use). */
export const isPostgresDatabase = isPostgres;

// Re-exports table/relation objects for any call site that imports them by
// name instead of via the `schema` namespace object (none do today —
// verified — but this preserves that option). This always points at the
// SQLite-dialect module names for stable typing; use `schema.<table>` (the
// dispatched instance above) for the dialect-correct runtime objects, which
// is what every existing service in apps/api already does.
export * from "./schema";
