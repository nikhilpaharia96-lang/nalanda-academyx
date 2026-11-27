import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  attendxDecisionSchema,
  bindDeviceSchema,
  issueBindingCodeSchema,
  launchCheckSchema,
  startAttendxSessionSchema,
  submitCheckSchema,
} from "@nalanda/shared";
import { AttendxService } from "./attendx.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";

/** AttendX: proxy-resistant, session-based attendance. Every route names its roles; ownership is enforced in the service. */
@Controller("attendx")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendxController {
  constructor(private readonly attendx: AttendxService) {}

  // ---- admin: device enrolment
  @Post("binding-codes")
  @Roles("SUPER_ADMIN", "ADMIN")
  issueBindingCode(@Body(new ZodValidationPipe(issueBindingCodeSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.issueBindingCode(dto.studentId, user);
  }

  // ---- student: bind own device with an in-person code
  @Post("bind")
  @Roles("STUDENT")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  bind(@Body(new ZodValidationPipe(bindDeviceSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.bindDevice(dto, user);
  }

  // ---- teacher: session lifecycle
  @Post("sessions")
  @Roles("TEACHER")
  start(@Body(new ZodValidationPipe(startAttendxSessionSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.startSession(dto, user);
  }

  @Get("sessions/:id/qr")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  qr(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.getQr(id, user);
  }

  @Post("sessions/:id/checks")
  @Roles("TEACHER")
  launchCheck(@Param("id") id: string, @Body(new ZodValidationPipe(launchCheckSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.launchCheck(id, dto, user);
  }

  @Get("sessions/:id/live")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  live(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.getLive(id, user);
  }

  @Post("sessions/:id/close")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  close(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.closeSession(id, user);
  }

  @Get("sessions/:id/results")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  results(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.getResults(id, user);
  }

  @Post("sessions/:id/confirm")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  confirm(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.confirmProposed(id, user);
  }

  @Put("sessions/:id/students/:studentId/decision")
  @Roles("TEACHER", "SUPER_ADMIN", "ADMIN")
  decide(
    @Param("id") id: string,
    @Param("studentId") studentId: string,
    @Body(new ZodValidationPipe(attendxDecisionSchema)) dto: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.attendx.decide(id, studentId, dto, user);
  }

  // ---- student: checks
  @Get("checks/open")
  @Roles("STUDENT")
  openChecks(@CurrentUser() user: AuthenticatedUser) {
    return this.attendx.openChecks(user);
  }

  @Post("checks/:id/nonce")
  @Roles("STUDENT")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  nonce(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.requestNonce(id, user);
  }

  @Post("checks/:id/submit")
  @Roles("STUDENT")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  submit(@Param("id") id: string, @Body(new ZodValidationPipe(submitCheckSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.attendx.submit(id, dto, user);
  }
}
