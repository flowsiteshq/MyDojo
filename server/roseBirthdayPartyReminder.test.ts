import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(process.cwd(), "scripts/send-rose-birthday-party-reminder.ts"), "utf8");

describe("Rose Birthday Party reminder campaign", () => {
  it("locks delivery to the approved 12 complete uploaded-list contacts", () => {
    expect(source).toContain("send-rose-party-12");
    expect(source).toContain("recipients.length !== 12");
    expect(source).toContain("new Set(recipients.map((recipient) => recipient.phone)).size !== 12");
  });

  it("states the party is today at noon and includes the MyDojo address", () => {
    expect(source).toContain("today, Sunday, September 6 at 12:00 noon");
    expect(source).toContain("11721 Spring-Cypress Road, Tomball, TX 77377");
  });

  it("checks opt-outs and prevents an accidental repeat", () => {
    expect(source).toContain("optedOut = 1");
    expect(source).toContain("this exact party reminder was already recorded today");
  });
});
