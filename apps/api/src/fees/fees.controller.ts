import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { FeesService } from "./fees.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { FEE_FREQUENCIES, FEE_TYPES, waiveFeeSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createStructureSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
  // Omit to apply the fee to every section of the class.
  sectionId: z.string().min(1).optional(),
  feeType: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(FEE_FREQUENCIES),
  dueDay: z.number().int().min(1).max(28).optional(),
  description: z.string().optional(),
});
const updateStructureSchema = z.object({
  amount: z.number().positive().optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
  dueDay: z.number().int().min(1).max(28).optional(),
  sectionId: z.string().min(1).nullable().optional(),
});
const generateSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020),
  dueDate: z.string().date().optional(),
});
const createExtraFeeSchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().date(),
});
const overviewQuerySchema = z.object({
  academicYearId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  studentId: z.string().optional(),
  feeType: z.string().optional(),
  status: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
});
const breakdownQuerySchema = z.object({
  feeStructureId: z.string().min(1),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020),
});

@Controller("fees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  /** Reference list for the "Fee type" dropdown — not enforced strictly
   * server-side (feeType is stored as free text so schools can add their
   * own "Other" labels), but this gives the frontend the standard set. */
  @Get("types")
  listFeeTypes() {
    return FEE_TYPES;
  }

  @Get("structures")
  listStructures(
    @Query("academicYearId") academicYearId?: string,
    @Query("classId") classId?: string,
    @Query("sectionId") sectionId?: string,
    @Query("active") active?: string,
  ) {
    return this.feesService.listFeeStructures({
      academicYearId,
      classId,
      sectionId,
      active: active === undefined ? undefined : active === "true",
    });
  }

  @Post("structures")
  @Roles("SUPER_ADMIN", "ADMIN")
  createStructure(@Body(new ZodValidationPipe(createStructureSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.createFeeStructure(dto, user.sub);
  }

  @Patch("structures/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateStructure(@Param("id") id: string, @Body(new ZodValidationPipe(updateStructureSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.updateFeeStructure(id, dto, user.sub);
  }

  @Delete("structures/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  deleteStructure(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.deleteFeeStructure(id, user.sub);
  }

  @Post("structures/:id/generate")
  @Roles("SUPER_ADMIN", "ADMIN")
  generate(@Param("id") id: string, @Body(new ZodValidationPipe(generateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.generateFeesForPeriod(id, dto, user.sub);
  }

  @Get("student/:studentId")
  getStudentFees(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.getStudentFees(studentId, user);
  }

  // --- Admin dashboards ----------------------------------------------------

  @Get("admin/overview")
  @Roles("SUPER_ADMIN", "ADMIN")
  adminOverview(@Query(new ZodValidationPipe(overviewQuerySchema)) query: any) {
    return this.feesService.adminFeeOverview(query);
  }

  @Get("pending")
  @Roles("SUPER_ADMIN", "ADMIN")
  pending(@Query(new ZodValidationPipe(overviewQuerySchema)) query: any) {
    return this.feesService.pendingFees(query);
  }

  @Get("pending/breakdown")
  @Roles("SUPER_ADMIN", "ADMIN")
  pendingBreakdown(@Query(new ZodValidationPipe(breakdownQuerySchema)) query: any) {
    return this.feesService.pendingBreakdown(query.feeStructureId, query.month, query.year);
  }

  @Get("reports/summary")
  @Roles("SUPER_ADMIN", "ADMIN")
  reportsSummary(@Query(new ZodValidationPipe(overviewQuerySchema)) query: any) {
    return this.feesService.reportsSummary(query);
  }

  @Post("student-fees/:id/waive")
  @Roles("SUPER_ADMIN", "ADMIN")
  waive(@Param("id") id: string, @Body(new ZodValidationPipe(waiveFeeSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.waiveStudentFee(id, dto.reason, user.sub);
  }

  @Get("student-fees")
  @Roles("SUPER_ADMIN", "ADMIN")
  listAll(@Query("status") status?: string, @Query("classId") classId?: string) {
    return this.feesService.listAllStudentFees({ status, classId });
  }

  // --- Extra / one-off fees --------------------------------------------------

  @Get("extra")
  @Roles("SUPER_ADMIN", "ADMIN")
  listExtra(@Query("classId") classId?: string, @Query("status") status?: string) {
    return this.feesService.listExtraFees({ classId, status });
  }

  @Post("extra")
  @Roles("SUPER_ADMIN", "ADMIN")
  createExtra(@Body(new ZodValidationPipe(createExtraFeeSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.createExtraFee(dto, user.sub);
  }
}
