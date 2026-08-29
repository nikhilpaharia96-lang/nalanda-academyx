import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { StudentsService } from "./students.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createStudentSchema, updateStudentSchema, listStudentsQuerySchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN", "TEACHER")
  list(@Query(new ZodValidationPipe(listStudentsQuerySchema)) query: any) {
    return this.studentsService.list(query);
  }

  @Get(":id")
  // No @Roles restriction here — access is enforced by resource-ownership
  // checks inside the service (self for STUDENT, linked child for PARENT,
  // assigned class for TEACHER, unrestricted for ADMIN/SUPER_ADMIN). Never
  // trust the :id path param without this check.
  getById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.getByIdForUser(id, user);
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createStudentSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.create(dto, user.sub);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN")
  update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateStudentSchema)) dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.studentsService.update(id, dto, user.sub);
  }

  @Patch(":id/deactivate")
  @Roles("SUPER_ADMIN", "ADMIN")
  deactivate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.deactivate(id, user.sub);
  }
}
