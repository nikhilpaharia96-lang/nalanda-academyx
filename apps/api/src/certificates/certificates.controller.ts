import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { cancelCertificateSchema, issueCertificateSchema } from "@nalanda/shared";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";
import { CertificatesService } from "./certificates.service";

function sendPdf(res: Response, pdf: Buffer, filename: string) {
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Length": pdf.length });
  res.end(pdf);
}

@Controller("certificates")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get()
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  list(@CurrentUser() user: AuthenticatedUser, @Query("studentId") studentId?: string, @Query("type") type?: string, @Query("status") status?: string) {
    return this.certificatesService.list(user, { studentId, type, status });
  }

  @Post()
  @Roles("SUPER_ADMIN", "ADMIN")
  issue(@Body(new ZodValidationPipe(issueCertificateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.certificatesService.issue(dto, user.sub);
  }

  // NB: declared before ":id/pdf" so "id-cards" is never read as a certificate id.
  @Get("id-cards/pdf")
  @Roles("SUPER_ADMIN", "ADMIN")
  async idCards(@Res() res: Response, @Query("studentId") studentId?: string, @Query("classId") classId?: string, @Query("sectionId") sectionId?: string) {
    const pdf = await this.certificatesService.renderIdCards({ studentId, classId, sectionId });
    sendPdf(res, pdf, "id-cards.pdf");
  }

  @Get(":id/pdf")
  @Roles("SUPER_ADMIN", "ADMIN", "STUDENT", "PARENT")
  async pdf(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const { pdf, filename } = await this.certificatesService.renderPdf(id, user);
    sendPdf(res, pdf, filename);
  }

  @Post(":id/cancel")
  @Roles("SUPER_ADMIN", "ADMIN")
  cancel(@Param("id") id: string, @Body(new ZodValidationPipe(cancelCertificateSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.certificatesService.cancel(id, dto.reason, user.sub);
  }
}
