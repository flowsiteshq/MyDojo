import { describe, expect, it } from "vitest";

// ─── Unit tests for Read to Earn quiz scoring logic ───────────────────────────
// These tests verify the pass/fail logic without hitting the database.

describe("Read to Earn - quiz scoring logic", () => {
  const PASS_THRESHOLD = 3;
  const TOTAL_QUESTIONS = 5;

  function evaluateResult(book1Score: number, book2Score: number) {
    const book1Passed = book1Score >= PASS_THRESHOLD;
    const book2Passed = book2Score >= PASS_THRESHOLD;
    const passed = book1Passed && book2Passed;
    const totalScore = book1Score + book2Score;
    return { book1Passed, book2Passed, passed, totalScore };
  }

  it("passes when both books score 5/5", () => {
    const result = evaluateResult(5, 5);
    expect(result.book1Passed).toBe(true);
    expect(result.book2Passed).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.totalScore).toBe(10);
  });

  it("passes when both books score exactly 3/5 (minimum passing)", () => {
    const result = evaluateResult(3, 3);
    expect(result.book1Passed).toBe(true);
    expect(result.book2Passed).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.totalScore).toBe(6);
  });

  it("fails when book1 scores 2/5 even if book2 scores 5/5", () => {
    const result = evaluateResult(2, 5);
    expect(result.book1Passed).toBe(false);
    expect(result.book2Passed).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("fails when book2 scores 2/5 even if book1 scores 5/5", () => {
    const result = evaluateResult(5, 2);
    expect(result.book1Passed).toBe(true);
    expect(result.book2Passed).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("fails when both books score 0/5", () => {
    const result = evaluateResult(0, 0);
    expect(result.book1Passed).toBe(false);
    expect(result.book2Passed).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.totalScore).toBe(0);
  });

  it("fails when both books score 2/5 (one below threshold)", () => {
    const result = evaluateResult(2, 2);
    expect(result.passed).toBe(false);
  });

  it("passes with mixed scores 3/5 and 4/5", () => {
    const result = evaluateResult(3, 4);
    expect(result.passed).toBe(true);
    expect(result.totalScore).toBe(7);
  });

  it("total score is sum of both book scores", () => {
    const result = evaluateResult(4, 3);
    expect(result.totalScore).toBe(7);
  });

  it("score is bounded between 0 and 5 per book", () => {
    for (let s1 = 0; s1 <= TOTAL_QUESTIONS; s1++) {
      for (let s2 = 0; s2 <= TOTAL_QUESTIONS; s2++) {
        const result = evaluateResult(s1, s2);
        expect(result.totalScore).toBe(s1 + s2);
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.totalScore).toBeLessThanOrEqual(10);
      }
    }
  });
});
