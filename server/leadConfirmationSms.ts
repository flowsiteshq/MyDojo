import { normalizePhone, sendSms, type SmsSendResult } from "./sms800";

export type LeadConfirmationInput = {
  name: string;
  phone?: string | null;
  program?: string | null;
  scheduledTime?: Date | string | null;
  customMessage?: string;
};

export type LeadConfirmationResult = SmsSendResult & {
  attempted: boolean;
  normalizedPhone?: string;
};

/**
 * Prevent malformed CRM/import values from being sent to the SMS provider.
 * The public forms accept U.S. phone numbers, with or without punctuation.
 */
export function isValidSmsPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

export function buildLeadConfirmationSms(input: LeadConfirmationInput): string {
  if (input.customMessage) return input.customMessage;

  const firstName = input.name.trim().split(/\s+/)[0] || "there";
  const programLine = input.program && input.program !== "Not Sure"
    ? ` for ${input.program}`
    : "";

  let appointmentLine = "We received your request and a MyDojo team member will contact you soon.";
  if (input.scheduledTime) {
    const scheduled = new Date(input.scheduledTime);
    if (!Number.isNaN(scheduled.getTime())) {
      const date = scheduled.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const time = scheduled.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      appointmentLine = `Your appointment is reserved for ${date} at ${time}. Please arrive 10 minutes early.`;
    }
  }

  return `Hi ${firstName}! Thanks for contacting MyDojo${programLine}. ${appointmentLine} Questions? Call or text (877) 4-MYDOJO. Reply STOP to unsubscribe.`;
}

/**
 * Sends a prospect confirmation text and returns a structured outcome so the
 * submitting workflow can record delivery or surface a useful operational log.
 */
export async function sendLeadConfirmationSms(input: LeadConfirmationInput): Promise<LeadConfirmationResult> {
  if (!isValidSmsPhone(input.phone)) {
    return { attempted: false, success: false, error: "A valid U.S. mobile number was not provided" };
  }

  const normalizedPhone = normalizePhone(input.phone!);
  const result = await sendSms({
    to: normalizedPhone,
    message: buildLeadConfirmationSms(input),
  });

  return { ...result, attempted: true, normalizedPhone };
}
