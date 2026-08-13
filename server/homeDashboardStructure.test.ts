import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/MemberDashboard2.tsx"),
  "utf8",
);

const homeStart = dashboardSource.indexOf('{activeTab === "home"');
const homeEnd = dashboardSource.indexOf("      </main>", homeStart);
const homeBlock = dashboardSource.slice(homeStart, homeEnd);

describe("member Home dashboard", () => {
  it("renders the structured member summary rather than a loose event feed", () => {
    expect(homeBlock).toContain("const currentBelt = progressStats?.beltRank");
    expect(homeBlock).toContain("Belt Progress");
    expect(homeBlock).toContain("Next Class");
    expect(homeBlock).toContain("Quick Actions");
    expect(homeBlock).toContain("My Progress");
    expect(homeBlock).toContain("My Streak");
    expect(homeBlock).toContain("Belt Test");
  });

  it("wires Home dashboard actions to existing Training and check-in flows", () => {
    expect(homeBlock).toContain('window.location.href = "/check-in"');
    expect(homeBlock).toContain('setTrainingDialog("schedule")');
    expect(homeBlock).toContain('setTrainingDialog("progress")');
    expect(homeBlock).toContain('setTrainingDialog("curriculum")');
    expect(homeBlock).toContain('window.location.href = "/belt-test-intent"');
  });

  it("places upcoming events immediately below the welcome banner before dashboard activity panels", () => {
    const eventSection = homeBlock.indexOf('id="home-upcoming-events"');
    const activitySummary = homeBlock.indexOf('grid grid-cols-2 overflow-hidden rounded-2xl');
    const nextClass = homeBlock.indexOf('>Next Class<');
    expect(eventSection).toBeGreaterThan(homeBlock.indexOf("Belt Progress"));
    expect(eventSection).toBeLessThan(activitySummary);
    expect(eventSection).toBeLessThan(nextClass);
    expect(homeBlock).toContain('href: "/parents-night-out-aug"');
    expect(homeBlock).toContain('href: "/master-yaeger-seminar"');
  });

  it("keeps the former stacked Home layout hidden after the new overview", () => {
    expect(homeBlock).toContain('<div className="hidden">');
    expect(homeBlock.indexOf('<div className="hidden">')).toBeGreaterThan(homeBlock.indexOf("Belt Test"));
  });
});
