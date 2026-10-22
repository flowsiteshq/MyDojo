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

/**
 * Create a PayPal order for an explicitly initiated one-time checkout.
 * The order is not captured until the buyer approves it and capture is called.
 * The caller must derive amount from trusted server-side pricing, not browser input.
 */
export async function createPayPalOrder(params: {
  amountCents: number;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ orderId: string; approvalUrl: string }> {
  if (!Number.isSafeInteger(params.amountCents) || params.amountCents <= 0) {
    throw new Error("Invalid PayPal amount");
  }
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `mydojo-${params.referenceId}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: params.referenceId,
        amount: {
          currency_code: "USD",
          value: (params.amountCents / 100).toFixed(2),
        },
      }],
      payment_source: {
        paypal: {
          experience_context: {
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
            user_action: "PAY_NOW",
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error(`PayPal order creation failed (${response.status})`);
  const data = await response.json() as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
  };
  const approvalUrl = data.links?.find(link => link.rel === "payer-action" || link.rel === "approve")?.href;
  if (!data.id || !approvalUrl) throw new Error("PayPal order approval link missing");
  return { orderId: data.id, approvalUrl };
}

/** Only call after validating the order belongs to the authenticated enrollment. */
export async function capturePayPalOrder(orderId: string): Promise<{
  orderId: string;
  status: string;
}> {
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId)) throw new Error("Invalid PayPal order ID");
  const token = await getPayPalAccessToken();
  const response = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `mydojo-capture-${orderId}`,
      },
    },
  );
  if (!response.ok) throw new Error(`PayPal capture failed (${response.status})`);
  const data = await response.json() as { id?: string; status?: string };
  if (!data.id || !data.status) throw new Error("Invalid PayPal capture response");
  return { orderId: data.id, status: data.status };
}
