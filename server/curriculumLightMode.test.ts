import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const curriculumSource = readFileSync(
  resolve(process.cwd(), "client/src/components/CurriculumViewer.tsx"),
  "utf8",
);
const dashboardSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/MemberDashboard2.tsx"),
  "utf8",
);

describe("curriculum light-mode readability", () => {
  it("receives the dashboard theme and provides dedicated light-mode tokens", () => {
    expect(curriculumSource).toContain("isDark?: boolean");
    expect(curriculumSource).toContain('text-slate-950');
    expect(curriculumSource).toContain('text-slate-600');
    expect(curriculumSource).toContain('border-slate-200 bg-white shadow-sm');
    expect(dashboardSource).toContain("<CurriculumViewer isDark={isDark} />");
  });

  it("uses clear light-mode surfaces for categories, requirements, and locked content", () => {
    expect(curriculumSource).toContain('bg-white hover:bg-red-50');
    expect(curriculumSource).toContain('bg-slate-50');
    expect(curriculumSource).toContain('border-slate-200 bg-white shadow-sm');
    expect(curriculumSource).toContain('border-slate-300 bg-white text-slate-900');
  });
});
