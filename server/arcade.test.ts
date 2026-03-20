import { describe, expect, it } from "vitest";

/**
 * Unit tests for arcade game logic (score calculation, game definitions).
 * These tests do not require a live database connection.
 */

// ── Score calculation helpers (mirrored from game components) ──────────────

function getReactionScore(ms: number): number {
  if (ms < 150) return 100;
  if (ms < 200) return 90;
  if (ms < 250) return 80;
  if (ms < 300) return 70;
  if (ms < 400) return 55;
  if (ms < 500) return 40;
  if (ms < 700) return 25;
  return 10;
}

function getComboPoints(sequenceLength: number): number {
  return sequenceLength * 10 + Math.floor(sequenceLength / 3) * 5;
}

function getTargetBlitzPoints(size: number, combo: number): number {
  const basePoints = size <= 70 ? 30 : size <= 80 ? 20 : 10;
  const multiplier = combo >= 5 ? 2 : combo >= 3 ? 1.5 : 1;
  return Math.round(basePoints * multiplier);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Reaction Strike scoring", () => {
  it("awards 100 pts for sub-150ms reaction", () => {
    expect(getReactionScore(100)).toBe(100);
    expect(getReactionScore(149)).toBe(100);
  });

  it("awards 90 pts for 150-199ms reaction", () => {
    expect(getReactionScore(150)).toBe(90);
    expect(getReactionScore(199)).toBe(90);
  });

  it("awards 80 pts for 200-249ms reaction", () => {
    expect(getReactionScore(200)).toBe(80);
    expect(getReactionScore(249)).toBe(80);
  });

  it("awards 70 pts for 250-299ms reaction", () => {
    expect(getReactionScore(250)).toBe(70);
  });

  it("awards 55 pts for 300-399ms reaction", () => {
    expect(getReactionScore(300)).toBe(55);
    expect(getReactionScore(399)).toBe(55);
  });

  it("awards 40 pts for 400-499ms reaction", () => {
    expect(getReactionScore(400)).toBe(40);
  });

  it("awards 25 pts for 500-699ms reaction", () => {
    expect(getReactionScore(500)).toBe(25);
    expect(getReactionScore(699)).toBe(25);
  });

  it("awards 10 pts for slow reaction (700ms+)", () => {
    expect(getReactionScore(700)).toBe(10);
    expect(getReactionScore(2000)).toBe(10);
  });
});

describe("Combo Rush scoring", () => {
  it("awards 10 pts per move in sequence", () => {
    expect(getComboPoints(1)).toBe(10);
    expect(getComboPoints(2)).toBe(20);
  });

  it("awards bonus 5 pts per 3 moves", () => {
    // 3 moves: 30 + 5 = 35
    expect(getComboPoints(3)).toBe(35);
    // 6 moves: 60 + 10 = 70
    expect(getComboPoints(6)).toBe(70);
  });

  it("scores increase with longer combos", () => {
    const scores = [1, 2, 3, 4, 5, 6].map(getComboPoints);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThan(scores[i - 1]);
    }
  });
});

describe("Target Blitz scoring", () => {
  it("awards 10 pts for large targets (no combo)", () => {
    expect(getTargetBlitzPoints(90, 0)).toBe(10);
  });

  it("awards 20 pts for medium targets (no combo)", () => {
    expect(getTargetBlitzPoints(80, 0)).toBe(20);
  });

  it("awards 30 pts for small targets (no combo)", () => {
    expect(getTargetBlitzPoints(70, 0)).toBe(30);
  });

  it("applies 1.5x multiplier for 3+ combo", () => {
    expect(getTargetBlitzPoints(90, 3)).toBe(15);
    expect(getTargetBlitzPoints(90, 4)).toBe(15);
  });

  it("applies 2x multiplier for 5+ combo", () => {
    expect(getTargetBlitzPoints(90, 5)).toBe(20);
    expect(getTargetBlitzPoints(90, 10)).toBe(20);
  });

  it("combo multiplier stacks with target value", () => {
    expect(getTargetBlitzPoints(70, 5)).toBe(60); // 30 * 2
    expect(getTargetBlitzPoints(80, 3)).toBe(30); // 20 * 1.5
  });
});

describe("Arcade game IDs", () => {
  const VALID_GAME_IDS = ["target-blitz", "reaction-strike", "belt-memory", "combo-rush"];

  it("has exactly 4 games", () => {
    expect(VALID_GAME_IDS).toHaveLength(4);
  });

  it("all game IDs are lowercase kebab-case", () => {
    for (const id of VALID_GAME_IDS) {
      expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });
});
