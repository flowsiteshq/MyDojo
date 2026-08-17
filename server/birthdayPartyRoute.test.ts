import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const appSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
const layoutSource = fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/components/Layout.tsx"), "utf8");

describe("birthday party public access", () => {
  it("keeps the birthday party page mounted at its public route", () => {
    expect(appSource).toContain('const BirthdayParties = lazy(() => import("./pages/BirthdayParties"))');
    expect(appSource).toContain('<Route path="/birthday-parties" component={BirthdayParties} />');
  });

  it("includes Birthday Parties in shared desktop and mobile navigation", () => {
    expect(layoutSource).toContain('{ name: "Birthday Parties", path: "/birthday-parties" }');
    expect(layoutSource).toContain('navLinks.map((link)');
  });
});
