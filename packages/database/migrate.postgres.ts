// Explicitly separate from migrate.ts (the SQLite runner): connects with the
// real `pg` driver and applies the PostgreSQL-dialect migrations in
// ./migrations-postgres. Run via `npm run migrate:postgres` — requires a
// real DATABASE_URL pointing at a postgres(ql):// connection string.
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is required (a postgresql:// connection string) to run Postgres migrations.");
    process.exit(1);
  }
  if (!/^postgres(ql)?:\/\//.test(connectionString)) {
    console.error(
      `DATABASE_URL does not look like a PostgreSQL connection string: ${connectionString}\n` +
        "This script only runs Postgres migrations. For SQLite, use `npm run migrate` instead.",
    );
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  console.log("Applying PostgreSQL migrations...");
  await migrate(db, { migrationsFolder: path.join(__dirname, "migrations-postgres") });
  console.log("PostgreSQL migrations applied successfully.");

  await pool.end();
}

main().catch((err) => {
  console.error("PostgreSQL migration failed:", err);
  process.exit(1);
});
