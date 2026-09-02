import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ExamsService } from "./exams.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import {
  createExamTypeSchema,
  updateExamTypeSchema,
  createSubjectSchema,
  updateSubjectSchema,
  assignClassSubjectSchema,
  createExamSchema,
  updateExamSchema,
  listExamsQuerySchema,
  bulkSaveResultsSchema,
  updateResultSchema,
} from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN"] as const;

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // -- Exam Types -----------------------------------------------------------

  @Get("exam-types")
  @Roles(...ADMIN_ROLES)
  listExamTypes() {
    return this.examsService.listExamTypes();
  }

  @Post("exam-types")
  @Roles(...ADMIN_ROLES)
  createExamType(@Body(new ZodValidationPipe(createExamTypeSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.createExamType(dto, user.sub);
  }

  @Patch("exam-types/:id")
  @Roles(...ADMIN_ROLES)
  updateExamType(@Param("id") id: string, @Body(new ZodValidationPipe(updateExamTypeSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.updateExamType(id, dto, user.sub);
  }

  // -- Subjects ---------------------------------------------------------------

  @Get("subjects")
  @Roles(...ADMIN_ROLES)
  listSubjects() {
    return this.examsService.listSubjects();
  }

  @Post("subjects")
  @Roles(...ADMIN_ROLES)
  createSubject(@Body(new ZodValidationPipe(createSubjectSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.createSubject(dto, user.sub);
  }

  @Patch("subjects/:id")
  @Roles(...ADMIN_ROLES)
  updateSubject(@Param("id") id: string, @Body(new ZodValidationPipe(updateSubjectSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.updateSubject(id, dto, user.sub);
  }

  @Get("class-subjects")
  @Roles(...ADMIN_ROLES)
  listClassSubjects(@Query("classId") classId: string) {
    return this.examsService.listClassSubjects(classId);
  }

  @Post("class-subjects")
  @Roles(...ADMIN_ROLES)
  assignClassSubject(@Body(new ZodValidationPipe(assignClassSubjectSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.assignClassSubject(dto, user.sub);
  }

  @Delete("class-subjects/:id")
  @Roles(...ADMIN_ROLES)
  removeClassSubject(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.removeClassSubject(id, user.sub);
  }

  // -- Results search / bulk entry (static paths — must be declared before
  // the "exams/:id" dynamic route below, so Nest doesn't try to match
  // "results" or "student" as an :id). -------------------------------------

  @Get("exams/results")
  @Roles(...ADMIN_ROLES)
  listResults(
    @Query("examId") examId?: string,
    @Query("classId") classId?: string,
    @Query("sectionId") sectionId?: string,
    @Query("subjectId") subjectId?: string,
    @Query("studentId") studentId?: string,
  ) {
    return this.examsService.listResults({ examId, classId, sectionId, subjectId, studentId });
  }

  @Post("exams/results/bulk")
  @Roles(...ADMIN_ROLES)
  bulkSaveResults(@Body(new ZodValidationPipe(bulkSaveResultsSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.bulkSaveResults(dto, user);
  }

  @Patch("exams/results/:id")
  @Roles(...ADMIN_ROLES)
  updateResult(@Param("id") id: string, @Body(new ZodValidationPipe(updateResultSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.updateResult(id, dto, user);
  }

  // -- Student self-service (ownership derived from the JWT, never from a
  // path/query param — see ExamsService.listMyExams / getMyMarksheet). Also
  // static paths, declared before "exams/:id". -----------------------------

  @Get("exams/student/results")
  @Roles("STUDENT")
  listMyExams(@CurrentUser() user: AuthenticatedUser) {
    return this.examsService.listMyExams(user);
  }

  @Get("exams/student/results/:examId")
  @Roles("STUDENT")
  getMyMarksheet(@Param("examId") examId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.getMyMarksheet(examId, user);
  }

  // -- Exams (admin CRUD + workflow) ------------------------------------------

  @Get("exams")
  @Roles(...ADMIN_ROLES)
  listExams(@Query(new ZodValidationPipe(listExamsQuerySchema)) query: any) {
    return this.examsService.listExams(query);
  }

  @Post("exams")
  @Roles(...ADMIN_ROLES)
  createExam(@Body(new ZodValidationPipe(createExamSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.createExam(dto, user.sub);
  }

  @Get("exams/:id")
  @Roles(...ADMIN_ROLES)
  getExam(@Param("id") id: string) {
    return this.examsService.getExamById(id);
  }

  @Patch("exams/:id")
  @Roles(...ADMIN_ROLES)
  updateExam(@Param("id") id: string, @Body(new ZodValidationPipe(updateExamSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.updateExam(id, dto, user.sub);
  }

  @Delete("exams/:id")
  @Roles(...ADMIN_ROLES)
  deleteExam(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.deleteExam(id, user.sub);
  }

  @Post("exams/:id/publish")
  @Roles(...ADMIN_ROLES)
  publishExam(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.publishExam(id, user.sub);
  }

  @Post("exams/:id/unpublish")
  @Roles(...ADMIN_ROLES)
  unpublishExam(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.examsService.unpublishExam(id, user.sub);
  }

  @Get("exams/:id/roster")
  @Roles(...ADMIN_ROLES)
  getRoster(@Param("id") id: string, @Query("subjectId") subjectId: string) {
    return this.examsService.getRoster(id, subjectId);
  }

  @Get("exams/:id/marksheet/:studentId")
  @Roles(...ADMIN_ROLES)
  getAdminMarksheet(@Param("id") id: string, @Param("studentId") studentId: string) {
    return this.examsService.getAdminMarksheet(id, studentId);
  }
}
