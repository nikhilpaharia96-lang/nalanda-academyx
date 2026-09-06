import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { ParentsService } from "./parents.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createParentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  name: z.string().min(2),
  phone: z.string().min(6),
  address: z.string().optional(),
});
const linkStudentSchema = z.object({
  studentId: z.string().min(1),
  relationship: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"]),
  isPrimary: z.boolean().optional(),
});

@Controller("parents")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN")
  list() {
    return this.parentsService.list();
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.getByIdForUser(id, user);
  }

  @Get(":id/children")
  getChildren(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.getChildren(id, user);
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(createParentSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.create(dto, user.sub);
  }

  @Post(":id/children")
  @Roles("SUPER_ADMIN", "ADMIN")
  linkStudent(@Param("id") id: string, @Body(new ZodValidationPipe(linkStudentSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.linkStudent(id, dto, user.sub);
  }

  @Delete("children/:linkId")
  @Roles("SUPER_ADMIN", "ADMIN")
  unlinkStudent(@Param("linkId") linkId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.parentsService.unlinkStudent(linkId, user.sub);
  }
}
