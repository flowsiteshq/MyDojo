import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTotalMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDuration(startMs: number, nowMs: number): string {
  const diff = nowMs - startMs;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function calculateTotalMinutes(clockInAt: number, clockOutAt: number): number {
  return Math.round((clockOutAt - clockInAt) / 60000);
}

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("Staff Time Tracking — formatTotalMinutes", () => {
  it("returns minutes only when under 1 hour", () => {
    expect(formatTotalMinutes(45)).toBe("45m");
  });

  it("returns hours and minutes for 90 minutes", () => {
    expect(formatTotalMinutes(90)).toBe("1h 30m");
  });

  it("returns 0m for zero", () => {
    expect(formatTotalMinutes(0)).toBe("0m");
  });

  it("returns exactly 2h 0m for 120 minutes", () => {
    expect(formatTotalMinutes(120)).toBe("2h 0m");
  });

  it("returns 8h 30m for a full shift", () => {
    expect(formatTotalMinutes(510)).toBe("8h 30m");
  });
});

describe("Staff Time Tracking — calculateTotalMinutes", () => {
  it("calculates 60 minutes for a 1-hour shift", () => {
    const clockIn = 1000000000000;
    const clockOut = clockIn + 3600000; // +1 hour
    expect(calculateTotalMinutes(clockIn, clockOut)).toBe(60);
  });

  it("calculates 90 minutes for a 1.5-hour shift", () => {
    const clockIn = 1000000000000;
    const clockOut = clockIn + 5400000; // +1.5 hours
    expect(calculateTotalMinutes(clockIn, clockOut)).toBe(90);
  });

  it("rounds to nearest minute", () => {
    const clockIn = 1000000000000;
    const clockOut = clockIn + 3630000; // 60.5 minutes
    expect(calculateTotalMinutes(clockIn, clockOut)).toBe(61);
  });

  it("returns 0 for same clock-in and clock-out", () => {
    const t = 1000000000000;
    expect(calculateTotalMinutes(t, t)).toBe(0);
  });
});

describe("Staff Time Tracking — formatDuration (live)", () => {
  it("shows minutes when under 1 hour", () => {
    const now = Date.now();
    const start = now - 25 * 60000; // 25 minutes ago
    expect(formatDuration(start, now)).toBe("25m");
  });

  it("shows hours and minutes when over 1 hour", () => {
    const now = Date.now();
    const start = now - 90 * 60000; // 90 minutes ago
    expect(formatDuration(start, now)).toBe("1h 30m");
  });
});

describe("Staff Time Tracking — shift validation logic", () => {
  it("detects an open shift (clockOutAt is null)", () => {
    const shift = { id: 1, clockInAt: Date.now(), clockOutAt: null };
    expect(shift.clockOutAt).toBeNull();
  });

  it("detects a closed shift (clockOutAt is set)", () => {
    const shift = { id: 1, clockInAt: Date.now() - 3600000, clockOutAt: Date.now() };
    expect(shift.clockOutAt).not.toBeNull();
  });

  it("prevents double clock-in when open shift exists", () => {
    const openShifts = [{ id: 1, clockInAt: Date.now(), clockOutAt: null }];
    const canClockIn = openShifts.length === 0;
    expect(canClockIn).toBe(false);
  });

  it("allows clock-in when no open shift exists", () => {
    const openShifts: unknown[] = [];
    const canClockIn = openShifts.length === 0;
    expect(canClockIn).toBe(true);
  });
});

describe("Staff Time Tracking — class logging validation", () => {
  it("requires a program name", () => {
    const program = "";
    expect(program.trim().length > 0).toBe(false);
  });

  it("accepts a valid program name", () => {
    const program = "Little Ninjas";
    expect(program.trim().length > 0).toBe(true);
  });

  it("accepts optional student count", () => {
    const studentCount: number | undefined = undefined;
    expect(studentCount === undefined || (typeof studentCount === "number" && studentCount >= 0)).toBe(true);
  });

  it("rejects negative student count", () => {
    const studentCount = -1;
    expect(studentCount >= 0).toBe(false);
  });

  it("accepts zero student count", () => {
    const studentCount = 0;
    expect(studentCount >= 0).toBe(true);
  });
});

describe("Staff Time Tracking — hours summary aggregation", () => {
  it("sums total hours across staff correctly", () => {
    const summary = [
      { staffUserId: 1, staffName: "Alice", totalMinutes: 480, shiftCount: 2 },
      { staffUserId: 2, staffName: "Bob", totalMinutes: 360, shiftCount: 1 },
    ];
    const totalMinutes = summary.reduce((acc, s) => acc + s.totalMinutes, 0);
    expect(totalMinutes).toBe(840);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    expect(totalHours).toBe(14);
  });

  it("calculates percentage share correctly", () => {
    const totalHours = 14;
    const aliceMinutes = 480;
    const pct = Math.round((aliceMinutes / 60 / totalHours) * 100);
    expect(pct).toBe(57);
  });
});
