import { Controller, Get, Injectable, Module, Query, UseGuards } from "@nestjs/common";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db, schema } from "@nalanda/database";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Injectable()
export class AuditLogsService {
  list(filters: { entity?: string; userId?: string; limit?: number } = {}) {
    const conditions: SQL[] = [];
    if (filters.entity) conditions.push(eq(schema.auditLogs.entity, filters.entity));
    if (filters.userId) conditions.push(eq(schema.auditLogs.userId, filters.userId));
    return db
      .select()
      .from(schema.auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(filters.limit ?? 100);
  }
}

// SUPER_ADMIN only — audit logs are the most sensitive read surface in the
// system (they show every privileged action, including other admins').
@Controller("audit-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  list(@Query("entity") entity?: string, @Query("userId") userId?: string, @Query("limit") limit?: string) {
    return this.auditLogsService.list({ entity, userId, limit: limit ? Number(limit) : undefined });
  }
}

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
