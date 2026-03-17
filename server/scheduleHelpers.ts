import { getDb } from "./db";
import { classSchedule } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const TZ = "America/Chicago"; // CST/CDT — Tomball, TX

/**
 * Return a Date whose getDay()/getHours()/getMinutes() reflect CST/CDT wall-clock time.
 * JS Dates are always UTC internally; we re-parse via toLocaleString to shift the
 * numeric values into the America/Chicago timezone.
 */
function nowCST(): Date {
  const cstStr = new Date().toLocaleString("en-US", { timeZone: TZ });
  return new Date(cstStr);
}

/**
 * Returns true if the class start time (e.g. "5:00 PM") has already passed
 * relative to the provided CST Date object (with a 30-minute buffer).
 */
function isClassTimePassed(startTime: string, nowInCST: Date): boolean {
  const parts = startTime.split(" ");
  if (parts.length < 2) return false;
  const [timePart, ampm] = parts;
  const [hourStr, minStr] = timePart.split(":");
  let classHour = parseInt(hourStr, 10);
  const classMin = parseInt(minStr || "0", 10);
  if (ampm?.toUpperCase() === "PM" && classHour !== 12) classHour += 12;
  if (ampm?.toUpperCase() === "AM" && classHour === 12) classHour = 0;
  const classMinutes = classHour * 60 + classMin;
  const nowMinutes = nowInCST.getHours() * 60 + nowInCST.getMinutes();
  return classMinutes <= nowMinutes + 30; // 30-min buffer
}

/**
 * Get next available class times for a specific program.
 * Returns up to `limit` upcoming classes, prioritizing soonest options.
 * All day/time comparisons are done in CST/CDT (America/Chicago).
 */
export async function getNextClassTimes(program: string, location: string = "Tomball HQ", limit: number = 3) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get class schedule: database not available");
    return [];
  }

  try {
    // Get current day of week and time **in CST/CDT**
    const now = nowCST();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysOfWeek[now.getDay()];

    // Query all active classes for the program at the location
    const classes = await db
      .select()
      .from(classSchedule)
      .where(
        and(
          eq(classSchedule.program, program as any),
          eq(classSchedule.location, location),
          eq(classSchedule.isActive, 1)
        )
      )
      .execute();

    if (classes.length === 0) {
      return [];
    }

    // Sort classes by day and time to find next available (all in CST)
    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentDayIndex = dayOrder.indexOf(currentDay);

    const sortedClasses = classes.sort((a, b) => {
      const aDayIndex = dayOrder.indexOf(a.dayOfWeek);
      const bDayIndex = dayOrder.indexOf(b.dayOfWeek);

      // Days until each class (CST-relative)
      let daysUntilA = (aDayIndex - currentDayIndex + 7) % 7;
      let daysUntilB = (bDayIndex - currentDayIndex + 7) % 7;

      // If same day, skip to next week if class already passed (with 30-min buffer)
      if (daysUntilA === 0 && isClassTimePassed(a.startTime, now)) daysUntilA = 7;
      if (daysUntilB === 0 && isClassTimePassed(b.startTime, now)) daysUntilB = 7;

      if (daysUntilA !== daysUntilB) return daysUntilA - daysUntilB;
      // Same day — sort by time
      return a.startTime.localeCompare(b.startTime);
    });

    return sortedClasses.slice(0, limit);
  } catch (error) {
    console.error("[Database] Failed to get class schedule:", error);
    return [];
  }
}

/**
 * Format class time for display in chatbot
 * Example: "Tuesday at 5:00 PM"
 */
export function formatClassTime(classInfo: { dayOfWeek: string; startTime: string }): string {
  return `${classInfo.dayOfWeek} at ${classInfo.startTime}`;
}

/**
 * Get all classes for a specific program
 */
export async function getAllClassesForProgram(program: string, location: string = "Tomball HQ") {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get class schedule: database not available");
    return [];
  }

  try {
    const classes = await db
      .select()
      .from(classSchedule)
      .where(
        and(
          eq(classSchedule.program, program as any),
          eq(classSchedule.location, location),
          eq(classSchedule.isActive, 1)
        )
      )
      .execute();

    return classes;
  } catch (error) {
    console.error("[Database] Failed to get class schedule:", error);
    return [];
  }
}
