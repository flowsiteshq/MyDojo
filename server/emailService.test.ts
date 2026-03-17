import { describe, it, expect } from "vitest";
import { checkStreakMilestone, STREAK_MILESTONES } from "./emailService";

describe("checkStreakMilestone", () => {
  it("returns null when no milestone is crossed", () => {
    expect(checkStreakMilestone(0, 1)).toBeNull();
    expect(checkStreakMilestone(1, 2)).toBeNull();
    expect(checkStreakMilestone(3, 4)).toBeNull();
    expect(checkStreakMilestone(6, 8)).toBeNull();
    expect(checkStreakMilestone(11, 15)).toBeNull();
  });

  it("detects the 5-class milestone", () => {
    expect(checkStreakMilestone(4, 5)).toBe(5);
    expect(checkStreakMilestone(0, 5)).toBe(5);
  });

  it("detects the 10-class milestone", () => {
    expect(checkStreakMilestone(9, 10)).toBe(10);
    // Jumping from 4 to 10 crosses the 5-milestone first, so 5 is returned
    expect(checkStreakMilestone(4, 10)).toBe(5);
  });

  it("detects the 25-class milestone", () => {
    expect(checkStreakMilestone(24, 25)).toBe(25);
  });

  it("detects the 50-class milestone", () => {
    expect(checkStreakMilestone(49, 50)).toBe(50);
  });

  it("detects the 100-class milestone", () => {
    expect(checkStreakMilestone(99, 100)).toBe(100);
  });

  it("does not re-trigger a milestone already passed", () => {
    // Previous streak already past the milestone
    expect(checkStreakMilestone(5, 6)).toBeNull();
    expect(checkStreakMilestone(10, 11)).toBeNull();
    expect(checkStreakMilestone(25, 26)).toBeNull();
  });

  it("only returns the lowest crossed milestone when multiple are crossed at once", () => {
    // Jumping from 0 to 10 should return 5 (first milestone hit)
    const result = checkStreakMilestone(0, 10);
    expect(result).toBe(5);
  });

  it("STREAK_MILESTONES contains the expected values", () => {
    expect(STREAK_MILESTONES).toEqual([5, 10, 25, 50, 100]);
  });
});
