/**
 * PayPal integration foundation for MyDojo.
 * Read-only token validation only. No payments or subscriptions are created.
 * Store PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET securely in Railway.
 */
const PAYPAL_API_BASE = process.env.PAYPAL_ENVIRONMENT === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PayPal credentials are not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const credentials = Buffer.from(`${id}:${secret}`).toString("base64");
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`PayPal authentication failed (${response.status})`);
    const data = await response.json() as { access_token?: string };
    if (!data.access_token) throw new Error("PayPal did not return an access token");
    return data.access_token;
  } finally {
    clearTimeout(timeout);
  }
}
