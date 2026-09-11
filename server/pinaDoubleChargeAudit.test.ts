import { describe, expect, it } from "vitest";

describe("Pina duplicate-charge audit safeguards", () => {
  it("is read-only and identifies only the reported email and phone suffix", async () => {
    const source = await import("node:fs/promises").then(fs => fs.readFile(
      new URL("../scripts/audit-pina-double-charge.mjs", import.meta.url),
      "utf8",
    ));

    expect(source).toContain('const EMAIL = "pinadx@gmail.com"');
    expect(source).toContain('const PHONE_LAST_10 = "8328798526"');
    expect(source).toContain('"d93g8hf0i4702btdrdg0"');
    expect(source).toContain('"d81r17f0i473fp552nog"');
    expect(source).toContain('/api/transaction/search');
    expect(source).not.toMatch(/\/api\/transaction\/(refund|void|sale|auth)/i);
  });
});
