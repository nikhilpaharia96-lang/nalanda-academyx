import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { markAttendanceSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get("class/:classId/section/:sectionId")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  getRoster(
    @Param("classId") classId: string,
    @Param("sectionId") sectionId: string,
    @Query("date") date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.getRosterForDate(classId, sectionId, date, user);
  }

  @Post("mark")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  mark(@Body(new ZodValidationPipe(markAttendanceSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.mark(dto, user);
  }

  @Get("student/:studentId")
  getStudentHistory(
    @Param("studentId") studentId: string,
    @Query("from") from: string | undefined,
    @Query("to") to: string | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.getStudentHistory(studentId, user, { from, to });
  }

  @Get("reports/class/:classId/section/:sectionId")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  getClassReport(
    @Param("classId") classId: string,
    @Param("sectionId") sectionId: string,
    @Query("date") date: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendanceService.getClassReport(classId, sectionId, date, user);
  }
}
