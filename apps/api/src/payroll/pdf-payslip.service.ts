import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import { roundMoney } from "../common/money";
import { rupeesInWords } from "./payroll-calc";

export interface PayslipPdfData {
  school: { name: string; address: string | null; phone: string | null };
  teacher: { name: string; employeeId: string; designation: string | null; department: string | null; joiningDate: string };
  month: number; year: number;
  basic: number; hra: number; da: number; otherAllowances: number;
  pfPercent: number; professionalTax: number; otherDeductions: number;
  workingDays: number; lopDays: number;
  grossEarned: number; pfAmount: number; totalDeductions: number; netPay: number;
  status: string; paidOn: string | null; paymentMode: string | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const NAVY = "#0B1F3A";
const inr = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (iso: string | null) => (iso ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "-");

@Injectable()
export class PdfPayslipService {
  render(d: PayslipPdfData): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
    const W = doc.page.width, L = 50, R = W - 50, mid = W / 2;

    doc.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text(d.school.name, L, 50, { align: "center", width: R - L });
    const addr = [d.school.address, d.school.phone].filter(Boolean).join("  |  ");
    if (addr) doc.font("Helvetica").fontSize(9).fillColor("#525252").text(addr, L, doc.y + 2, { align: "center", width: R - L });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY).text(`PAYSLIP - ${MONTHS[d.month - 1].toUpperCase()} ${d.year}`, L, doc.y + 14, { align: "center", width: R - L });
    doc.moveTo(L, doc.y + 8).lineTo(R, doc.y + 8).lineWidth(1).strokeColor("#D4AF37").stroke();

    // Employee block
    let y = doc.y + 22;
    const info: [string, string][] = [
      ["Employee name", d.teacher.name], ["Employee ID", d.teacher.employeeId],
      ["Designation", d.teacher.designation || "-"], ["Department", d.teacher.department || "-"],
      ["Date of joining", fmtDate(d.teacher.joiningDate)], ["Paid days", `${roundMoney(d.workingDays - d.lopDays)} of ${d.workingDays}`],
    ];
    info.forEach(([k, v], i) => {
      const x = i % 2 === 0 ? L : mid + 10;
      const yy = y + Math.floor(i / 2) * 20;
      doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text(k, x, yy, { width: 90 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111111").text(v, x + 92, yy - 1, { width: mid - L - 100 });
    });
    y += 3 * 20 + 14;

    // Earnings | Deductions
    const colW = (R - L) / 2 - 8;
    const gross = d.basic + d.hra + d.da + d.otherAllowances;
    const lopAmount = roundMoney(gross - d.grossEarned);
    const earnings: [string, number][] = [["Basic", d.basic], ["House rent allowance", d.hra], ["Dearness allowance", d.da], ["Other allowances", d.otherAllowances]];
    if (lopAmount > 0) earnings.push([`Less: loss of pay (${d.lopDays} day${d.lopDays === 1 ? "" : "s"})`, -lopAmount]);
    const deductions: [string, number][] = [[`Provident fund${d.pfPercent ? ` (${d.pfPercent}%)` : ""}`, d.pfAmount], ["Professional tax", d.professionalTax], ["Other deductions", d.otherDeductions]];

    const header = (label: string, x: number) => {
      doc.rect(x, y, colW, 22).fill(NAVY);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#FFFFFF").text(label, x + 8, y + 6);
    };
    header("EARNINGS", L); header("DEDUCTIONS", L + colW + 16);
    const rows = Math.max(earnings.length, deductions.length);
    const row = (items: [string, number][], x: number, i: number, yy: number) => {
      if (i % 2 === 0) doc.rect(x, yy, colW, 22).fill("#F5F7FA");
      if (!items[i]) return;
      doc.font("Helvetica").fontSize(9.5).fillColor("#111111").text(items[i][0], x + 8, yy + 6, { width: colW - 100 });
      doc.font("Helvetica").fillColor(items[i][1] < 0 ? "#B91C1C" : "#111111").text(inr(items[i][1]), x + colW - 92, yy + 6, { width: 84, align: "right" });
    };
    for (let i = 0; i < rows; i++) { row(earnings, L, i, y + 22 + i * 22); row(deductions, L + colW + 16, i, y + 22 + i * 22); }
    const ty = y + 22 + rows * 22;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY);
    doc.text("Gross earnings", L + 8, ty + 8, { width: colW - 100 }); doc.text(inr(d.grossEarned), L + colW - 92, ty + 8, { width: 84, align: "right" });
    doc.text("Total deductions", L + colW + 24, ty + 8, { width: colW - 100 }); doc.text(inr(d.totalDeductions), L + 2 * colW + 16 - 92, ty + 8, { width: 84, align: "right" });
    doc.moveTo(L, ty + 4).lineTo(R, ty + 4).lineWidth(0.5).strokeColor("#B8C2D0").stroke();

    // Net pay
    const ny = ty + 40;
    doc.roundedRect(L, ny, R - L, 50, 6).fill("#EEF3FA");
    doc.font("Helvetica").fontSize(9).fillColor("#6B7280").text("NET PAY", L + 14, ny + 9);
    doc.font("Helvetica-Bold").fontSize(18).fillColor(NAVY).text(inr(d.netPay), L + 14, ny + 22);
    doc.font("Helvetica").fontSize(9).fillColor("#525252").text(rupeesInWords(d.netPay), L + 200, ny + 20, { width: R - L - 214, align: "right" });

    doc.font("Helvetica").fontSize(9).fillColor("#525252").text(
      d.status === "PAID" ? `Paid on ${fmtDate(d.paidOn)}${d.paymentMode ? ` by ${d.paymentMode.replace(/_/g, " ").toLowerCase()}` : ""}.` : "Payment pending.",
      L, ny + 66,
    );
    doc.fontSize(8).fillColor("#888888").text("This is a computer-generated payslip and does not require a signature.", L, doc.page.height - 70, { align: "center", width: R - L });
    doc.end();
    return done;
  }
}
