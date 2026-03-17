import { describe, it, expect } from "vitest";
import { recommendProgramByAge, formatScheduleOptions, getConversionBooster } from "../client/src/lib/voiceFlowHandler";

describe("Voice Flow Handler", () => {
  describe("recommendProgramByAge", () => {
    it("should recommend Little Ninjas for ages 3-5", () => {
      expect(recommendProgramByAge(3)).toBe("Little Ninjas");
      expect(recommendProgramByAge(4)).toBe("Little Ninjas");
      expect(recommendProgramByAge(5)).toBe("Little Ninjas");
    });

    it("should recommend Dragon Kids for ages 6-12", () => {
      expect(recommendProgramByAge(6)).toBe("Dragon Kids");
      expect(recommendProgramByAge(9)).toBe("Dragon Kids");
      expect(recommendProgramByAge(12)).toBe("Dragon Kids");
    });

    it("should recommend Teens for ages 13-15", () => {
      expect(recommendProgramByAge(13)).toBe("Teens");
      expect(recommendProgramByAge(14)).toBe("Teens");
      expect(recommendProgramByAge(15)).toBe("Teens");
    });

    it("should recommend Adults for ages 16+", () => {
      expect(recommendProgramByAge(16)).toBe("Adult Karate");
      expect(recommendProgramByAge(25)).toBe("Adult Karate");
      expect(recommendProgramByAge(50)).toBe("Adult Karate");
    });
  });

  describe("formatScheduleOptions", () => {
    it("should format 2 class options correctly", () => {
      const classes = [
        { dayOfWeek: "Tuesday", startTime: "5:00 PM" },
        { dayOfWeek: "Thursday", startTime: "6:00 PM" },
      ];
      const result = formatScheduleOptions(classes);
      expect(result).toContain("Tuesday at 5:00 PM");
      expect(result).toContain("Thursday at 6:00 PM");
      expect(result).toContain("Which works better?");
    });

    it("should format 1 class option correctly", () => {
      const classes = [{ dayOfWeek: "Monday", startTime: "4:00 PM" }];
      const result = formatScheduleOptions(classes);
      expect(result).toContain("Monday at 4:00 PM");
      expect(result).toContain("Does that work for you?");
    });

    it("should return fallback message when no classes available", () => {
      const classes: Array<{ dayOfWeek: string; startTime: string }> = [];
      const result = formatScheduleOptions(classes);
      expect(result).toContain("Let me have a staff member confirm the best time");
    });
  });

  describe("getConversionBooster", () => {
    it("should return conversion booster message", () => {
      const result = getConversionBooster();
      expect(result).toContain("Most people start with our free intro class");
    });
  });
});
