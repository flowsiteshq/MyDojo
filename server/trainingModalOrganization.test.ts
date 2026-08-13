import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/MemberDashboard2.tsx"),
  "utf8",
);

const trainingStart = dashboardSource.indexOf('{activeTab === "training"');
const trainingEnd = dashboardSource.indexOf('{/* ── LOCATE TAB ── */}');
const trainingBlock = dashboardSource.slice(trainingStart, trainingEnd);

describe("Training quick-action modal organization", () => {
  it("keeps detail state limited to the five focused Training views", () => {
    expect(dashboardSource).toContain('const [trainingDialog, setTrainingDialog] = useState<"schedule" | "curriculum" | "progress" | "attendance" | "testing" | null>(null);');
    expect(dashboardSource).toContain('onOpenChange={(open) => !open && closeTrainingModal()}');
  });

  it("opens a dedicated modal from every Training quick action", () => {
    for (const action of ["schedule", "curriculum", "progress", "attendance", "testing"]) {
      expect(trainingBlock).toContain(`id: "${action}" as const`);
      expect(trainingBlock).toContain("onClick={() => setTrainingDialog(action.id)}");
    }
    expect(trainingBlock).toContain('trainingDialog === "schedule" &&');
    expect(trainingBlock).toContain('trainingDialog === "curriculum" &&');
    expect(trainingBlock).toContain('trainingDialog === "progress" &&');
    expect(trainingBlock).toContain('trainingDialog === "attendance" &&');
    expect(trainingBlock).toContain('trainingDialog === "testing" &&');
  });

  it("keeps expanded curriculum and progress content inside their focused modals", () => {
    const progressIndex = trainingBlock.indexOf('<ProgressTab isDark={isDark} />');
    const curriculumIndex = trainingBlock.indexOf('<CurriculumViewer isDark={isDark} />');

    expect(progressIndex).toBeGreaterThan(-1);
    expect(curriculumIndex).toBeGreaterThan(-1);
    expect(trainingBlock.slice(Math.max(0, progressIndex - 90), progressIndex)).toContain('trainingDialog === "progress"');
    expect(trainingBlock.slice(Math.max(0, curriculumIndex - 90), curriculumIndex)).toContain('trainingDialog === "curriculum"');
    expect(trainingBlock).toContain('<Dialog open={trainingDialog !== null}');
  });

  it("offers a clear button close and a threshold-based swipe-down dismissal", () => {
    expect(dashboardSource).toContain('const [trainingModalDragOffset, setTrainingModalDragOffset] = useState(0);');
    expect(dashboardSource).toContain('const trainingModalTouchStartY = useRef<number | null>(null);');
    expect(dashboardSource).toContain('endY - startY >= 96');
    expect(trainingBlock).toContain('aria-label="Swipe down to dismiss"');
    expect(trainingBlock).toContain('onTouchStart={handleTrainingModalTouchStart}');
    expect(trainingBlock).toContain('onTouchMove={handleTrainingModalTouchMove}');
    expect(trainingBlock).toContain('onTouchEnd={handleTrainingModalTouchEnd}');
    expect(trainingBlock).toContain('aria-label="Close training details"');
    expect(trainingBlock).toContain('onClick={closeTrainingModal}');
    expect(trainingBlock).toContain('>\n                      Close\n                    </button>');
  });
});
