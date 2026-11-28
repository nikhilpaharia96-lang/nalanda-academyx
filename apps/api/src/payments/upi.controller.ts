import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { UpiService } from "./upi.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

const claimSchema = z.object({
  studentFeeId: z.string().optional(),
  extraFeeId: z.string().optional(),
  utr: z.string().min(1).max(40),
  amount: z.number().positive().max(10_000_000),
});
const creditSchema = z.object({ utr: z.string().min(1).max(40), amount: z.number().positive().max(10_000_000) });
const rejectSchema = z.object({ reason: z.string().max(300).optional() });

@Controller("upi")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpiController {
  constructor(private readonly upi: UpiService) {}

  // Parent / student: submit "I paid via UPI, UTR is ..."
  @Post("claims")
  @Roles("STUDENT", "PARENT")
  submit(@Body(new ZodValidationPipe(claimSchema)) dto: z.infer<typeof claimSchema>, @CurrentUser() user: AuthenticatedUser) {
    return this.upi.submitClaim(dto, user);
  }

  @Get("claims/mine")
  @Roles("STUDENT", "PARENT")
  mine(@CurrentUser() user: AuthenticatedUser) {
    return this.upi.myClaims(user);
  }

  // Admin / accounts: type the UTR + amount seen in the bank statement. Matching claims approve automatically.
  @Post("credits")
  @Roles("SUPER_ADMIN", "ADMIN")
  addCredit(@Body(new ZodValidationPipe(creditSchema)) dto: z.infer<typeof creditSchema>, @CurrentUser() user: AuthenticatedUser) {
    return this.upi.addCredit(dto, user.sub);
  }

  @Get("credits")
  @Roles("SUPER_ADMIN", "ADMIN")
  credits() {
    return this.upi.listCredits();
  }

  @Get("claims")
  @Roles("SUPER_ADMIN", "ADMIN")
  claims(@Query("status") status?: string) {
    return this.upi.listClaims(status);
  }

  @Post("claims/:id/reject")
  @Roles("SUPER_ADMIN", "ADMIN")
  reject(@Param("id") id: string, @Body(new ZodValidationPipe(rejectSchema)) dto: z.infer<typeof rejectSchema>, @CurrentUser() user: AuthenticatedUser) {
    return this.upi.reject(id, dto.reason, user.sub);
  }
}
