import { Module } from "@nestjs/common";
import { PayrollController } from "./payroll.controller";
import { PayrollService } from "./payroll.service";
import { PdfPayslipService } from "./pdf-payslip.service";

@Module({ controllers: [PayrollController], providers: [PayrollService, PdfPayslipService] })
export class PayrollModule {}
