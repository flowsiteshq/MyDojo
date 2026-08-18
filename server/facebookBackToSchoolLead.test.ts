import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const webhookSource = fs.readFileSync(path.resolve(import.meta.dirname, "facebookWebhook.ts"), "utf8");
const scheduleSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/Schedule.tsx"), "utf8");

describe("Facebook Back-to-School lead handoff", () => {
  it("detects the Back-to-School campaign and sends an auditable appointment text", () => {
    expect(webhookSource).toContain("isBackToSchoolLead");
    expect(webhookSource).toContain("sendProactiveSms(phone, appointmentText, \"campaign\", fullName)");
    expect(webhookSource).toContain("/schedule?book=true&source=facebook_back_to_school&lead=");
    expect(webhookSource).toContain("bookingRequestId: schedulingToken");
    expect(webhookSource).toContain("Reply HELP for help or STOP to opt out.");
  });

  it("opens the class-booking experience when a Facebook lead follows the scheduling link", () => {
    expect(scheduleSource).toContain('params.get("book") === "true"');
    expect(scheduleSource).toContain("openBookFreeClassGate()");
    expect(webhookSource).toContain("getBackToSchoolSchedulingUrl(schedulingToken!)");
  });
});
