import { Request, Response } from "express";
import { getDb } from "./db";
import { enrollments, trialSignups, studentAppointments, membershipPackages } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/sync-export
 *
 * Returns all intro appointments (trialSignups) and enrolled students as JSON.
 * Protected by a secret API key passed in the Authorization header:
 *   Authorization: Bearer <SYNC_EXPORT_API_KEY>
 * or as a query param:
 *   ?api_key=<SYNC_EXPORT_API_KEY>
 */
export async function handleSyncExport(req: Request, res: Response) {
  // --- Auth check ---
  const authHeader = req.headers["authorization"] ?? "";
  const queryKey = typeof req.query.api_key === "string" ? req.query.api_key : "";
  const providedKey = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : queryKey;

  const SYNC_EXPORT_API_KEY = process.env.SYNC_EXPORT_API_KEY;

  if (!SYNC_EXPORT_API_KEY) {
    console.error("[SyncExport] SYNC_EXPORT_API_KEY env var is not set");
    return res.status(503).json({ error: "Sync export is not configured" });
  }

  if (!providedKey || providedKey !== SYNC_EXPORT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
  }

  try {
    const db = await getDb();
    if (!db) return res.status(503).json({ error: "Database unavailable" });

    // --- Intro appointments (trial signups / leads) ---
    const introAppointments = await db
      .select({
        id: trialSignups.id,
        name: trialSignups.name,
        email: trialSignups.email,
        phone: trialSignups.phone,
        program: trialSignups.program,
        segment: trialSignups.segment,
        goal: trialSignups.goal,
        preferredDays: trialSignups.preferredDays,
        scheduledTime: trialSignups.scheduledTime,
        location: trialSignups.location,
        status: trialSignups.status,
        pipelineStage: trialSignups.pipelineStage,
        source: trialSignups.source,
        notes: trialSignups.notes,
        assignedStaffName: trialSignups.assignedStaffName,
        lastContactedAt: trialSignups.lastContactedAt,
        lastContactMethod: trialSignups.lastContactMethod,
        introCountRequired: trialSignups.introCountRequired,
        introCountBooked: trialSignups.introCountBooked,
        introCountCompleted: trialSignups.introCountCompleted,
        ghlContactId: trialSignups.ghlContactId,
        dojoFlowSyncStatus: trialSignups.dojoFlowSyncStatus,
        createdAt: trialSignups.createdAt,
        updatedAt: trialSignups.updatedAt,
      })
      .from(trialSignups)
      .orderBy(desc(trialSignups.createdAt));

    // --- Enrolled students ---
    const students = await db
      .select({
        id: enrollments.id,
        customerName: enrollments.customerName,
        customerEmail: enrollments.customerEmail,
        customerPhone: enrollments.customerPhone,
        studentName: enrollments.studentName,
        dateOfBirth: enrollments.dateOfBirth,
        packageName: membershipPackages.name,
        packageId: enrollments.membershipPackageId,
        status: enrollments.status,
        downPaymentAmount: enrollments.downPaymentAmount,
        paidFirstMonth: enrollments.paidFirstMonth,
        remainingBalance: enrollments.remainingBalance,
        monthlyPaymentsRemaining: enrollments.monthlyPaymentsRemaining,
        beltRank: enrollments.beltRank,
        startDate: enrollments.startDate,
        isFrozen: enrollments.isFrozen,
        freezeStartDate: enrollments.freezeStartDate,
        freezeEndDate: enrollments.freezeEndDate,
        cancellationRequestedAt: enrollments.cancellationRequestedAt,
        cancellationEffectiveDate: enrollments.cancellationEffectiveDate,
        discountApplied: enrollments.discountApplied,
        discountAmount: enrollments.discountAmount,
        agreementSignedAt: enrollments.agreementSignedAt,
        createdAt: enrollments.createdAt,
        updatedAt: enrollments.updatedAt,
      })
      .from(enrollments)
      .leftJoin(membershipPackages, eq(enrollments.membershipPackageId, membershipPackages.id))
      .orderBy(desc(enrollments.createdAt));

    // --- Student class appointments ---
    const classAppointments = await db
      .select()
      .from(studentAppointments)
      .orderBy(desc(studentAppointments.scheduledTime));

    return res.json({
      exportedAt: new Date().toISOString(),
      counts: {
        introAppointments: introAppointments.length,
        students: students.length,
        classAppointments: classAppointments.length,
      },
      introAppointments,
      students,
      classAppointments,
    });
  } catch (err) {
    console.error("[SyncExport] Error fetching data:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
