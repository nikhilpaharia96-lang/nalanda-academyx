import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { ResultsService } from "./results.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createYearSchema = z.object({
  year: z.number().int().min(2017).max(2026),
  academicYearId: z.string().optional(),
  totalStudents: z.number().int().optional(),
  appeared: z.number().int().optional(),
  passed: z.number().int().optional(),
  passPercentage: z.number().optional(),
  distinction: z.number().int().optional(),
  starMarks: z.number().int().optional(),
});
const updateYearSchema = z.object({
  totalStudents: z.number().int().optional(),
  appeared: z.number().int().optional(),
  passed: z.number().int().optional(),
  passPercentage: z.number().optional(),
  distinction: z.number().int().optional(),
  starMarks: z.number().int().optional(),
  published: z.boolean().optional(),
});
const addResultSchema = z.object({
  resultYearId: z.string().min(1),
  studentId: z.string().optional(),
  studentName: z.string().min(1),
  percentage: z.number().min(0).max(100),
  grade: z.string().optional(),
  achievement: z.string().optional(),
});

// Aggregate year-level results (listYears/getYear) are PUBLIC — the school's
// results page is a standard public page — but published-gated for
// non-admins. Per-student results (getStudentResults) stay fully private
// and ownership-checked; they are never exposed to anonymous callers.
@Controller("results")
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get("years")
  @UseGuards(OptionalJwtAuthGuard)
  listYears(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.resultsService.listYears(user);
  }

  @Get("years/:year")
  @UseGuards(OptionalJwtAuthGuard)
  getYear(@Param("year") year: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.resultsService.getYear(Number(year), user);
  }

  @Post("years")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  createYear(@Body(new ZodValidationPipe(createYearSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.resultsService.createYear(dto, user.sub);
  }

  @Patch("years/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  updateYear(@Param("id") id: string, @Body(new ZodValidationPipe(updateYearSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.resultsService.updateYear(id, dto, user.sub);
  }

  @Post("student-results")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  addStudentResult(@Body(new ZodValidationPipe(addResultSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.resultsService.addStudentResult(dto, user.sub);
  }

  @Get("student/:studentId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  getStudentResults(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.resultsService.getStudentResults(studentId, user);
  }
}
