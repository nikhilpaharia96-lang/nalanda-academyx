import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema, recordOfflinePaymentSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("razorpay/order")
  @UseGuards(JwtAuthGuard)
  createOrder(@Body(new ZodValidationPipe(createRazorpayOrderSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.createRazorpayOrder(dto, user);
  }

  @Post("razorpay/verify")
  @UseGuards(JwtAuthGuard)
  verify(@Body(new ZodValidationPipe(verifyRazorpayPaymentSchema)) dto: any) {
    return this.paymentsService.verifyRazorpayPayment(dto);
  }

  // Razorpay calls this directly — no user session, verified purely by the
  // webhook HMAC signature over the raw request body.
  @Post("razorpay/webhook")
  async webhook(@Req() req: Request, @Headers("x-razorpay-signature") signature: string) {
    const rawBody = (req as any).rawBody?.toString("utf8");
    if (!rawBody) throw new BadRequestException("Missing request body");
    return this.paymentsService.handleWebhook(rawBody, signature);
  }

  @Post("offline")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  recordOffline(@Body(new ZodValidationPipe(recordOfflinePaymentSchema)) dto: any, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.recordOfflinePayment(dto, user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  list(@Query("status") status?: string, @Query("studentId") studentId?: string) {
    return this.paymentsService.listPayments({ status, studentId });
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("STUDENT", "PARENT")
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listMyPayments(user);
  }

  @Get(":id/receipt")
  @UseGuards(JwtAuthGuard)
  getReceipt(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getReceipt(id, user);
  }
}
