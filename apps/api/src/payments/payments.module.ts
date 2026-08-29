import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayService } from "./razorpay.service";
import { ReceiptsService } from "./receipts.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService, ReceiptsService],
})
export class PaymentsModule {}
