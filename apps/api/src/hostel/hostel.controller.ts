import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { hostelAllocateSchema, hostelSchema, hostelUpdateSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { HostelService } from "./hostel.service";

@Controller("hostels")
@UseGuards(JwtAuthGuard, RolesGuard)
export class HostelController {
  constructor(private readonly hostelService: HostelService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN")
  list() {
    return this.hostelService.list();
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  create(@Body(new ZodValidationPipe(hostelSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.hostelService.create(dto, user.sub);
  }

  @Patch(":id")
  @Roles("SUPER_ADMIN", "ADMIN")
  update(@Param("id") id: string, @Body(new ZodValidationPipe(hostelUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.hostelService.update(id, dto, user.sub);
  }

  @Get(":id/residents")
  @Roles("SUPER_ADMIN", "ADMIN")
  residents(@Param("id") id: string) {
    return this.hostelService.residents(id);
  }

  @Post("allocations")
  @Roles("SUPER_ADMIN", "ADMIN")
  allocate(@Body(new ZodValidationPipe(hostelAllocateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.hostelService.allocate(dto, user.sub);
  }

  @Post("allocations/:id/vacate")
  @Roles("SUPER_ADMIN", "ADMIN")
  vacate(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.hostelService.vacate(id, user.sub);
  }

  @Get("student/:studentId")
  forStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.hostelService.forStudent(studentId, user);
  }
}
