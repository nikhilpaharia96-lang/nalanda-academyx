import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { concessionSchema, concessionUpdateSchema, grantConcessionSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { ConcessionsService } from "./concessions.service";

@Controller("concessions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConcessionsController {
  constructor(private readonly concessionsService: ConcessionsService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN")
  list() {
    return this.concessionsService.list();
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(concessionSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.concessionsService.create(dto, user.sub);
  }

  // Fixed paths are declared before ":id" so they are never read as an id.
  @Get("report")
  @Roles("SUPER_ADMIN", "ADMIN")
  report(@Query("academicYearId") academicYearId?: string) {
    return this.concessionsService.report(academicYearId);
  }

  @Post("grants")
  @Roles("SUPER_ADMIN", "ADMIN")
  grant(@Body(new ZodValidationPipe(grantConcessionSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.concessionsService.grant(dto, user.sub);
  }

  @Post("grants/:id/revoke")
  @Roles("SUPER_ADMIN", "ADMIN")
  revoke(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.concessionsService.revoke(id, user.sub);
  }

  @Get("student/:studentId")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  forStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.concessionsService.forStudent(studentId, user);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(concessionUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.concessionsService.update(id, dto, user.sub);
  }
}
