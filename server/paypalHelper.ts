/**
 * PayPal integration foundation for MyDojo.
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
  customId?: string;
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
        ...(params.customId ? { custom_id: params.customId } : {}),
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
  captureId?: string;
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
  const data = await response.json() as { id?: string; status?: string; purchase_units?: Array<{ payments?: { captures?: Array<{ id?: string }> } }> };
  if (!data.id || !data.status) throw new Error("Invalid PayPal capture response");
  return { orderId: data.id, status: data.status, captureId: data.purchase_units?.[0]?.payments?.captures?.[0]?.id };
}

export async function getPayPalOrder(orderId: string): Promise<{
  id: string;
  status?: string;
  purchase_units?: Array<{ reference_id?: string; amount?: { currency_code?: string; value?: string }; payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> } }>;
}> {
  if (!/^[A-Z0-9]{8,32}$/i.test(orderId)) throw new Error("Invalid PayPal order ID");
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error(`PayPal order lookup failed (${response.status})`);
  const data = await response.json() as Awaited<ReturnType<typeof getPayPalOrder>>;
  if (!data.id) throw new Error("Invalid PayPal order response");
  return data;
}

export async function createPayPalProduct(name: string): Promise<string> {
  if (!name.trim()) throw new Error("Invalid product name");
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: name.trim(), type: "SERVICE", category: "EDUCATIONAL_SERVICES" }),
  });
  if (!res.ok) throw new Error(`PayPal product creation failed: ${res.status}`);
  const data = await res.json() as { id?: string };
  if (!data.id) throw new Error("PayPal product ID missing");
  return data.id;
}

export async function createMonthlyPlan(productId: string, name: string, amountCents: number, setupFeeCents = 0): Promise<string> {
  if (!/^PROD-[A-Za-z0-9]+$/.test(productId) || !Number.isSafeInteger(amountCents) || amountCents <= 0 || !Number.isSafeInteger(setupFeeCents) || setupFeeCents < 0) throw new Error("Invalid plan input");
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId, name, status: "ACTIVE",
      billing_cycles: [{
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR", sequence: 1, total_cycles: 0,
        pricing_scheme: { fixed_price: { currency_code: "USD", value: (amountCents / 100).toFixed(2) } },
      }],
      payment_preferences: {
        auto_bill_outstanding: false,
        payment_failure_threshold: 3,
        ...(setupFeeCents > 0 ? { setup_fee: { currency_code: "USD", value: (setupFeeCents / 100).toFixed(2) }, setup_fee_failure_action: "CANCEL" } : {}),
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal plan creation failed: ${res.status}`);
  const data = await res.json() as { id?: string };
  if (!data.id) throw new Error("PayPal plan ID missing");
  return data.id;
}

export async function createMonthlySubscription(planId: string, referenceId: string, returnUrl: string, cancelUrl: string) {
  if (!/^P-[A-Z0-9]+$/i.test(planId)) throw new Error("Invalid plan ID");
  const token = await getPayPalAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, "Content-Type": "application/json",
      "PayPal-Request-Id": `mydojo-sub-${referenceId}`,
    },
    body: JSON.stringify({
      plan_id: planId, custom_id: referenceId,
      application_context: {
        brand_name: "MyDojo Martial Arts & Fitness",
        user_action: "SUBSCRIBE_NOW", return_url: returnUrl, cancel_url: cancelUrl,
      },
    }),
  });
  if (!res.ok) throw new Error(`PayPal subscription creation failed: ${res.status}`);
  const data = await res.json() as { id?: string; links?: Array<{ rel: string; href: string }> };
  const approvalUrl = data.links?.find(link => link.rel === "approve")?.href;
  if (!data.id || !approvalUrl) throw new Error("PayPal subscription approval missing");
  return { subscriptionId: data.id, approvalUrl };
}

export async function verifyPayPalWebhookSignature(
  webhookId: string,
  headers: Record<string, string | string[] | undefined>,
  event: unknown,
): Promise<boolean> {
  const getHeader = (key: string) => {
    const v = headers[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const transmissionId = getHeader("paypal-transmission-id");
  const transmissionTime = getHeader("paypal-transmission-time");
  const transmissionSig = getHeader("paypal-transmission-sig");
  const certUrl = getHeader("paypal-cert-url");
  const authAlgo = getHeader("paypal-auth-algo");
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) return false;
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: authAlgo, cert_url: certUrl, transmission_id: transmissionId,
      transmission_sig: transmissionSig, transmission_time: transmissionTime,
      webhook_id: webhookId, webhook_event: event,
    }),
  });
  if (!response.ok) return false;
  const data = await response.json() as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
