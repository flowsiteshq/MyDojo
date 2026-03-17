/**
 * Staff Callback Helper
 * 
 * Creates callback records when booking fails or user needs assistance.
 * Ensures lead is saved and staff can follow up.
 */

import type { MySql2Database } from "drizzle-orm/mysql2";
import type { IntakeState } from "./intakeStateMachine";

export interface StaffCallbackResult {
  success: boolean;
  callbackId?: number;
  message: string;
}

/**
 * Create staff callback record when booking fails
 * 
 * This ensures we never lose a lead - even if booking fails,
 * we save their info and create a task for staff to follow up.
 */
export async function createStaffCallback(
  db: MySql2Database<any>,
  state: IntakeState,
  reason: string
): Promise<StaffCallbackResult> {
  const { staffCallbacks } = await import("../drizzle/schema");

  try {
    // Validate required fields
    if (!state.phone) {
      return {
        success: false,
        message: "Cannot create callback without phone number.",
      };
    }

    // Create callback record
    const [result] = await db.insert(staffCallbacks).values({
      phone: state.phone,
      name: state.name || "Unknown",
      email: state.email || undefined,
      reason,
      program: state.program || undefined,
      status: "pending",
    });

    const callbackId = result.insertId;

    console.log("[Staff Callback] Created callback record", {
      callbackId,
      phone: state.phone,
      name: state.name,
      reason,
    });

    return {
      success: true,
      callbackId,
      message: "Callback request created successfully.",
    };
  } catch (error) {
    console.error("[Staff Callback] Failed to create callback", {
      error: error instanceof Error ? error.message : String(error),
      phone: state.phone,
      name: state.name,
    });

    return {
      success: false,
      message: "Failed to create callback request.",
    };
  }
}
