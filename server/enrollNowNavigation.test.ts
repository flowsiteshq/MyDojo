import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const layoutSource = fs.readFileSync(
  path.resolve(import.meta.dirname, "../client/src/components/Layout.tsx"),
  "utf8",
);

describe("public Enroll Now navigation", () => {
  it("keeps a direct desktop enrollment call to action", () => {
    expect(layoutSource).toContain('<Link href="/enroll"><span className="skew-x-[10deg]">Enroll Now</span></Link>');
  });

  it("keeps a direct mobile enrollment call to action", () => {
    expect(layoutSource).toContain('<Link href="/enroll" onClick={() => setIsMobileMenuOpen(false)}>Enroll Now</Link>');
  });
});
