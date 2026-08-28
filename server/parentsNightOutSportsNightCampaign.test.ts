import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const scriptSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../scripts/send-parents-night-out-sports-night-2026-08-28.mjs"),
  "utf8",
);

describe("Parents' Night Out Sports Night campaign safeguards", () => {
  it("uses the approved exact campaign details and verified audience guard", () => {
    expect(scriptSource).toContain('const expectedEligibleAudience = 459');
    expect(scriptSource).toContain("TONIGHT: Free Parents' Night Out — Sports Night!");
    expect(scriptSource).toContain("6:00–9:30 PM at MyDojo, 11721 Spring-Cypress Rd, Tomball");
    expect(scriptSource).toContain("Reply STOP to opt out.");
  });

  it("combines active student households and active leads, then honors both opt-out sources", () => {
    expect(scriptSource).toContain("WHERE status = 'active'");
    expect(scriptSource).toContain("status IN ('new', 'contacted', 'scheduled')");
    expect(scriptSource).toContain("smsOptOut = 0");
    expect(scriptSource).toContain("smsConversations WHERE optedOut = 1");
    expect(scriptSource).toContain("contactsByPhone");
  });

  it("records campaign sends and prevents a duplicate campaign delivery", () => {
    expect(scriptSource).toContain("senderType = 'campaign'");
    expect(scriptSource).toContain("skipped_duplicate_campaign");
    expect(scriptSource).toContain('sendProactiveSms(contact.phone, buildMessage(contact.name), "campaign", contact.name)');
  });
});
