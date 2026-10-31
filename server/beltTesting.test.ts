import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

describe("digital belt-testing control", () => {
  it("defines board breaking and sparring as required criteria", () => {
    const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
    expect(router).toContain('["board_breaking", "Board breaking", 20, 1]');
    expect(router).toContain('["sparring", "Sparring", 20, 1]');
    expect(router).toContain("earnedPoints / totalPoints >= 0.7");
  });

  it("uses additive tables and does not drop or alter billing tables", () => {
    const migration = fs.readFileSync(path.join(root, "drizzle/0091_young_warhawk.sql"), "utf8");
    expect(migration).toContain("CREATE TABLE `beltTestSessions`");
    expect(migration).toContain("CREATE TABLE `beltTestScores`");
    expect(migration).not.toMatch(/DROP TABLE|ALTER TABLE `enrollments`|ALTER TABLE `beltTestIntents`/i);
  });

  it("keeps published member results behind the published status", () => {
    const router = fs.readFileSync(path.join(root, "server/routers.ts"), "utf8");
    expect(router).toContain('eq(schema.beltTestSessions.status, "published")');
    expect(router).toContain("getMyPublishedResults");
  });
});
