import { Body, Controller, Delete, Get, Header, Param, Put, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { SiteContentService } from "./site-content.service";

const saveSchema = z.object({ value: z.record(z.unknown()) });

@Controller("site-content")
export class SiteContentController {
  constructor(private readonly service: SiteContentService) {}

  // PUBLIC: the website renders from this. Contains only copy the school
  // chose to publish (never users, settings or anything private).
  @Get()
  @Header("Cache-Control", "public, max-age=15, stale-while-revalidate=60")
  effective() {
    return this.service.getEffective();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  forAdmin() {
    return this.service.getForAdmin();
  }

  @Put(":section")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  save(@Param("section") section: string, @Body(new ZodValidationPipe(saveSchema)) dto: { value: Record<string, unknown> }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.save(section, dto.value, user.sub);
  }

  @Delete(":section")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  reset(@Param("section") section: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.reset(section, user.sub);
  }
}
