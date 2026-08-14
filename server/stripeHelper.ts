/**
 * stripeHelper.ts
 * Shared Stripe server-side utilities for MyDojo.
 * Replaces FluidPay for all new payment processing.
 * Existing FluidPay subscriptions remain active and are NOT cancelled.
 */

import Stripe from "stripe";

export function getStripe(): Stripe {
  const key =
    process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "";
  if (!key) throw new Error("Stripe secret key not configured");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" as any });
}

/**
 * Create or retrieve a Stripe customer by email.
 * If a customer with this email already exists, returns the first match.
 */
export async function getOrCreateStripeCustomer(params: {
  name: string;
  email?: string;
  phone?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  const stripe = getStripe();

  if (params.email) {
    const existing = await stripe.customers.list({
      email: params.email,
      limit: 1,
    });
    if (existing.data.length > 0) return existing.data[0];
  }

  return stripe.customers.create({
    name: params.name,
    email: params.email,
    phone: params.phone,
    metadata: params.metadata,
  });
}

/**
 * Create a Stripe PaymentIntent for a one-time charge.
 * Returns clientSecret for frontend confirmation.
 */
export async function createPaymentIntent(params: {
  amountCents: number;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.create({
    amount: params.amountCents,
    currency: params.currency || "usd",
    customer: params.customerId,
    description: params.description,
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: pi.client_secret!, paymentIntentId: pi.id };
}

/**
 * Create a Stripe SetupIntent to save a card for future recurring charges.
 * Returns clientSecret for frontend confirmation.
 */
export async function createSetupIntent(params: {
  customerId: string;
  metadata?: Record<string, string>;
}): Promise<{ clientSecret: string; setupIntentId: string }> {
  const stripe = getStripe();
  const si = await stripe.setupIntents.create({
    customer: params.customerId,
    usage: "off_session",
    metadata: params.metadata,
    automatic_payment_methods: { enabled: true },
  });
  return { clientSecret: si.client_secret!, setupIntentId: si.id };
}

/**
 * Create a Stripe Subscription using a saved payment method.
 * Charges the first payment immediately (or uses a trial period).
 */
export async function createStripeSubscription(params: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  interval: "month" | "week" | "year";
  description: string;
  metadata?: Record<string, string>;
  trialEndDate?: Date; // optional trial period before first charge
}): Promise<{ subscriptionId: string; status: string; latestInvoiceId?: string }> {
  const stripe = getStripe();

  // Attach and set as default payment method
  await stripe.paymentMethods.attach(params.paymentMethodId, {
    customer: params.customerId,
  });
  await stripe.customers.update(params.customerId, {
    invoice_settings: { default_payment_method: params.paymentMethodId },
  });

  // Create an inline price for this subscription
  const price = await stripe.prices.create({
    unit_amount: params.amountCents,
    currency: "usd",
    recurring: { interval: params.interval },
    product_data: { name: params.description },
  });

  const subParams: Stripe.SubscriptionCreateParams = {
    customer: params.customerId,
    items: [{ price: price.id }],
    default_payment_method: params.paymentMethodId,
    metadata: params.metadata,
    // The payment method was already confirmed with a SetupIntent before this
    // call. Do not create an incomplete subscription that the customer cannot
    // recover from in the browser; surface an actionable error instead.
    payment_behavior: "error_if_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.payment_intent"],
  };

  if (params.trialEndDate) {
    subParams.trial_end = Math.floor(params.trialEndDate.getTime() / 1000);
  }

  const subscription = await stripe.subscriptions.create(subParams);

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    latestInvoiceId: (subscription.latest_invoice as any)?.id,
  };
}

/**
 * Confirm a PaymentIntent after card details are collected on the frontend.
 * Used for one-time charges after PaymentElement submission.
 */
export async function retrievePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });
}

/**
 * Retrieve a SetupIntent to get the payment method ID after frontend confirmation.
 */
export async function retrieveSetupIntent(
  setupIntentId: string
): Promise<Stripe.SetupIntent> {
  const stripe = getStripe();
  return stripe.setupIntents.retrieve(setupIntentId, {
    expand: ["payment_method"],
  });
}
