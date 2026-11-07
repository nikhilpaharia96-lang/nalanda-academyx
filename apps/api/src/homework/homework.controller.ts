import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { homeworkSchema, homeworkUpdateSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { HomeworkService } from "./homework.service";

@Controller("homework")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("classId") classId?: string,
    @Query("sectionId") sectionId?: string,
    @Query("academicYearId") academicYearId?: string,
    @Query("studentId") studentId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.homeworkService.list(user, { classId, sectionId, academicYearId, studentId, from, to });
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  create(@Body(new ZodValidationPipe(homeworkSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.homeworkService.create(dto, user);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(homeworkUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.homeworkService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.homeworkService.remove(id, user);
  }
}
