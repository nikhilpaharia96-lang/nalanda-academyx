import { Body, Controller, Get, Injectable, Module, Param, Put, UseGuards } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@nalanda/database";
import { AuditService } from "../common/audit.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Injectable()
export class SettingsService {
  constructor(private readonly auditService: AuditService) {}

  async list() {
    const rows = await db.select().from(schema.settings);
    // Internal counters (receipt numbering etc.) aren't school "settings" —
    // hide anything prefixed receipt_counter_ from this admin-facing list.
    return rows.filter((r) => !r.key.startsWith("receipt_counter_"));
  }

  async set(key: string, value: string, actorId: string) {
    const [existing] = await db.select().from(schema.settings).where(eq(schema.settings.key, key));
    if (existing) {
      await db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key));
    } else {
      await db.insert(schema.settings).values({ key, value });
    }
    await this.auditService.log({ userId: actorId, action: "SETTING_UPDATE", entity: "Setting", entityId: key });
    return { key, value };
  }
}

const setSchema = z.object({ value: z.string() });

@Controller("settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  list() {
    return this.settingsService.list();
  }

  @Put(":key")
  set(@Param("key") key: string, @Body(new ZodValidationPipe(setSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.set(key, dto.value, user.sub);
  }
}

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
