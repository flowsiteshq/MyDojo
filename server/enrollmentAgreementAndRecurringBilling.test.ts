import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";
import { renderEnrollmentAgreementPdf } from "./enrollmentAgreementPdf";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

function crc32(buffer: Buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function drawnSignaturePng() {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  const rawRgbaScanline = Buffer.from([0, 10, 10, 10, 255]);
  return Buffer.concat([
    Buffer.from("89504e470d0a1a0a", "hex"),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(rawRgbaScanline)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("handwritten enrollment agreement records", () => {
  it("captures a drawn signature and renders a stored PDF agreement", () => {
    const agreement = read("client/src/components/EnrollmentAgreement.tsx");
    const pdf = read("server/enrollmentAgreementPdf.ts");
    const router = read("server/routers.ts");

    expect(agreement).toContain('import SignatureCanvas from "react-signature-canvas"');
    expect(agreement).toContain("signatureDataUrl");
    expect(agreement).toContain("Handwritten Signature");
    expect(pdf).toContain("SIGNED ENROLLMENT AGREEMENT");
    expect(router).toContain("agreementSignatureImageUrl");
    expect(router).toContain("agreementPdfUrl");
  });

  it("renders a valid agreement PDF with a drawn signature image", async () => {
    const pdf = await renderEnrollmentAgreementPdf({
      memberName: "Test Member",
      studentName: "Test Student",
      packageName: "Foundation Program",
      monthlyPrice: 149,
      totalDueToday: 298,
      signedAt: new Date("2026-08-13T12:00:00.000Z"),
      signatureName: "Test Member",
      signatureImage: drawnSignaturePng(),
    });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1_000);
  });
});

describe("recurring membership payment handling", () => {
  it("uses saved-method authorization and retains only display-safe metadata", () => {
    const router = read("server/routers.ts");
    const form = read("client/src/components/FluidPayEnrollmentForm.tsx");
    const schema = read("drizzle/schema.ts");
    const memberDashboard = read("server/memberDashboard.ts");

    expect(router).toContain("createStripeEnrollmentPayment");
    expect(router).toContain('setup_future_usage: "off_session"');
    expect(router).toContain('payment_settings: { save_default_payment_method: "on_subscription" }');
    expect(form).toContain("StripePaymentForm");
    expect(form).toContain("future off-session use");
    expect(schema).toContain("paymentMethodLast4");
    expect(schema).toContain("paymentMethodExpMonth");
    expect(schema).not.toContain('cardNumber: varchar("cardNumber"');
    expect(schema).not.toContain('cvv: varchar("cvv"');
    expect(memberDashboard).toContain('stripeSubscriptionId.startsWith("sub_test_")');
    expect(memberDashboard).toContain('error.code === "resource_missing"');
  });
});
