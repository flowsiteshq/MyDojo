/**
 * Summer Camp Trial Auto-Activation Job
 *
 * Runs daily at 8 AM CDT (13:00 UTC) via Heartbeat cron.
 * Finds all Summer Camp 3-day trial signups whose membershipActivationDate has passed
 * and membershipActivated is false, then:
 *   1. Marks them as activated in the DB
 *   2. Sends an SMS to the parent confirming membership is now active
 *   3. Notifies the owner
 *
 * Endpoint: POST /api/scheduled/summer-camp-trial-activation
 */
import { Request, Response } from "express";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { and, eq, isNotNull, lte } from "drizzle-orm";
import { sendSms } from "./sms800";
import { notifyOwner } from "./_core/notification";

export async function handleSummerCampTrialActivation(req: Request, res: Response) {
  console.log("[SummerCampTrialActivation] Job started");

  try {
    const db = await getDb();
    if (!db) {
      console.error("[SummerCampTrialActivation] Database unavailable");
      return res.status(500).json({ ok: false, error: "Database unavailable" });
    }

    const now = new Date();

    // Find all Summer Camp trial signups that are due for activation
    const dueForActivation = await db
      .select()
      .from(schema.trialSignups)
      .where(
        and(
          eq(schema.trialSignups.program, "Summer Camp"),
          eq(schema.trialSignups.membershipActivated, false),
          isNotNull(schema.trialSignups.membershipActivationDate),
          lte(schema.trialSignups.membershipActivationDate, now)
        )
      );

    console.log(`[SummerCampTrialActivation] Found ${dueForActivation.length} trial(s) due for activation`);

    let activated = 0;
    for (const trial of dueForActivation) {
      try {
        // Mark as activated
        await db
          .update(schema.trialSignups)
          .set({
            membershipActivated: true,
            status: "completed",
            pipelineStage: "enrolled",
            notes: (trial.notes || "") + `\n[AUTO] Full membership activated on ${now.toISOString()} (Day 4 of Summer Camp trial).`,
          })
          .where(eq(schema.trialSignups.id, trial.id));

        // Send SMS to parent
        if (trial.phone && !trial.smsOptOut) {
          try {
            const firstName = trial.name.split(" ")[0];
            await sendSms({
              to: trial.phone,
              message:
                `🥋 Hi ${firstName}! Your MyDojo Summer Camp trial has ended and your full membership is now ACTIVE! 🎉\n\n` +
                `Welcome to the MyDojo family! Your regular tuition will begin with your next billing cycle.\n\n` +
                `Questions? Call or text us at (877) 4-MYDOJO. See you on the mat! 🏕️`,
            });
          } catch (smsErr) {
            console.error(`[SummerCampTrialActivation] SMS failed for ${trial.name}:`, smsErr);
          }
        }

        // Notify owner
        try {
          await notifyOwner({
            title: `🥋 Summer Camp Trial Activated — ${trial.name}`,
            content: `${trial.name} (${trial.email}, ${trial.phone}) has been automatically converted from Summer Camp 3-day trial to full membership. Activation date: ${now.toLocaleDateString()}. Please follow up to confirm billing setup.`,
          });
        } catch (notifErr) {
          console.error(`[SummerCampTrialActivation] Notify owner failed for ${trial.name}:`, notifErr);
        }

        activated++;
        console.log(`[SummerCampTrialActivation] Activated membership for: ${trial.name} (${trial.email})`);
      } catch (err) {
        console.error(`[SummerCampTrialActivation] Failed to activate trial for ${trial.name}:`, err);
      }
    }

    console.log(`[SummerCampTrialActivation] Job complete. Activated: ${activated}/${dueForActivation.length}`);
    return res.json({ ok: true, activated, total: dueForActivation.length });
  } catch (err: any) {
    console.error("[SummerCampTrialActivation] Job error:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
