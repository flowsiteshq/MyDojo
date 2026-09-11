import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = fs.readFileSync(path.resolve(import.meta.dirname, "memberDashboard.ts"), "utf8");
const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "routers.ts"), "utf8");
const portalSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages/MemberPortal.tsx"), "utf8");

describe("Hannah one-day membership portal visibility", () => {
  it("maps the private package to the active Wednesday Dragon Kids class", () => {
    expect(dashboardSource).toContain('packageName === "One Day Per Week — $74 (Staff Authorized)"');
    expect(dashboardSource).toContain('schedule.program === "Dragon Kids"');
    expect(dashboardSource).toContain('schedule.dayOfWeek === "Wednesday"');
    expect(dashboardSource).toContain('schedule.startTime === "6:00 PM"');
  });

  it("exposes the active package as the member program and prefers the student name in the portal", () => {
    expect(routerSource).toContain('"Dragon Kids — Wednesdays 6:00–6:45 PM"');
    expect(routerSource).toContain('program: portalProgram');
    expect(routerSource).toContain('studentName: schema.enrollments.studentName');
    expect(portalSource).toContain('enrollment?.studentName || enrollment?.customerName');
  });
});
