import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(import.meta.dirname, '../scripts/audit-femi-birthday-party-payment.mjs'), 'utf8');

describe('Femi Birthday Party payment audit', () => {
  it('is read-only and checks both checkout links and completed-payment state', () => {
    expect(source).toContain('stripe.checkout.sessions.list');
    expect(source).toContain('stripe.paymentIntents.list');
    expect(source).toContain("metadata?.type === 'birthday_party_payment_link'");
    expect(source).not.toContain('checkout.sessions.create');
    expect(source).not.toContain('paymentIntents.create');
    expect(source).not.toContain('paymentIntents.confirm');
  });
});
