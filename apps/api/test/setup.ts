// Runs once per test file, BEFORE that file (and anything it imports,
// including `@nalanda/database`) is loaded. We point DATABASE_URL at a
// throwaway SQLite file and run every real migration against it, so tests
// exercise the actual schema/migrations rather than a hand-rolled stand-in.
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import os from "os";
import crypto from "crypto";

const dbPath = path.join(os.tmpdir(), `nalanda-api-test-${process.pid}-${crypto.randomUUID()}.db`);
process.env.DATABASE_URL = `file:${dbPath}`;

const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: path.join(__dirname, "../../../packages/database/migrations") });
sqlite.close();
