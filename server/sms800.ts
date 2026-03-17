/**
 * 800.com SMS API helper
 * Docs: https://api.800.com/docs#/operations/4e961d642a18fd06833905d239832891
 *
 * Endpoint: POST https://api.800.com/message
 * Auth: Bearer token in Authorization header
 * Body: { sender, recipient, message, media? }
 */

const API_BASE = "https://api.800.com";

export interface SmsSendOptions {
  /** Recipient phone number in E.164 format, e.g. +12815551234 */
  to: string;
  /** Message text (max 600 chars) */
  message: string;
  /** Optional MMS media URL */
  mediaUrl?: string;
}

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalise a phone number to E.164 format (+1XXXXXXXXXX for US numbers).
 * Strips all non-digit characters, then prepends +1 if 10 digits.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Already has country code or non-US — return with + prefix
  return `+${digits}`;
}

/**
 * Send an SMS via the 800.com API.
 * Requires EIGHT_HUNDRED_API_KEY and EIGHT_HUNDRED_FROM_NUMBER env vars.
 */
export async function sendSms(opts: SmsSendOptions): Promise<SmsSendResult> {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY;
  const fromNumber = process.env.EIGHT_HUNDRED_FROM_NUMBER;

  if (!apiKey) {
    return { success: false, error: "EIGHT_HUNDRED_API_KEY is not configured" };
  }
  if (!fromNumber) {
    return {
      success: false,
      error: "EIGHT_HUNDRED_FROM_NUMBER is not configured",
    };
  }

  const toNormalized = normalizePhone(opts.to);
  const fromNormalized = normalizePhone(fromNumber);

  const body: Record<string, unknown> = {
    sender: fromNormalized,
    recipient: toNormalized,
    message: opts.message,
  };

  if (opts.mediaUrl) {
    body.media = [opts.mediaUrl];
  }

  try {
    const response = await fetch(`${API_BASE}/message`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      data?: { id?: string };
      message?: string;
    };

    if (!response.ok) {
      const errMsg =
        data?.message ?? `HTTP ${response.status}: ${response.statusText}`;
      console.error("[800.com SMS] Send failed:", errMsg, data);
      return { success: false, error: errMsg };
    }

    const messageId = data?.data?.id ?? undefined;
    console.log(
      `[800.com SMS] Sent to ${toNormalized} from ${fromNormalized}. ID: ${messageId}`
    );
    return { success: true, messageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[800.com SMS] Network error:", errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Validate 800.com credentials by hitting a lightweight read endpoint.
 * Returns true if the API key is valid.
 */
export async function validate800Credentials(): Promise<boolean> {
  const apiKey = process.env.EIGHT_HUNDRED_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    return response.status === 200 || response.status === 422; // 422 = valid auth, bad params
  } catch {
    return false;
  }
}
