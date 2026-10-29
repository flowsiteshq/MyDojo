/**
 * classReservationRouter.ts
 *
 * tRPC procedures for parent class sign-ups and admin roster viewing.
 *
 * Procedures:
 *   classReservation.getSchedule         – public: get active class schedule for a given day/week
 *   classReservation.getMyStudents       – protected: get enrollments linked to current user
 *   classReservation.reserve             – protected: reserve a class slot for a student
 *   classReservation.cancel              – protected: cancel a reservation
 *   classReservation.getMyReservations   – protected: list upcoming reservations for current user
 *   classReservation.adminRoster         – admin: get full roster for a specific date
 *   classReservation.adminRosterByClass  – admin: get roster for a specific class+date
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { eq, and, sql, gte, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or staff access required" });
  }
  return next({ ctx });
});

function isSeasonallyVisible(program: string, date?: string) {
  // The current admin schedule has no per-row season dates. Summer Camp is
  // therefore restricted to the configured May–August operating season.
  return program !== "Summer Camp" || !date || [5, 6, 7, 8].includes(Number(date.slice(5, 7)));
}

function ageOnDate(dateOfBirth: string | null | undefined, date: string) {
  if (!dateOfBirth) return null;
  const birth = new Date(`${dateOfBirth}T12:00:00`);
  const current = new Date(`${date}T12:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = current.getFullYear() - birth.getFullYear();
  if (current.getMonth() < birth.getMonth() || (current.getMonth() === birth.getMonth() && current.getDate() < birth.getDate())) age -= 1;
  return age;
}

function eligibilityFor(program: string, student: { dateOfBirth?: string | null; packageName?: string | null } | undefined, date: string) {
  const age = ageOnDate(student?.dateOfBirth, date);
  const packageName = (student?.packageName ?? "").toLowerCase();
  if (program === "Summer Camp") return { eligible: isSeasonallyVisible(program, date), ageLabel: "Seasonal", eligibilityReason: "Summer Camp is not in session on this date." };
  if (!student) return { eligible: false, ageLabel: "Member only", eligibilityReason: "Select an active student to check eligibility." };
  if (program === "Little Ninjas" || program === "Little Ninjas & Me") return { eligible: age !== null && age >= 3 && age <= 5, ageLabel: "Ages 3–5", eligibilityReason: "Age-restricted program." };
  if (program === "Dragon Kids" || program === "Dragon Kids & Teens" || program === "After School") return { eligible: age !== null && age >= 6 && age <= 12, ageLabel: "Ages 6–12", eligibilityReason: "Age-restricted program." };
  if (program === "Teens" || program === "Teen Warriors") return { eligible: age !== null && age >= 13 && age <= 15, ageLabel: "Ages 13–15", eligibilityReason: "Age-restricted program." };
  if (program === "Kickboxing") return { eligible: age !== null && age >= 16 && (packageName.includes("kick") || packageName.includes("black") || packageName.includes("leadership") || packageName.includes("foundation")), ageLabel: "Ages 16+", eligibilityReason: "Adult members with authorized kickboxing access." };
  return { eligible: age !== null && age >= 16, ageLabel: "Ages 16+", eligibilityReason: "Adult program." };
}

export const classReservationRouter = router({
  /**
   * Get the full active class schedule, optionally filtered by day of week.
   * Returns classes with reservation counts for a specific date.
   */
  getSchedule: publicProcedure
    .input(z.object({
      date: z.string().optional(), // YYYY-MM-DD — if provided, also returns reservation counts for that date
      location: z.string().optional().default("Tomball HQ"),
      enrollmentId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const student = input.enrollmentId
        ? (await db
          .select({ dateOfBirth: schema.enrollments.dateOfBirth, packageName: schema.membershipPackages.name })
          .from(schema.enrollments)
          .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
          .where(and(eq(schema.enrollments.id, input.enrollmentId), eq(schema.enrollments.status, "active")))
          .limit(1))[0]
        : undefined;

      const classes = await db
        .select()
        .from(schema.classSchedule)
        .where(
          and(
            eq(schema.classSchedule.isActive, 1),
            input.location ? or(
              eq(schema.classSchedule.location, input.location),
              sql`LOWER(${schema.classSchedule.location}) LIKE CONCAT('%', LOWER(${input.location}), '%')`,
            ) : undefined,
            input.date ? eq(schema.classSchedule.dayOfWeek, sql`DAYNAME(${input.date})`) : undefined,
          )
        )
        .orderBy(
          sql`FIELD(${schema.classSchedule.dayOfWeek}, 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')`,
          schema.classSchedule.startTime
        );

      // If a date is provided, attach reservation counts per class
      if (input.date) {
        const reservations = await db
          .select({
            classScheduleId: schema.classReservations.classScheduleId,
            count: sql<number>`COUNT(*)`,
          })
          .from(schema.classReservations)
          .where(
            and(
              eq(schema.classReservations.classDate, input.date),
              eq(schema.classReservations.status, "confirmed")
            )
          )
          .groupBy(schema.classReservations.classScheduleId);

        const countMap = new Map(reservations.map(r => [r.classScheduleId, r.count]));
        const visible = classes.filter((c) => isSeasonallyVisible(c.program, input.date));
        const unique = new Map<string, typeof visible[number]>();
        for (const item of visible) {
          const key = `${item.program}|${item.location}|${item.dayOfWeek}|${item.startTime}|${item.endTime}|${item.instructor ?? ""}`;
          if (!unique.has(key)) unique.set(key, item);
        }
        return Array.from(unique.values()).map(c => ({ ...c, reservationCount: countMap.get(c.id) ?? 0, ...eligibilityFor(c.program, student, input.date!) }));
      }

      const visible = classes.filter((c) => isSeasonallyVisible(c.program));
      const unique = new Map<string, typeof visible[number]>();
      for (const item of visible) {
        const key = `${item.program}|${item.location}|${item.dayOfWeek}|${item.startTime}|${item.endTime}|${item.instructor ?? ""}`;
        if (!unique.has(key)) unique.set(key, item);
      }
      return Array.from(unique.values()).map(c => ({ ...c, reservationCount: 0 }));
    }),

  /**
   * Get all active enrollments for the current user (their students).
   * Used to populate the "which student?" dropdown in the sign-up flow.
   */
  getMyStudents: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Look up enrollments where the user's email or phone matches
    const user = ctx.user;
    const students = await db
      .select({
        id: schema.enrollments.id,
        studentName: schema.enrollments.studentName,
        status: schema.enrollments.status,
        beltRank: schema.enrollments.beltRank,
        photoUrl: schema.enrollments.photoUrl,
        parentName: schema.enrollments.customerName,
        parentPhone: schema.enrollments.customerPhone,
        parentEmail: schema.enrollments.customerEmail,
        packageName: schema.membershipPackages.name,
      })
      .from(schema.enrollments)
      .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
      .where(
        and(
          eq(schema.enrollments.status, "active"),
            or(
              sql`${schema.enrollments.customerEmail} = ${user.email}`,
              sql`${schema.enrollments.customerPhone} = ${user.phone ?? ''}`
            )
        )
      );

    return students;
  }),

  /**
   * Reserve a spot in a class for a student.
   */
  reserve: protectedProcedure
    .input(z.object({
      classScheduleId: z.number(),
      classDate: z.string(), // YYYY-MM-DD
      enrollmentId: z.number(),
      note: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify the enrollment belongs to this user
      const enrollment = await db
        .select()
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.id, input.enrollmentId),
            eq(schema.enrollments.status, "active"),
            or(
              sql`${schema.enrollments.customerEmail} = ${ctx.user.email}`,
              sql`${schema.enrollments.customerPhone} = ${ctx.user.phone ?? ''}`
            )
          )
        )
        .limit(1);

      if (enrollment.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Student not found or not active" });
      }

      const enroll = enrollment[0];
      const enrollParentName = (enroll as any).parentName ?? ctx.user.name;
      const enrollParentPhone = (enroll as any).parentPhone ?? ctx.user.phone ?? undefined;

      // Check for duplicate reservation
      const existing = await db
        .select({ id: schema.classReservations.id })
        .from(schema.classReservations)
        .where(
          and(
            eq(schema.classReservations.classScheduleId, input.classScheduleId),
            eq(schema.classReservations.classDate, input.classDate),
            eq(schema.classReservations.enrollmentId, input.enrollmentId),
            eq(schema.classReservations.status, "confirmed")
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "Already reserved for this class" });
      }

      // Get class details
      const classSlot = await db
        .select()
        .from(schema.classSchedule)
        .where(eq(schema.classSchedule.id, input.classScheduleId))
        .limit(1);

      if (classSlot.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }

      const cls = classSlot[0];
      const eligibility = eligibilityFor(cls.program, {
        dateOfBirth: enroll.dateOfBirth,
        packageName: (await db
          .select({ name: schema.membershipPackages.name })
          .from(schema.membershipPackages)
          .where(eq(schema.membershipPackages.id, enroll.membershipPackageId))
          .limit(1))[0]?.name,
      }, input.classDate);
      if (!eligibility.eligible) {
        throw new TRPCError({ code: "FORBIDDEN", message: `This student is not eligible for ${cls.program}.` });
      }

      const insertData: typeof schema.classReservations.$inferInsert = {
        classScheduleId: input.classScheduleId,
        classDate: input.classDate,
        enrollmentId: input.enrollmentId,
        studentName: (enroll.studentName ?? ctx.user.name) as string,
        parentName: enrollParentName ?? undefined,
        parentPhone: enrollParentPhone ?? undefined,
        program: cls.program,
        startTime: cls.startTime,
        endTime: cls.endTime ?? undefined,
        instructor: cls.instructor ?? undefined,
        location: cls.location,
        note: input.note ?? undefined,
        status: "confirmed",
        staffNotified: 0,
      };
      await db.insert(schema.classReservations).values(insertData);

      return { success: true };
    }),

  /**
   * Cancel a reservation.
   */
  cancel: protectedProcedure
    .input(z.object({ reservationId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership via enrollment
      const reservation = await db
        .select({
          id: schema.classReservations.id,
          enrollmentId: schema.classReservations.enrollmentId,
        })
        .from(schema.classReservations)
        .where(eq(schema.classReservations.id, input.reservationId))
        .limit(1);

      if (reservation.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reservation not found" });
      }

      // Verify the enrollment belongs to this user (or admin/staff)
      if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
        const enroll = await db
          .select({ id: schema.enrollments.id })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.id, reservation[0].enrollmentId),
            or(
              sql`${schema.enrollments.customerEmail} = ${ctx.user.email}`,
              sql`${schema.enrollments.customerPhone} = ${ctx.user.phone ?? ''}`
            )
          )
        )
        .limit(1);

      if (enroll.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to cancel this reservation" });
        }
      }

      await db
        .update(schema.classReservations)
        .set({ status: "cancelled" })
        .where(eq(schema.classReservations.id, input.reservationId));

      return { success: true };
    }),

  /**
   * Get upcoming reservations for the current user's students.
   */
  getMyReservations: protectedProcedure
    .input(z.object({
      fromDate: z.string().optional(), // YYYY-MM-DD, defaults to today
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const today = input.fromDate ?? new Date().toISOString().slice(0, 10);

      // Get all enrollment IDs for this user
      const enrollments = await db
        .select({ id: schema.enrollments.id })
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.status, "active"),
            or(
              sql`${schema.enrollments.customerEmail} = ${ctx.user.email}`,
              sql`${schema.enrollments.customerPhone} = ${ctx.user.phone ?? ''}`
            )
          )
        );

      if (enrollments.length === 0) return [];

      const enrollmentIds = enrollments.map(e => e.id);

      const reservations = await db
        .select()
        .from(schema.classReservations)
        .where(
          and(
            sql`${schema.classReservations.enrollmentId} IN (${sql.join(enrollmentIds.map(id => sql`${id}`), sql`, `)})`,
            gte(schema.classReservations.classDate, today),
            eq(schema.classReservations.status, "confirmed")
          )
        )
        .orderBy(schema.classReservations.classDate, schema.classReservations.startTime);

      return reservations;
    }),

  /**
   * Admin: get full roster for a specific date, grouped by class.
   */
  adminRoster: adminProcedure
    .input(z.object({ date: z.string() })) // YYYY-MM-DD
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const reservations = await db
        .select()
        .from(schema.classReservations)
        .where(
          and(
            eq(schema.classReservations.classDate, input.date),
            eq(schema.classReservations.status, "confirmed")
          )
        )
        .orderBy(schema.classReservations.startTime, schema.classReservations.studentName);

      // Group by class
      const grouped: Record<string, {
        classScheduleId: number;
        program: string;
        startTime: string;
        endTime: string | null;
        instructor: string | null;
        location: string;
        students: typeof reservations;
      }> = {};

      for (const r of reservations) {
        const key = `${r.classScheduleId}-${r.startTime}`;
        if (!grouped[key]) {
          grouped[key] = {
            classScheduleId: r.classScheduleId,
            program: r.program,
            startTime: r.startTime,
            endTime: r.endTime ?? null,
            instructor: r.instructor ?? null,
            location: r.location,
            students: [],
          };
        }
        grouped[key].students.push(r);
      }

      return Object.values(grouped).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }),

  /**
   * Admin: mark a reservation as attended (from the roster view).
   */
  markAttended: adminProcedure
    .input(z.object({ reservationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(schema.classReservations)
        .set({ status: "attended" })
        .where(eq(schema.classReservations.id, input.reservationId));

      return { success: true };
    }),
});
