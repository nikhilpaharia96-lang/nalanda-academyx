import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";
import { ReceiptsService } from "./receipts.service";
import { UpiController } from "./upi.controller";
import { UpiService } from "./upi.service";
import { PdfReceiptService } from "./pdf-receipt.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { StoreModule } from "../store/store.module";

@Module({
  imports: [NotificationsModule, StoreModule],
  controllers: [PaymentsController, UpiController],
  providers: [PaymentsService, UpiService, RazorpayService, ReceiptsService, PdfReceiptService],
})
export class PaymentsModule {}
