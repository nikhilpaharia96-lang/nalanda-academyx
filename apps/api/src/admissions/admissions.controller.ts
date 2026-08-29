import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { AdmissionsService } from "./admissions.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ADMISSION_STATUSES } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const createSchema = z.object({
  studentName: z.string().min(2),
  dateOfBirth: z.string().date(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  classId: z.string().min(1),
  previousSchool: z.string().optional(),
  parentName: z.string().min(2),
  parentPhone: z.string().min(6),
  parentEmail: z.string().email().optional(),
  address: z.string().optional(),
});
const statusSchema = z.object({ status: z.enum(ADMISSION_STATUSES) });

@Controller("admissions")
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  list(@Query("status") status?: string) {
    return this.admissionsService.list(status);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  getById(@Param("id") id: string) {
    return this.admissionsService.getById(id);
  }

  // Public-site submission endpoint — intentionally has NO auth guard, same
  // as a public admission form. Every other route in this controller is
  // admin-only via its own @UseGuards/@Roles.
  @Post()
  create(@Body(new ZodValidationPipe(createSchema)) dto: any) {
    return this.admissionsService.create(dto);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  updateStatus(@Param("id") id: string, @Body(new ZodValidationPipe(statusSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.admissionsService.updateStatus(id, dto.status, user.sub);
  }
}
