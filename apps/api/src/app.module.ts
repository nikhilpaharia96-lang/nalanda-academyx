import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { StudentsModule } from "./students/students.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { AcademicsModule } from "./academics/academics.module";
import { TeachersModule } from "./teachers/teachers.module";
import { ParentsModule } from "./parents/parents.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AdmissionsModule } from "./admissions/admissions.module";
import { FeesModule } from "./fees/fees.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { ResultsModule } from "./results/results.module";
import { NoticesModule } from "./notices/notices.module";
import { EventsModule } from "./events/events.module";
import { FacultyModule } from "./faculty/faculty.module";
import { FacilitiesModule } from "./facilities/facilities.module";
import { DocumentsModule } from "./documents/documents.module";
import { MessagesModule } from "./messages/messages.module";
import { SettingsModule } from "./settings/settings.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CommonModule,
    AuthModule,
    StudentsModule,
    DashboardModule,
    AcademicsModule,
    TeachersModule,
    ParentsModule,
    AttendanceModule,
    AdmissionsModule,
    FeesModule,
    NotificationsModule,
    PaymentsModule,
    ResultsModule,
    NoticesModule,
    EventsModule,
    FacultyModule,
    FacilitiesModule,
    DocumentsModule,
    MessagesModule,
    SettingsModule,
    AuditLogsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
