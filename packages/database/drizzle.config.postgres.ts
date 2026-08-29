import type { Config } from "drizzle-kit";

// Explicitly separate from drizzle.config.ts (the SQLite config): different
// schema file, different dialect, different output folder, so the two
// migration histories never mix.
export default {
  schema: "./schema.pg.ts",
  out: "./migrations-postgres",
  dialect: "postgresql",
  dbCredentials: {
    // Only required for `drizzle-kit push`/introspection, not for
    // `generate` (which only reads schema.pg.ts + the existing migration
    // snapshots in ./migrations-postgres — no live DB connection needed).
    url: process.env.DATABASE_URL || "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
} satisfies Config;
