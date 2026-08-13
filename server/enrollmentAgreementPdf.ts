import PDFDocument from "pdfkit";

export interface EnrollmentAgreementPdfInput {
  memberName: string;
  studentName?: string | null;
  packageName: string;
  monthlyPrice: number;
  totalDueToday: number;
  signedAt: Date;
  signatureName?: string | null;
  signatureImage?: Buffer | null;
}

const AGREEMENT_VERSION = "2026-08";

const sections = [
  ["1. Membership Terms", "Member enrolls in the selected MyDojo program at the monthly rate shown in this agreement. Monthly billing continues on a recurring basis until cancelled in accordance with the cancellation policy. Membership fees are non-refundable once the billing period has begun."],
  ["2. Cancellation Policy — 30-Day Written Notice", "You may cancel by submitting a written cancellation request at least 30 days before the next billing date. Requests may be submitted in person at the front desk, by email to info@mydojoma.com, or through the Member Portal. One final monthly payment may be processed to satisfy the notice period. Failure to attend classes does not constitute cancellation."],
  ["3. Membership Freeze Policy", "Members in good standing may request a temporary freeze for travel, medical leave, or another qualifying reason. Requests must be submitted in writing at least 7 days before the requested start date. The minimum freeze is one month and the maximum is three consecutive months per calendar year, subject to MyDojo approval."],
  ["4. Assumption of Risk", "Martial arts, kickboxing, and fitness training involve inherent risks, including physical contact, sprains, strains, fractures, bruises, cardiovascular stress, slips, falls, and impact from training equipment. The signer voluntarily assumes the known and unknown risks associated with participation."],
  ["5. Release of Liability", "In consideration for participation, the signer releases, waives, and discharges MyDojo Martial Arts & Fitness, its owners, directors, officers, employees, instructors, and agents from claims arising from loss, damage, injury, or death related to participation or presence on the premises, to the extent permitted by law."],
  ["6. Medical Authorization", "The signer certifies that the participant is in suitable physical condition for training and authorizes MyDojo staff to secure emergency medical treatment when necessary. The signer remains financially responsible for resulting medical costs."],
  ["7. Photo & Media Consent", "The signer grants MyDojo permission to photograph or record the participant during classes, events, and activities for promotional, educational, and marketing purposes, unless the signer provides written notice to the front desk declining consent."],
  ["8. Code of Conduct", "Members are expected to demonstrate respect, discipline, and sportsmanship. MyDojo may suspend or terminate membership without refund for disruptive, disrespectful, or unsafe conduct."],
  ["9. Governing Law", "This agreement is governed by applicable law. If any provision is unenforceable, the remaining provisions remain in effect."],
] as const;

export function getEnrollmentAgreementVersion() {
  return AGREEMENT_VERSION;
}

export async function renderEnrollmentAgreementPdf(input: EnrollmentAgreementPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 54, bufferPages: true, info: { Title: "MyDojo Signed Enrollment Agreement", Author: "MyDojo Martial Arts & Fitness" } });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const divider = () => {
      doc.moveTo(54, doc.y).lineTo(558, doc.y).strokeColor("#dedede").stroke();
      doc.moveDown(0.6);
    };
    const ensureSpace = (height: number) => {
      if (doc.y + height > 720) doc.addPage();
    };

    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(21).text("MYDOJO", { align: "center" });
    doc.fillColor("#E11D2A").fontSize(13).text("SIGNED ENROLLMENT AGREEMENT", { align: "center" });
    doc.fillColor("#6b7280").font("Helvetica").fontSize(9).text(`Agreement version ${AGREEMENT_VERSION}`, { align: "center" });
    doc.moveDown(1.3);

    doc.roundedRect(54, doc.y, 504, 104, 8).fillAndStroke("#fff7f7", "#fecaca");
    const summaryTop = doc.y + 15;
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(12).text(input.packageName, 72, summaryTop);
    doc.font("Helvetica").fontSize(9).fillColor("#4b5563").text(`Member: ${input.memberName}`, 72, summaryTop + 22);
    if (input.studentName && input.studentName !== input.memberName) doc.text(`Student: ${input.studentName}`, 72, summaryTop + 36);
    doc.text(`Monthly rate: $${input.monthlyPrice.toFixed(2)}`, 318, summaryTop + 22, { width: 220, align: "right" });
    doc.font("Helvetica-Bold").fillColor("#111827").text(`Due today: $${input.totalDueToday.toFixed(2)}`, 318, summaryTop + 40, { width: 220, align: "right" });
    doc.y = summaryTop + 120;

    for (const [title, body] of sections) {
      ensureSpace(86);
      divider();
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(title);
      doc.moveDown(0.35);
      doc.fillColor("#374151").font("Helvetica").fontSize(9.5).lineGap(2).text(body, { width: 504 });
      doc.moveDown(0.75);
    }

    ensureSpace(170);
    divider();
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(12).text("Electronic Signature Record");
    doc.moveDown(0.5);
    if (input.signatureImage) {
      doc.roundedRect(54, doc.y, 250, 88, 6).strokeColor("#d1d5db").stroke();
      doc.image(input.signatureImage, 66, doc.y + 10, { fit: [226, 66], align: "center", valign: "center" });
      doc.y += 98;
    }
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text(`Signed by: ${input.signatureName || input.memberName}`);
    doc.fillColor("#4b5563").font("Helvetica").fontSize(9).text(`Recorded: ${input.signedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`);
    doc.moveDown(0.5);
    doc.fillColor("#6b7280").fontSize(8).text("The signer acknowledged they read, understood, and agreed to the Enrollment Agreement, Liability Waiver, and Photo Consent. This PDF preserves the agreement record and handwritten signature image submitted during enrollment.");

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i += 1) {
      doc.switchToPage(i);
      doc.fillColor("#9ca3af").font("Helvetica").fontSize(8).text(`MyDojo Martial Arts & Fitness · Signed Enrollment Agreement · Page ${i + 1} of ${range.count}`, 54, 744, { width: 504, align: "center" });
    }
    doc.end();
  });
}
