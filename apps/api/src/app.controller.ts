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
      throw new ServiceUnavailableException({
        status: "error",
        database: "unreachable",
        timestamp: new Date().toISOString(),
      });
    }
    return { status: "ok", database: "connected", timestamp: new Date().toISOString() };
  }
}
