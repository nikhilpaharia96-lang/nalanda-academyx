import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

export interface SchoolInfo { name: string; address: string | null; phone: string | null; email: string | null }

/** Student data frozen at the moment a certificate is issued. */
export interface StudentSnapshot {
  name: string;
  gender: string;
  fatherName: string | null;
  motherName: string | null;
  dateOfBirth: string;
  admissionNumber: string;
  admissionDate: string;
  className: string;
  sectionName: string;
  academicYear: string;
}

export interface CertificateData {
  certificateNumber: string;
  type: "BONAFIDE" | "TRANSFER" | "CHARACTER";
  issuedOn: string;
  purpose: string | null;
  reason: string | null;
  conduct: string | null;
  dateOfLeaving: string | null;
  remarks: string | null;
  status: string;
  snapshot: StudentSnapshot;
}

export interface IdCardData {
  name: string;
  className: string;
  sectionName: string;
  rollNumber: string;
  admissionNumber: string;
  dateOfBirth: string;
  fatherName: string | null;
  phone: string | null;
  academicYear: string;
}

const NAVY = "#0B1F3A";
const GOLD = "#D4AF37";

/** Indian dd-mm-yyyy. */
export const fmtDate = (iso: string | null | undefined) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? `${iso.slice(8, 10)}-${iso.slice(5, 7)}-${iso.slice(0, 4)}` : "—");

/** "Class 6" stays as is; a bare "6" or "Nursery" becomes "Class 6" / "Class Nursery". */
const withClass = (name: string) => (/^(class|std|grade)\b/i.test(name.trim()) ? name.trim() : `Class ${name.trim()}`);

function pronouns(gender: string) {
  const g = gender.toUpperCase();
  if (g === "MALE") return { rel: "S/o", he: "He", his: "his" };
  if (g === "FEMALE") return { rel: "D/o", he: "She", his: "her" };
  return { rel: "Ward of", he: "The student", his: "the student's" };
}

function collect(doc: PDFKit.PDFDocument) {
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  return new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
}

const TITLES = { BONAFIDE: "BONAFIDE CERTIFICATE", TRANSFER: "TRANSFER CERTIFICATE", CHARACTER: "CHARACTER CERTIFICATE" } as const;

@Injectable()
export class PdfCertificateService {
  async renderCertificate(c: CertificateData, school: SchoolInfo): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const done = collect(doc);
    const s = c.snapshot;
    const p = pronouns(s.gender);
    const W = doc.page.width;

    // Frame + header
    doc.rect(25, 25, W - 50, doc.page.height - 50).lineWidth(1.5).strokeColor(NAVY).stroke();
    doc.rect(30, 30, W - 60, doc.page.height - 60).lineWidth(0.5).strokeColor(GOLD).stroke();
    doc.font("Helvetica-Bold").fontSize(22).fillColor(NAVY).text(school.name, 60, 62, { align: "center", width: W - 120 });
    const addr = [school.address, school.phone, school.email].filter(Boolean).join("  |  ");
    if (addr) doc.font("Helvetica").fontSize(9).fillColor("#525252").text(addr, 60, doc.y + 4, { align: "center", width: W - 120 });
    doc.moveTo(60, doc.y + 10).lineTo(W - 60, doc.y + 10).lineWidth(1).strokeColor(GOLD).stroke();

    doc.font("Helvetica-Bold").fontSize(16).fillColor(NAVY).text(TITLES[c.type], 60, doc.y + 28, { align: "center", width: W - 120, underline: true });
    doc.font("Helvetica").fontSize(10).fillColor("#525252");
    const metaY = doc.y + 22;
    doc.text(`Certificate No: ${c.certificateNumber}`, 60, metaY);
    doc.text(`Date: ${fmtDate(c.issuedOn)}`, 60, metaY, { align: "right", width: W - 120 });

    doc.font("Helvetica").fontSize(12).fillColor("#111111");
    const cls = `${s.className}${s.sectionName ? " - " + s.sectionName : ""}`;
    doc.y = metaY + 40;

    if (c.type === "BONAFIDE") {
      doc.text(
        `This is to certify that ${s.name}${s.fatherName ? ` (${p.rel} ${s.fatherName})` : ""}, bearing Admission No. ${s.admissionNumber}, ` +
          `is a bonafide student of this school and is studying in ${withClass(s.className)}${s.sectionName ? " - " + s.sectionName : ""} during the academic year ${s.academicYear}. ` +
          `${p.his[0].toUpperCase() + p.his.slice(1)} date of birth as per the school records is ${fmtDate(s.dateOfBirth)}.`,
        { align: "justify", lineGap: 6, width: W - 120 },
      );
      doc.moveDown(1);
      doc.text(`This certificate is issued on request${c.purpose ? ` for the purpose of ${c.purpose}` : ""}.`, { align: "justify", lineGap: 6, width: W - 120 });
    } else if (c.type === "CHARACTER") {
      doc.text(
        `This is to certify that ${s.name}${s.fatherName ? ` (${p.rel} ${s.fatherName})` : ""}, Admission No. ${s.admissionNumber}, ` +
          `${s.academicYear ? `studied in this school, last in ${cls ? withClass(s.className) + (s.sectionName ? " - " + s.sectionName : "") : ""} (${s.academicYear}). ` : ""}` +
          `As far as the school records show, ${p.his} conduct and character during ${p.his} stay in the school have been ${(c.conduct || "Good").toLowerCase()}.`,
        { align: "justify", lineGap: 6, width: W - 120 },
      );
      if (c.purpose) { doc.moveDown(1); doc.text(`Issued for: ${c.purpose}.`, { lineGap: 6, width: W - 120 }); }
    } else {
      const rows: [string, string][] = [
        ["Name of the student", s.name],
        ["Father's name", s.fatherName || "—"],
        ["Mother's name", s.motherName || "—"],
        ["Date of birth", fmtDate(s.dateOfBirth)],
        ["Admission number", s.admissionNumber],
        ["Date of admission", fmtDate(s.admissionDate)],
        ["Class last studied", cls],
        ["Date of leaving", fmtDate(c.dateOfLeaving)],
        ["Reason for leaving", c.reason || "—"],
        ["General conduct", c.conduct || "Good"],
        ["Remarks", c.remarks || "—"],
      ];
      let y = doc.y;
      rows.forEach(([k, v], i) => {
        if (i % 2 === 0) doc.rect(60, y - 4, W - 120, 24).fill("#F5F7FA");
        doc.font("Helvetica").fontSize(10.5).fillColor("#525252").text(k, 70, y + 2, { width: 170 });
        doc.font("Helvetica-Bold").fillColor(NAVY).text(v, 250, y + 2, { width: W - 330 });
        y += 24;
      });
      doc.y = y + 10;
      doc.font("Helvetica").fontSize(10).fillColor("#525252").text("Certified that the above information is correct as per the school records.", 60, doc.y, { width: W - 120 });
    }

    // Signatures
    const sigY = doc.page.height - 150;
    doc.moveTo(60, sigY).lineTo(190, sigY).lineWidth(0.7).strokeColor("#888888").stroke();
    doc.moveTo(W - 190, sigY).lineTo(W - 60, sigY).stroke();
    doc.font("Helvetica").fontSize(10).fillColor("#525252").text("Class Teacher / Office", 60, sigY + 5, { width: 130, align: "center" });
    doc.text("Principal (with seal)", W - 190, sigY + 5, { width: 130, align: "center" });
    doc.fontSize(8).fillColor("#888888").text("Computer-generated certificate. Valid only with the school seal and signature.", 60, doc.page.height - 62, { align: "center", width: W - 120 });

    if (c.status === "CANCELLED") {
      doc.save().rotate(-30, { origin: [W / 2, 420] }).font("Helvetica-Bold").fontSize(90).fillColor("#DC2626").opacity(0.25).text("CANCELLED", 60, 380, { align: "center", width: W - 120 }).restore();
    }
    doc.end();
    return done;
  }

  /** A4 sheet(s) of CR80-size ID cards, 2 x 5 per page, ready to print and cut. */
  async renderIdCards(cards: IdCardData[], school: SchoolInfo): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const done = collect(doc);
    const CW = 243, CH = 153, GX = 18, GY = 7;
    const left = (doc.page.width - (CW * 2 + GX)) / 2;
    const top = 24;

    cards.forEach((c, i) => {
      if (i > 0 && i % 10 === 0) doc.addPage();
      const slot = i % 10;
      const x = left + (slot % 2) * (CW + GX);
      const y = top + Math.floor(slot / 2) * (CH + GY);

      doc.roundedRect(x, y, CW, CH, 6).lineWidth(0.8).strokeColor("#B8C2D0").stroke();
      doc.save().roundedRect(x, y, CW, 34, 6).clip().rect(x, y, CW, 34).fill(NAVY).restore();
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#FFFFFF").text(school.name, x + 8, y + 7, { width: CW - 16, align: "center", ellipsis: true, lineBreak: false });
      doc.font("Helvetica").fontSize(6.5).fillColor(GOLD).text(`STUDENT IDENTITY CARD  ·  ${c.academicYear}`, x + 8, y + 22, { width: CW - 16, align: "center", lineBreak: false });

      // Photo placeholder with initials
      doc.roundedRect(x + 9, y + 42, 56, 68, 4).fill("#EEF1F6");
      doc.font("Helvetica-Bold").fontSize(22).fillColor("#8A97AB").text(c.name.trim().slice(0, 1).toUpperCase(), x + 9, y + 62, { width: 56, align: "center", lineBreak: false });

      const lx = x + 74;
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor(NAVY).text(c.name, lx, y + 42, { width: CW - 82, ellipsis: true, lineBreak: false });
      const line = (label: string, value: string, yy: number) => {
        doc.font("Helvetica").fontSize(7).fillColor("#6B7280").text(label, lx, yy, { width: 52, lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#111111").text(value || "—", lx + 52, yy, { width: CW - 134, ellipsis: true, lineBreak: false });
      };
      line("Class", `${c.className}${c.sectionName ? " - " + c.sectionName : ""}   Roll ${c.rollNumber}`, y + 58);
      line("Adm. No.", c.admissionNumber, y + 70);
      line("DOB", fmtDate(c.dateOfBirth), y + 82);
      line("Father", c.fatherName || "—", y + 94);
      line("Phone", c.phone || "—", y + 106);

      doc.rect(x, y + CH - 24, CW, 24).fill("#F5F7FA");
      doc.font("Helvetica").fontSize(6).fillColor("#6B7280").text(
        [school.address, school.phone].filter(Boolean).join("  |  ") || "If found, please return to the school office.",
        x + 8, y + CH - 18, { width: CW - 16, align: "center", ellipsis: true, lineBreak: false },
      );
    });
    doc.end();
    return done;
  }
}
