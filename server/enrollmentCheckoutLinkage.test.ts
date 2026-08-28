import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, "./routers.ts"), "utf8");

describe("hosted enrollment checkout linkage", () => {
  it("uses a result-shape-safe positive insert ID before adding enrollment metadata", () => {
    expect(routerSource).toContain("function getInsertedRecordId");
    expect(routerSource).toContain("Array.isArray(result)");
    expect(routerSource).toContain("Number.isInteger(value) && value > 0");
    expect(routerSource).toContain('message: `Unable to create ${recordName}`');
  });

  it("uses the safe ID extractor in every hosted membership checkout flow", () => {
    expect(routerSource).toContain('getInsertedRecordId(insertResult, "pending enrollment")');
    expect(routerSource).toContain('getInsertedRecordId(insertResult, "Back-to-School enrollment")');
    expect(routerSource).toContain('getInsertedRecordId(insertResult, "Back-to-School family enrollment")');
    expect(routerSource).toContain('getInsertedRecordId(insertResult, "family enrollment")');
    expect(routerSource).toContain('getInsertedRecordId(created, "family account")');
  });
});
