import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { db, schema } from "@nalanda/database";

@Controller()
export class AppController {
  @Get("health")
  async health() {
    // A shallow "always ok" health check is a known production anti-pattern
    // for load balancers/uptime monitors — it can report healthy while the
    // database is unreachable. This runs a trivial real query to confirm
    // the API can actually talk to its database.
    //
    // Uses the standard `.select().from().limit()` query builder rather than
    // a raw SQL string — this is the one query API that is genuinely
    // identical across both the SQLite and PostgreSQL drivers this package
    // dispatches between (raw-SQL execution methods differ: SQLite's
    // driver exposes `.run()`, Postgres's exposes `.execute()` — using
    // either directly would only work on one dialect). The `settings` table
    // always exists after migration, even with zero rows, so this is a safe,
    // cheap, dialect-portable connectivity probe.
    try {
      await db.select().from(schema.settings).limit(1);
    } catch (err) {
      // Log the real underlying error server-side only. The client-facing
      // response below is unchanged (still a generic 503 via
      // ServiceUnavailableException, reformatted by GlobalExceptionFilter
      // into {statusCode, message: "Error", timestamp}) — this log line
      // exists purely so the actual PostgreSQL/driver error is visible in
      // Render's server logs instead of being silently discarded.
      // eslint-disable-next-line no-console
      console.error("[health] database connectivity check failed:", err);
      throw new ServiceUnavailableException({
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      });
    }
    return { status: "ok", database: "connected", timestamp: new Date().toISOString() };
  }
}