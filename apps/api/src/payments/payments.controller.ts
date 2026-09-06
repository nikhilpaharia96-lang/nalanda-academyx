import { BadRequestException, Body, Controller, Get, Headers, NotFoundException, Param, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { PdfReceiptService } from "./pdf-receipt.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema, recordOfflinePaymentSchema } from "@nalanda/shared";
import type { AuthenticatedUser } from "../common/types/authenticated-user";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly pdfReceiptService: PdfReceiptService,
  ) {}

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

  /** Admin "Payments / Received Payments" dashboard — full filter set. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  list(
    @Query("status") status?: string,
    @Query("method") method?: string,
    @Query("studentId") studentId?: string,
    @Query("classId") classId?: string,
    @Query("sectionId") sectionId?: string,
    @Query("feeType") feeType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("search") search?: string,
  ) {
    return this.paymentsService.adminListPayments({ status, method, studentId, classId, sectionId, feeType, dateFrom, dateTo, search });
  }

  /** Admin "Receipts" screen — same filters as above, restricted to
   * successful payments (an unsuccessful attempt has no receipt to show). */
  @Get("receipts")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("SUPER_ADMIN", "ADMIN")
  receipts(
    @Query("method") method?: string,
    @Query("studentId") studentId?: string,
    @Query("classId") classId?: string,
    @Query("sectionId") sectionId?: string,
    @Query("feeType") feeType?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("search") search?: string,
  ) {
    return this.paymentsService.adminListPayments({ method, studentId, classId, sectionId, feeType, dateFrom, dateTo, search, onlyPaid: true });
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

  /** Downloadable PDF version of the same receipt — the student's "Download
   * Receipt" button, and also used by the admin Receipts screen. Ownership
   * is enforced by PaymentsService#getReceipt exactly like the JSON route. */
  @Get(":id/receipt/pdf")
  @UseGuards(JwtAuthGuard)
  async downloadReceiptPdf(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const receipt = await this.paymentsService.getReceipt(id, user);
    if (!receipt) throw new NotFoundException("Receipt not found");
    const pdf = await this.pdfReceiptService.render(receipt as any);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${receipt.receiptNumber ?? id}.pdf"`,
      "Content-Length": pdf.length,
    });
    res.end(pdf);
  }
}
