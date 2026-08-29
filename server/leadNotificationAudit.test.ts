import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "notifyStaffNewLead.ts"), "utf8");

describe("staff lead notification audit", () => {
  it("normalizes duplicate staff numbers and records every provider outcome", () => {
    expect(source).toContain("normalizePhone(s.phone)");
    expect(source).toContain("getOrCreateConversation(normalizedPhone");
    expect(source).toContain('result.success ? "sent" : "failed"');
  });

  it("defines canonical contact labels for the designated MyDojo lead-alert roster", () => {
    expect(source).toContain('"+12818189288": "Master Vincent Holmes"');
    expect(source).toContain('"+17034997761": "Sensei Kamil Ahmed"');
    expect(source).toContain('"+18187454612": "Sensei Hector Diosdado"');
    expect(source).toContain('"+12406011818": "Sensei Dominique Griggs"');
  });
});
