import 'dotenv/config';
import fs from 'node:fs/promises';

const base = process.env.PAYPAL_ENVIRONMENT === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://mydojoma.com').replace(/\/$/, '');
const resultPath = process.env.PAYPAL_PROVISIONING_RESULT_PATH;

if (!clientId || !clientSecret) throw new Error('PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required');

let token;
async function accessToken() {
  if (token) return token;
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(`PayPal authentication failed: ${response.status}`);
  token = (await response.json()).access_token;
  return token;
}

async function paypal(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(body.details)
      ? body.details.map((detail) => {
          const issue = detail.issue || 'UNKNOWN_ISSUE';
          const description = detail.description || 'No description provided';
          return `${issue}: ${description}`;
        }).join(' | ')
      : '';
    const name = body.name || 'UNKNOWN_ERROR';
    const message = details || body.message || 'No error description provided';
    throw new Error(`PayPal ${options.method || 'GET'} ${path} failed: ${response.status} ${name}${details ? ` — ${message}` : ` — ${message}`}`);
  }
  return body;
}

const expectedPlans = {
  basic: { name: 'MyDojo Basic ($149 + $99 enrollment)', monthly: '149.00', setupFee: '99.00' },
  basicNoFee: { name: 'MyDojo Basic ($149, MYDOJO99)', monthly: '149.00', setupFee: '0.00' },
  blackBelt: { name: 'MyDojo Black Belt ($199 + $99 enrollment)', monthly: '199.00', setupFee: '99.00' },
  blackBeltNoFee: { name: 'MyDojo Black Belt ($199, MYDOJO99)', monthly: '199.00', setupFee: '0.00' },
  leadership: { name: 'MyDojo Leadership ($249 + $99 enrollment)', monthly: '249.00', setupFee: '99.00' },
  leadershipNoFee: { name: 'MyDojo Leadership ($249, MYDOJO99)', monthly: '249.00', setupFee: '0.00' },
};

const requiredWebhookEvents = new Set([
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED',
  'BILLING.SUBSCRIPTION.SUSPENDED',
  'PAYMENT.SALE.COMPLETED',
  'PAYMENT.SALE.DENIED',
  'PAYMENT.CAPTURE.COMPLETED',
  'PAYMENT.CAPTURE.DENIED',
  'CHECKOUT.ORDER.COMPLETED',
]);

async function findProducts(name) {
  const matches = [];
  for (let page = 1; page <= 100; page++) {
    const data = await paypal(`/v1/catalogs/products?page_size=100&page=${page}`);
    const items = data.products || [];
    matches.push(...items.filter((product) => product.name === name));
    if (items.length < 100) return matches;
  }
  throw new Error('Product search exceeded 100 pages; refusing to provision');
}

async function ensureProduct(name) {
  const matches = await findProducts(name);
  if (matches.length > 1) throw new Error(`Conflicting PayPal products found for ${name}`);
  if (matches.length === 1) return matches[0].id;
  return (await paypal('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({ name, type: 'SERVICE', category: 'MEMBERSHIP_CLUBS_AND_ORGANIZATIONS' }),
  })).id;
}

async function listPlans() {
  const plans = [];
  for (let page = 1; page <= 100; page++) {
    const data = await paypal(`/v1/billing/plans?page_size=20&page=${page}`);
    const items = data.plans || [];
    plans.push(...items);
    if (items.length < 20) return plans;
  }
  throw new Error('Plan search exceeded 100 pages; refusing to provision');
}

function normalizeMoney(value) {
  return Number(value || 0).toFixed(2);
}

function validatePlan(plan, expected, productId) {
  const cycle = plan.billing_cycles?.find((item) => item.tenure_type === 'REGULAR');
  const price = cycle?.pricing_scheme?.fixed_price;
  const setupFee = plan.payment_preferences?.setup_fee;
  const problems = [];
  if (plan.status !== 'ACTIVE') problems.push(`status=${plan.status}`);
  if (plan.product_id !== productId) problems.push('product mismatch');
  if (price?.currency_code !== 'USD') problems.push('monthly currency is not USD');
  if (normalizeMoney(price?.value) !== expected.monthly) problems.push(`monthly=${price?.value}`);
  if (cycle?.frequency?.interval_unit !== 'MONTH' || cycle?.frequency?.interval_count !== 1) problems.push('billing frequency is not monthly');
  if (normalizeMoney(setupFee?.value) !== expected.setupFee) problems.push(`setup_fee=${setupFee?.value || '0.00'}`);
  if (setupFee && setupFee.currency_code !== 'USD') problems.push('setup-fee currency is not USD');
  if (problems.length) throw new Error(`Conflicting PayPal plan ${plan.id}: ${problems.join(', ')}`);
}

async function ensurePlan({ productId, expected }) {
  const matches = (await listPlans()).filter((plan) => plan.name === expected.name);
  if (matches.length > 1) throw new Error(`Conflicting PayPal plans found for ${expected.name}`);
  if (matches.length === 1) {
    const fullPlan = await paypal(`/v1/billing/plans/${matches[0].id}`);
    validatePlan(fullPlan, expected, productId);
    return fullPlan.id;
  }
  const created = await paypal('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify({
      product_id: productId,
      name: expected.name,
      description: `${expected.name} — MyDojo monthly membership`,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { currency_code: 'USD', value: expected.monthly } },
      }],
      payment_preferences: {
        auto_bill_outstanding: false,
        payment_failure_threshold: 3,
        ...(expected.setupFee !== '0.00' ? {
          setup_fee: { currency_code: 'USD', value: expected.setupFee },
          setup_fee_failure_action: 'CANCEL',
        } : {}),
      },
    }),
  });
  const verified = await paypal(`/v1/billing/plans/${created.id}`);
  validatePlan(verified, expected, productId);
  return verified.id;
}

async function ensureWebhook() {
  const expectedUrl = `${siteUrl}/api/paypal/webhook`;
  const webhooks = [];
  for (let page = 1; page <= 100; page++) {
    const data = await paypal(`/v1/notifications/webhooks?page_size=100&page=${page}`);
    const items = data.webhooks || [];
    webhooks.push(...items);
    if (items.length < 100) break;
    if (page === 100) throw new Error('Webhook search exceeded 100 pages; refusing to provision');
  }
  const matches = webhooks.filter((webhook) => webhook.url === expectedUrl);
  if (matches.length > 1) throw new Error(`Conflicting PayPal webhooks found for ${expectedUrl}`);
  if (matches.length === 1) {
    const actualEvents = new Set((matches[0].event_types || []).map((event) => event.name));
    const missing = [...requiredWebhookEvents].filter((event) => !actualEvents.has(event));
    if (missing.length) throw new Error(`Existing webhook ${matches[0].id} is missing required events`);
    return matches[0].id;
  }
  const created = await paypal('/v1/notifications/webhooks', {
    method: 'POST',
    body: JSON.stringify({
      url: expectedUrl,
      event_types: [...requiredWebhookEvents].map((name) => ({ name })),
    }),
  });
  return created.id;
}

const productId = await ensureProduct('MyDojo Memberships');
const plans = {};
for (const [key, expected] of Object.entries(expectedPlans)) {
  plans[key] = await ensurePlan({ productId, expected });
}
const webhookId = await ensureWebhook();
const result = {
  PAYPAL_PLAN_BASIC: plans.basic,
  PAYPAL_PLAN_BASIC_NO_FEE: plans.basicNoFee,
  PAYPAL_PLAN_BLACK_BELT: plans.blackBelt,
  PAYPAL_PLAN_BLACK_BELT_NO_FEE: plans.blackBeltNoFee,
  PAYPAL_PLAN_LEADERSHIP: plans.leadership,
  PAYPAL_PLAN_LEADERSHIP_NO_FEE: plans.leadershipNoFee,
  PAYPAL_WEBHOOK_ID: webhookId,
};
if (resultPath) await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
if (resultPath) {
  console.log('PayPal provisioning completed; the protected result artifact was written.');
} else {
  console.log(JSON.stringify(result, null, 2));
}