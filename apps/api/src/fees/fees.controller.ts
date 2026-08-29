import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { FeesService } from "./fees.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { FEE_FREQUENCIES } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createStructureSchema = z.object({
  academicYearId: z.string().min(1),
  classId: z.string().min(1),
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
});
const generateSchema = z.object({ month: z.number().int().min(1).max(12), year: z.number().int().min(2020) });
const createExtraFeeSchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  dueDate: z.string().date(),
});

@Controller("fees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get("structures")
  listStructures(@Query("academicYearId") academicYearId?: string, @Query("classId") classId?: string) {
    return this.feesService.listFeeStructures({ academicYearId, classId });
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

  @Post("structures/:id/generate")
  @Roles("SUPER_ADMIN", "ADMIN")
  generate(@Param("id") id: string, @Body(new ZodValidationPipe(generateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.generateMonthlyFees(id, dto.month, dto.year, user.sub);
  }

  @Get("student/:studentId")
  getStudentFees(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.feesService.getStudentFees(studentId, user);
  }

  @Get("student-fees")
  @Roles("SUPER_ADMIN", "ADMIN")
  listAll(@Query("status") status?: string, @Query("classId") classId?: string) {
    return this.feesService.listAllStudentFees({ status, classId });
  }

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
