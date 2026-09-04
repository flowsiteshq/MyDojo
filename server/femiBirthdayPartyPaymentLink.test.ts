import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const source = fs.readFileSync(path.resolve(import.meta.dirname, '../scripts/send-femi-birthday-party-payment-link.ts'), 'utf8');

describe('Femi Birthday Party payment link', () => {
  it('creates only a guarded one-time $299 checkout and one recipient message', () => {
    expect(source).toContain('FEMI_BIRTHDAY_LINK_APPROVED !== "create-and-send"');
    expect(source).toContain('const AMOUNT_CENTS = 29_900');
    expect(source).toContain('mode: "payment"');
    expect(source).toContain('type: "birthday_party_payment_link"');
    expect(source).toContain('sendSms({ to: phone, message })');
    expect(source).toContain('a $299 payment is already paid or processing');
    expect(source).toContain('an unpaid $299 link is already open');
    expect(source).not.toContain('subscriptions.create');
  });
});
