import 'dotenv/config';

const base = process.env.PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://mydojoma.com').replace(/\/$/, '');
if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');

async function accessToken() {
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(`PayPal authentication failed: ${response.status}`);
  return (await response.json()).access_token;
}

async function paypal(path, options = {}) {
  const token = await accessToken();
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PayPal ${options.method || 'GET'} ${path} failed: ${response.status} ${JSON.stringify(body).slice(0, 500)}`);
  return body;
}

async function findProduct(name) {
  const data = await paypal(`/v1/catalogs/products?page_size=20`);
  return (data.products || []).find((product) => product.name === name)?.id;
}

async function ensureProduct(name) {
  return (await findProduct(name)) || (await paypal('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({ name, type: 'SERVICE', category: 'EDUCATIONAL_SERVICES' }),
  })).id;
}

async function findPlan(name) {
  const data = await paypal('/v1/billing/plans?status=ALL&page_size=100');
  return (data.plans || []).find((plan) => plan.name === name && plan.status === 'ACTIVE')?.id;
}

async function ensurePlan({ productId, name, monthlyCents, setupFeeCents }) {
  const existing = await findPlan(name);
  if (existing) return existing;
  const created = await paypal('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      name,
      description: `${name} — MyDojo monthly membership`,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { currency_code: 'USD', value: (monthlyCents / 100).toFixed(2) } },
      }],
      payment_preferences: {
        auto_bill_outstanding: false,
        payment_failure_threshold: 3,
        ...(setupFeeCents > 0 ? {
          setup_fee: { currency_code: 'USD', value: (setupFeeCents / 100).toFixed(2) },
          setup_fee_failure_action: 'CANCEL',
        } : {}),
      },
    }),
  });
  return created.id;
}

async function ensureWebhook() {
  const expected = `${siteUrl}/api/paypal/webhook`;
  const existing = await paypal('/v1/notifications/webhooks?page_size=100');
  const found = (existing.webhooks || []).find((webhook) => webhook.url === expected);
  if (found) return found.id;
  const created = await paypal('/v1/notifications/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      url: expected,
      event_types: [
        { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
        { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
        { name: 'BILLING.SUBSCRIPTION.SUSPENDED' },
        { name: 'PAYMENT.SALE.COMPLETED' },
        { name: 'PAYMENT.SALE.DENIED' },
        { name: 'PAYMENT.CAPTURE.COMPLETED' },
        { name: 'PAYMENT.CAPTURE.DENIED' },
        { name: 'CHECKOUT.ORDER.COMPLETED' },
      ],
    }),
  });
  return created.id;
}

const merchant = await paypal('/v1/identity/oauth2/userinfo?schema=paypalv1.1');
const productId = await ensureProduct('MyDojo Memberships');
const plans = {
  basic: await ensurePlan({ productId, name: 'MyDojo Basic ($149 + $99 enrollment)', monthlyCents: 14900, setupFeeCents: 9900 }),
  basicNoFee: await ensurePlan({ productId, name: 'MyDojo Basic ($149, MYDOJO99)', monthlyCents: 14900, setupFeeCents: 0 }),
  blackBelt: await ensurePlan({ productId, name: 'MyDojo Black Belt ($199 + $99 enrollment)', monthlyCents: 19900, setupFeeCents: 9900 }),
  blackBeltNoFee: await ensurePlan({ productId, name: 'MyDojo Black Belt ($199, MYDOJO99)', monthlyCents: 19900, setupFeeCents: 0 }),
  leadership: await ensurePlan({ productId, name: 'MyDojo Leadership ($249 + $99 enrollment)', monthlyCents: 24900, setupFeeCents: 9900 }),
  leadershipNoFee: await ensurePlan({ productId, name: 'MyDojo Leadership ($249, MYDOJO99)', monthlyCents: 24900, setupFeeCents: 0 }),
};
const webhookId = await ensureWebhook();
console.log(JSON.stringify({
  environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
  merchant: { payerId: merchant.payer_id || null, emails: merchant.emails || [] },
  productId,
  plans,
  webhookId,
  webhookUrl: `${siteUrl}/api/paypal/webhook`,
}, null, 2));
