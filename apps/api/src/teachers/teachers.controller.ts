import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { TeachersService } from "./teachers.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(2),
  subject: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  joiningDate: z.string().date(),
});
const updateTeacherSchema = z.object({
  name: z.string().optional(),
  subject: z.string().optional(),
  department: z.string().optional(),
  qualification: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
const assignSchema = z.object({
  classId: z.string().min(1),
  sectionId: z.string().min(1),
  subject: z.string().min(1),
  academicYearId: z.string().min(1),
});

@Controller("teachers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN")
  list() {
    return this.teachersService.list();
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.getByIdForUser(id, user);
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createTeacherSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.create(dto, user.sub);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(updateTeacherSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.update(id, dto, user.sub);
  }

  @Get(":id/assignments")
  listAssignments(@Param("id") id: string) {
    return this.teachersService.listAssignments(id);
  }

  @Post(":id/assignments")
  @Roles("SUPER_ADMIN", "ADMIN")
  assign(@Param("id") id: string, @Body(new ZodValidationPipe(assignSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.assign(id, dto, user.sub);
  }

  @Delete("assignments/:assignmentId")
  @Roles("SUPER_ADMIN", "ADMIN")
  unassign(@Param("assignmentId") assignmentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.unassign(assignmentId, user.sub);
  }
}
