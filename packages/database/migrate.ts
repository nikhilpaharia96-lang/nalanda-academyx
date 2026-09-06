import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") || path.join(__dirname, "dev.db");
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(__dirname, "migrations") });
console.log(`Migrations applied to ${dbPath}`);
sqlite.close();
