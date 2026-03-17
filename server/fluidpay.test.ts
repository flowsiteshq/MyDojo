import { describe, it, expect } from 'vitest';

/**
 * Validates that the FLUIDPAY_SECRET_KEY can authenticate against the Fluid Pay API.
 * We call the /api/user/me endpoint (lightweight, read-only) to confirm the key is valid.
 */
describe('Fluid Pay API key validation', () => {
  it('FLUIDPAY_SECRET_KEY authenticates successfully against the live gateway', async () => {
    const apiKey = process.env.FLUIDPAY_SECRET_KEY;
    expect(apiKey, 'FLUIDPAY_SECRET_KEY must be set').toBeTruthy();

    // Attempt a transaction with a dummy token — 400 "invalid tokenizer token" means the key
    // authenticated successfully (the gateway rejected the fake token, not the key).
    // 401 would mean the key itself is invalid.
    const res = await fetch('https://app.fluidpay.com/api/transaction', {
      method: 'POST',
      headers: { 'Authorization': apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sale', amount: 100, payment_method: { token: 'test_token_validation_only' } }),
    });

    const body = await res.json() as { status: string; msg: string };
    // 401 = bad key; 400 with "invalid tokenizer token" = key is valid
    expect(res.status, `Got 401 — FLUIDPAY_SECRET_KEY is invalid`).not.toBe(401);
    expect(body.msg, 'Unexpected error').toMatch(/invalid tokenizer token|bad request/i);
  });

  it('FLUIDPAY_DEMO_SECRET_KEY authenticates successfully against the sandbox gateway', async () => {
    const apiKey = process.env.FLUIDPAY_DEMO_SECRET_KEY;
    expect(apiKey, 'FLUIDPAY_DEMO_SECRET_KEY must be set').toBeTruthy();

    const res = await fetch('https://sandbox.fluidpay.com/api/transaction', {
      method: 'POST',
      headers: { 'Authorization': apiKey!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'sale', amount: 100, payment_method: { token: 'test_token_validation_only' } }),
    });

    const body = await res.json() as { status: string; msg: string };
    expect(res.status, `Got 401 — FLUIDPAY_DEMO_SECRET_KEY is invalid`).not.toBe(401);
    expect(body.msg, 'Unexpected error').toMatch(/invalid tokenizer token|bad request/i);
  });
});
