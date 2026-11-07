import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { transportAssignSchema, transportRouteSchema, transportRouteUpdateSchema, transportStopSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { TransportService } from "./transport.service";

@Controller("transport")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get("routes")
  @Roles("SUPER_ADMIN", "ADMIN")
  listRoutes() {
    return this.transportService.listRoutes();
  }

  @Post("routes")
  @Roles("SUPER_ADMIN", "ADMIN")
  createRoute(@Body(new ZodValidationPipe(transportRouteSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.createRoute(dto, user.sub);
  }

  @Patch("routes/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  updateRoute(@Param("id") id: string, @Body(new ZodValidationPipe(transportRouteUpdateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.updateRoute(id, dto, user.sub);
  }

  @Post("routes/:id/stops")
  @Roles("SUPER_ADMIN", "ADMIN")
  addStop(@Param("id") id: string, @Body(new ZodValidationPipe(transportStopSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.addStop(id, dto, user.sub);
  }

  @Delete("stops/:id")
  @Roles("SUPER_ADMIN", "ADMIN")
  deleteStop(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.deleteStop(id, user.sub);
  }

  @Get("routes/:id/riders")
  @Roles("SUPER_ADMIN", "ADMIN")
  riders(@Param("id") id: string) {
    return this.transportService.riders(id);
  }

  @Post("assignments")
  @Roles("SUPER_ADMIN", "ADMIN")
  assign(@Body(new ZodValidationPipe(transportAssignSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.assign(dto, user.sub);
  }

  @Post("assignments/:id/end")
  @Roles("SUPER_ADMIN", "ADMIN")
  end(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.endAssignment(id, user.sub);
  }

  @Get("student/:studentId")
  forStudent(@Param("studentId") studentId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.transportService.forStudent(studentId, user);
  }
}
