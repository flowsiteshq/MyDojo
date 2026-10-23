/**
 * Square API integration foundation for MyDojo.
 * This module does not create charges or subscriptions.
 * Configure SQUARE_ACCESS_TOKEN securely in Railway, never in source control.
 */
const SQUARE_API_BASE = "https://connect.squareup.com";
const SQUARE_API_VERSION = "2026-09-16";

export type SquareLocation = {
  id: string;
  name?: string;
  status?: string;
  currency?: string;
};

async function squareRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("SQUARE_ACCESS_TOKEN is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${SQUARE_API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_API_VERSION,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const payload = await response.json() as T & { errors?: { code?: string; detail?: string }[] };
    if (!response.ok) {
      const code = payload.errors?.[0]?.code || "API_ERROR";
      throw new Error(`Square API request failed (${response.status}, ${code})`);
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

/** Read-only credential/location check. Never initiates a payment. */
export async function listSquareLocations(): Promise<SquareLocation[]> {
  const result = await squareRequest<{ locations?: SquareLocation[] }>("/v2/locations");
  return result.locations || [];
}
