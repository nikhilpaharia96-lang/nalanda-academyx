import { Module } from "@nestjs/common";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";

// Pre-existing bug fix (unrelated to Exams & Results): DashboardService was
// never registered as a provider here, so the whole Nest application failed
// to boot at all (DashboardController's constructor dependency could not be
// resolved). Fixed as a minimal, behavior-preserving change so the app can
// start — required to verify the new Exams & Results module end-to-end.
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
