import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { timeSlotSchema, timeSlotUpdateSchema, timetableEntrySchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { TimetableService } from "./timetable.service";

@Controller("timetable")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get("slots")
  listSlots() {
    return this.timetableService.listSlots();
  }

  @Post("slots")
  @Roles("SUPER_ADMIN", "ADMIN")
  createSlot(@Body(new ZodValidationPipe(timeSlotSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.createSlot(dto, user.sub);
  }

  @Patch("slots/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateSlot(@Param("id") id: string, @Body(new ZodValidationPipe(timeSlotUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.updateSlot(id, dto, user.sub);
  }

  @Put("entries")
  @Roles("SUPER_ADMIN", "ADMIN")
  setEntry(@Body(new ZodValidationPipe(timetableEntrySchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.setEntry(dto, user.sub);
  }

  @Delete("entries/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  deleteEntry(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.deleteEntry(id, user.sub);
  }

  @Get("class/:classId/section/:sectionId")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  forClass(
    @Param("classId") classId: string,
    @Param("sectionId") sectionId: string,
    @Query("academicYearId") academicYearId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.getForClass(classId, sectionId, academicYearId, user);
  }

  @Get("student/:studentId")
  forStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.timetableService.getForStudent(studentId, user);
  }

  @Get("teacher")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  forTeacher(
    @Query("academicYearId") academicYearId: string,
    @Query("teacherId") teacherId: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.timetableService.getForTeacher(teacherId, academicYearId, user);
  }
}
