import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardSource = readFileSync(
  resolve(process.cwd(), "client/src/pages/MemberDashboard2.tsx"),
  "utf8",
);

describe("member dashboard Benefits partner offers", () => {
  it("keeps Benefits as a primary dashboard tab", () => {
    expect(dashboardSource).toContain('{ id: "benefits", label: "Benefits", Icon: Star }');
    expect(dashboardSource).toContain('{ id: "training", label: "Training", Icon: Award }');
    expect(dashboardSource).toContain('{ id: "account", label: "Account", Icon: UserIcon }');
  });

  it("renders all supplied Hatchki Café member specials", () => {
    expect(dashboardSource).toContain("Hatchki Cafe");
    expect(dashboardSource).toContain("The School Drop-Off Combo");
    expect(dashboardSource).toContain("16 oz latte + empanada");
    expect(dashboardSource).toContain("$8.99");
    expect(dashboardSource).toContain("16 oz latte + kolache");
    expect(dashboardSource).toContain("$9.49");
    expect(dashboardSource).toContain("Crepe Night");
    expect(dashboardSource).toMatch(/Crepes\s*<span[^>]*>\$9–\$11/);
    expect(dashboardSource).toContain("Strawberry Pineapple Lemonade");
    expect(dashboardSource).toContain("$6.50");
  });

  it("uses the supplied Mia Bella and COCO flyers as image-led Benefit cards", () => {
    expect(dashboardSource).toContain("/manus-storage/mia-bella-flyer_c9bcdf96.jpeg");
    expect(dashboardSource).toContain("/manus-storage/coco-flyer_d22898ad.png");
    expect(dashboardSource).toContain("Mia Bella Trattoria");
    expect(dashboardSource).toContain("COCO Crêpes, Waffles & Coffee");
  });
});
