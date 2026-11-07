import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { leaveApplySchema, leaveReviewSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { LeaveService } from "./leave.service";

@Controller("leave")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query("status") status?: string, @Query("studentId") studentId?: string) {
    return this.leaveService.list(user, { status, studentId });
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  apply(@Body(new ZodValidationPipe(leaveApplySchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.apply(dto, user);
  }

  @Post(":id/review")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  review(@Param("id") id: string, @Body(new ZodValidationPipe(leaveReviewSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.review(id, dto, user);
  }

  @Post(":id/cancel")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  cancel(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.leaveService.cancel(id, user);
  }
}
