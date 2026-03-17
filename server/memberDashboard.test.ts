import { describe, it, expect, beforeAll } from "vitest";
import { getMemberEnrollment, getMemberClassSchedules } from "./memberDashboard";
import { getDb } from "./db";
import { enrollments, membershipPackages, classSchedule } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Member Dashboard", () => {
  describe("getMemberEnrollment", () => {
    it("should return null for non-existent email", async () => {
      const result = await getMemberEnrollment("nonexistent@example.com");
      expect(result).toBeNull();
    });

    it("should return enrollment data for valid email with active enrollment", async () => {
      // This test requires an active enrollment in the database
      // In a real scenario, you would seed test data or use a test database
      const db = await getDb();
      if (!db) {
        throw new Error("Database connection failed");
      }

      // Check if there are any active enrollments
      const activeEnrollments = await db
        .select()
        .from(enrollments)
        .where(eq(enrollments.status, "active"))
        .limit(1);

      if (activeEnrollments.length > 0) {
        const testEmail = activeEnrollments[0].customerEmail;
        const result = await getMemberEnrollment(testEmail);
        
        expect(result).not.toBeNull();
        if (result) {
          expect(result.enrollment).toBeDefined();
          expect(result.enrollment.customerEmail).toBe(testEmail);
          expect(result.enrollment.status).toBe("active");
          expect(result.package).toBeDefined();
        }
      }
    });
  });

  describe("getMemberClassSchedules", () => {
    it("should return empty array for unknown package", async () => {
      const result = await getMemberClassSchedules("Unknown Package");
      expect(result).toEqual([]);
    });

    it("should return schedules for Foundation package", async () => {
      const result = await getMemberClassSchedules("Foundation", "Tomball HQ");
      expect(Array.isArray(result)).toBe(true);
      
      // Foundation should include Little Ninjas, Dragon Kids, Teens, Adult Karate
      const programs = result.map(s => s.program);
      const allowedPrograms = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate"];
      
      programs.forEach(program => {
        expect(allowedPrograms).toContain(program);
      });
    });

    it("should return schedules for Black Belt package", async () => {
      const result = await getMemberClassSchedules("Black Belt", "Tomball HQ");
      expect(Array.isArray(result)).toBe(true);
      
      // Black Belt should include all Foundation programs plus Kickboxing
      const programs = result.map(s => s.program);
      const allowedPrograms = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"];
      
      programs.forEach(program => {
        expect(allowedPrograms).toContain(program);
      });
    });

    it("should return schedules for Leadership package", async () => {
      const result = await getMemberClassSchedules("Leadership", "Tomball HQ");
      expect(Array.isArray(result)).toBe(true);
      
      // Leadership should include all programs
      const programs = result.map(s => s.program);
      const allowedPrograms = ["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing"];
      
      programs.forEach(program => {
        expect(allowedPrograms).toContain(program);
      });
    });
  });
});
