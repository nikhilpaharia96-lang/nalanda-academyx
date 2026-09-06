import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type { ReceiptsService } from "./receipts.service";

function formatINR(amount: number | null): string {
  if (amount === null || amount === undefined) return "—";
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function row(doc: PDFKit.PDFDocument, label: string, value: string, y: number) {
  doc.font("Helvetica").fontSize(10).fillColor("#525252").text(label, 50, y);
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0B1F3A").text(value, 260, y, { width: 285, align: "left" });
}

/** Generates a real, server-rendered PDF receipt from the same data the
 * in-app receipt view uses (ReceiptsService#getFullReceipt) — never
 * fabricated on the client. Returns a Buffer so the controller can stream
 * it straight back as `application/pdf`. */
@Injectable()
export class PdfReceiptService {
  async render(receipt: NonNullable<Awaited<ReturnType<ReceiptsService["getFullReceipt"]>>>): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill("#0B1F3A");
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(20).text(receipt.school.name, 50, 28);
    doc.font("Helvetica").fontSize(9).fillColor("#D4AF37").text("Fee Payment Receipt", 50, 54);
    const addressLine = [receipt.school.address, receipt.school.phone, receipt.school.email].filter(Boolean).join("   •   ");
    if (addressLine) doc.font("Helvetica").fontSize(8).fillColor("#C9D2E0").text(addressLine, 50, 70, { width: 495 });

    doc.fillColor("#0B1F3A");
    let y = 115;
    doc.font("Helvetica-Bold").fontSize(12).text(`Receipt No: ${receipt.receiptNumber ?? "—"}`, 50, y);
    doc.font("Helvetica").fontSize(10).fillColor("#525252").text(`Date: ${receipt.paymentDate?.slice(0, 10) ?? "—"}`, 350, y, { width: 195, align: "right" });

    y += 35;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#E5E5E5").stroke();
    y += 20;

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0B1F3A").text("Student Details", 50, y);
    y += 20;
    if (receipt.student) {
      row(doc, "Student Name", receipt.student.name, y);
      y += 18;
      row(doc, "Student ID", receipt.student.studentId, y);
      y += 18;
      row(doc, "Admission No.", receipt.student.admissionNumber, y);
      y += 18;
    }
    if (receipt.class) {
      row(doc, "Class / Section", `${receipt.class}${receipt.section ? " - " + receipt.section : ""}`, y);
      y += 18;
    }
    if (receipt.academicYear) {
      row(doc, "Academic Year", receipt.academicYear, y);
      y += 18;
    }

    y += 12;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#E5E5E5").stroke();
    y += 20;

    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0B1F3A").text("Payment Details", 50, y);
    y += 20;
    row(doc, "Fee Type", receipt.feeType ?? "—", y);
    y += 18;
    if (receipt.feeMonth) {
      row(doc, "Month", String(receipt.feeMonth), y);
      y += 18;
    }
    row(doc, "Payment Method", receipt.paymentCategory === "Offline" ? `Offline - ${receipt.method}` : "Online - Razorpay", y);
    y += 18;
    row(doc, "Transaction / Payment ID", receipt.transactionId ?? "—", y);
    y += 18;
    if (receipt.orderId) {
      row(doc, "Order ID", receipt.orderId, y);
      y += 18;
    }
    if (receipt.referenceNote) {
      row(doc, "Reference No.", receipt.referenceNote, y);
      y += 18;
    }
    if (receipt.chequeNumber) {
      row(doc, "Cheque No.", receipt.chequeNumber, y);
      y += 18;
    }
    if (receipt.bankName) {
      row(doc, "Bank", receipt.bankName, y);
      y += 18;
    }
    if (receipt.receivedByName) {
      row(doc, "Received By", receipt.receivedByName, y);
      y += 18;
    }

    y += 12;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#E5E5E5").stroke();
    y += 20;

    // Amount box
    doc.rect(50, y, 495, 70).fill("#F5F0E1");
    doc.fillColor("#0B1F3A").font("Helvetica-Bold").fontSize(11).text("Amount Paid", 70, y + 14);
    doc.font("Helvetica-Bold").fontSize(22).text(formatINR(receipt.amount), 70, y + 32);
    if (receipt.totalFeeAmount !== null && receipt.remainingAfterThisPayment !== null && receipt.remainingAfterThisPayment > 0.01) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#8a6d1a")
        .text(
          `Partial payment — Total fee: ${formatINR(receipt.totalFeeAmount)}  |  Paid to date: ${formatINR(receipt.paidToDate)}  |  Remaining: ${formatINR(receipt.remainingAfterThisPayment)}`,
          320,
          y + 30,
          { width: 210 },
        );
    } else {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#166534").text("PAID IN FULL", 380, y + 30, { width: 150, align: "right" });
    }
    y += 90;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#9CA3AF")
      .text("This is a computer-generated receipt and does not require a signature.", 50, y, { width: 495, align: "center" });
    doc.text(`Generated ${receipt.generatedAt ?? new Date().toISOString()}`, 50, y + 12, { width: 495, align: "center" });

    doc.end();
    return done;
  }
}
