import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res, UseGuards, ParseIntPipe, DefaultValuePipe } from "@nestjs/common";
import type { Response } from "express";
import { adjustPayslipSchema, generatePayslipsSchema, payPayslipSchema, salaryStructureSchema, staffAttendanceSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { PayrollService } from "./payroll.service";

const now = new Date();

@Controller("payroll")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get("structures")
  @Roles("SUPER_ADMIN", "ADMIN")
  structures() {
    return this.payrollService.listStructures();
  }

  @Put("structures/:teacherId")
  @Roles("SUPER_ADMIN", "ADMIN")
  upsertStructure(@Param("teacherId") teacherId: string, @Body(new ZodValidationPipe(salaryStructureSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.upsertStructure(teacherId, dto, user.sub);
  }

  @Put("attendance")
  @Roles("SUPER_ADMIN", "ADMIN")
  mark(@Body(new ZodValidationPipe(staffAttendanceSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.markAttendance(dto, user.sub);
  }

  @Get("attendance")
  @Roles("SUPER_ADMIN", "ADMIN")
  attendance(@Query("date") date: string) {
    return this.payrollService.attendanceForDate(date || new Date().toLocaleDateString("sv"));
  }

  @Get("attendance/summary")
  @Roles("SUPER_ADMIN", "ADMIN")
  summary(@Query("month", new DefaultValuePipe(now.getMonth() + 1), ParseIntPipe) month: number, @Query("year", new DefaultValuePipe(now.getFullYear()), ParseIntPipe) year: number) {
    return this.payrollService.attendanceSummary(month, year);
  }

  @Get("attendance/me")
  @Roles("TEACHER")
  mine(@CurrentUser() user: AuthenticatedUser, @Query("month", new DefaultValuePipe(now.getMonth() + 1), ParseIntPipe) month: number, @Query("year", new DefaultValuePipe(now.getFullYear()), ParseIntPipe) year: number) {
    return this.payrollService.myAttendance(user, month, year);
  }

  @Post("payslips/generate")
  @Roles("SUPER_ADMIN", "ADMIN")
  generate(@Body(new ZodValidationPipe(generatePayslipsSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.generate(dto.month, dto.year, user.sub);
  }

  @Get("payslips")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  list(@CurrentUser() user: AuthenticatedUser, @Query("month") month?: string, @Query("year") year?: string, @Query("teacherId") teacherId?: string) {
    return this.payrollService.list(user, { month: month ? Number(month) : undefined, year: year ? Number(year) : undefined, teacherId });
  }

  @Post("payslips/:id/adjust")
  @Roles("SUPER_ADMIN", "ADMIN")
  adjust(@Param("id") id: string, @Body(new ZodValidationPipe(adjustPayslipSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.adjust(id, dto.lopDays, user.sub);
  }

  @Post("payslips/:id/pay")
  @Roles("SUPER_ADMIN", "ADMIN")
  pay(@Param("id") id: string, @Body(new ZodValidationPipe(payPayslipSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.markPaid(id, dto, user.sub);
  }

  @Delete("payslips/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  remove(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.remove(id, user.sub);
  }

  @Get("payslips/:id/pdf")
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  async pdf(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { pdf, filename } = await this.payrollService.renderPdf(id, user);
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Length": pdf.length });
    res.end(pdf);
  }
}
