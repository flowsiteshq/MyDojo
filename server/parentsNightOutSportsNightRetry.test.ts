import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const scriptSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/retry-parents-night-out-sports-night-2026-08-28-failures.mjs"),
  "utf8",
);

describe("Parents' Night Out failed-recipient retry safeguards", () => {
  it("retries only the exact failed-recipient set from the original campaign audit", () => {
    expect(scriptSource).toContain("const expectedFailedRecipients = 219");
    expect(scriptSource).toContain('result.status === "failed_or_opted_out"');
    expect(scriptSource).toContain("source audit does not match this campaign");
  });

  it("prevents duplicates and rechecks opt-outs before each retry", () => {
    expect(scriptSource).toContain("smsConversations WHERE optedOut = 1");
    expect(scriptSource).toContain("m.status IN ('sent', 'delivered')");
    expect(scriptSource).toContain("skipped_opted_out_after_original_attempt");
    expect(scriptSource).toContain("skipped_already_sent_after_original_attempt");
  });

  it("uses a paced delivery interval to reduce rate-limit failures", () => {
    expect(scriptSource).toContain("setTimeout(resolve, 1_250)");
  });
});
