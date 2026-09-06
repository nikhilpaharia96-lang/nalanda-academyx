import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AcademicsService } from "./academics.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createYearSchema = z.object({ name: z.string().min(3), startDate: z.string().date(), endDate: z.string().date(), active: z.boolean().optional() });
const updateYearSchema = createYearSchema.partial();
const createClassSchema = z.object({ name: z.string().min(1), displayOrder: z.number().int().optional() });
const updateClassSchema = z.object({ name: z.string().optional(), displayOrder: z.number().int().optional(), active: z.boolean().optional() });
const createSectionSchema = z.object({ classId: z.string().min(1), name: z.string().min(1) });
const updateSectionSchema = z.object({ name: z.string().optional(), active: z.boolean().optional() });

// Read access is open to any authenticated role (teachers/students/parents all
// need class/section names for context); only ADMIN/SUPER_ADMIN can mutate.
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get("academic-years")
  listYears() {
    return this.academicsService.listAcademicYears();
  }

  @Post("academic-years")
  @Roles("SUPER_ADMIN", "ADMIN")
  createYear(@Body(new ZodValidationPipe(createYearSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.createAcademicYear(dto, user.sub);
  }

  @Patch("academic-years/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateYear(@Param("id") id: string, @Body(new ZodValidationPipe(updateYearSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.updateAcademicYear(id, dto, user.sub);
  }

  @Get("classes")
  listClasses() {
    return this.academicsService.listClasses();
  }

  @Post("classes")
  @Roles("SUPER_ADMIN", "ADMIN")
  createClass(@Body(new ZodValidationPipe(createClassSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.createClass(dto, user.sub);
  }

  @Patch("classes/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateClass(@Param("id") id: string, @Body(new ZodValidationPipe(updateClassSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.updateClass(id, dto, user.sub);
  }

  @Get("sections")
  listSections(@Query("classId") classId?: string) {
    return this.academicsService.listSections(classId);
  }

  @Post("sections")
  @Roles("SUPER_ADMIN", "ADMIN")
  createSection(@Body(new ZodValidationPipe(createSectionSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.createSection(dto, user.sub);
  }

  @Patch("sections/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateSection(@Param("id") id: string, @Body(new ZodValidationPipe(updateSectionSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.academicsService.updateSection(id, dto, user.sub);
  }
}
