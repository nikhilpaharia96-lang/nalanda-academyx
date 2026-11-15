import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { createStaffAccountSchema, staffAccountStatusSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { StaffAccountsService } from "./staff-accounts.service";

// Only admins manage who can log in as staff.
@Controller("staff-accounts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("SUPER_ADMIN", "ADMIN")
export class StaffAccountsController {
  constructor(private readonly staffAccountsService: StaffAccountsService) {}

  @Get()
  list() {
    return this.staffAccountsService.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(createStaffAccountSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.staffAccountsService.create(dto, user.sub);
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.staffAccountsService.resetPassword(id, user.sub);
  }

  @Patch(":id/status")
  setStatus(@Param("id") id: string, @Body(new ZodValidationPipe(staffAccountStatusSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.staffAccountsService.setStatus(id, dto.status, user.sub);
  }
}
