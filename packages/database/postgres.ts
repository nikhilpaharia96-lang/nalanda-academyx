// Dedicated PostgreSQL client — explicitly separate from the SQLite client
// in index.ts, per the "keep both explicitly separated" requirement. This
// module uses the real `pg` (node-postgres) driver and `drizzle-orm/node-postgres`
// adapter, against the genuine PostgreSQL-dialect schema in schema.pg.ts.
//
// This is imported by index.ts ONLY when DATABASE_URL points at a Postgres
// connection string (see the dispatch logic there), so existing SQLite-only
// consumers of this package are completely unaffected unless they
// deliberately configure a Postgres URL.
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as pgSchemaExports from "./schema.pg";

let pool: Pool | undefined;
let dbInstance: ReturnType<typeof drizzle<typeof pgSchemaExports>> | undefined;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required to connect to PostgreSQL");
    }
    pool = new Pool({
      connectionString,
      // Most managed Postgres providers (Neon, Supabase, Render Postgres, RDS)
      // require SSL and present a certificate that isn't in Node's default
      // trust store for this kind of managed/proxied setup. This mirrors the
      // common `?sslmode=require`-style connection string convention. If your
      // provider needs a stricter cert-validated setup, override this via a
      // provider-specific connection string parameter instead of relaxing it
      // further here.
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

/** Lazily constructs the Postgres-backed Drizzle client. Connections are
 * pooled by `pg.Pool` and are NOT established until the first query runs —
 * constructing this does not itself perform any network I/O. */
export function getPostgresDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema: pgSchemaExports });
  }
  return dbInstance;
}

export const pgSchema = pgSchemaExports;
export type PostgresDb = ReturnType<typeof getPostgresDb>;
