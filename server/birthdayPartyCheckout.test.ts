import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, 'routers.ts'), 'utf8');
const pageSource = fs.readFileSync(path.resolve(import.meta.dirname, '../client/src/pages/BirthdayParties.tsx'), 'utf8');
const webhookSource = fs.readFileSync(path.resolve(import.meta.dirname, 'stripeWebhook.ts'), 'utf8');

describe('Birthday Party deposit checkout', () => {
  it('creates server-priced 50% deposits for each published package', () => {
    expect(routerSource).toContain("createCheckout: publicProcedure");
    expect(routerSource).toContain("ninja: { name: 'Ninja Party', totalCents: 19_900, depositCents: 9_950 }");
    expect(routerSource).toContain("champion: { name: 'Champion Party', totalCents: 29_900, depositCents: 14_950 }");
    expect(routerSource).toContain("blackbelt: { name: 'Black Belt VIP Party', totalCents: 44_900, depositCents: 22_450 }");
    expect(routerSource).toContain("stripe.checkout.sessions.create");
    expect(routerSource).toContain("type: 'birthday_party_deposit'");
    expect(webhookSource).toContain('session.metadata?.type === "birthday_party_deposit"');
    expect(webhookSource).toContain('handleBirthdayPartyDeposit(session)');
  });

  it('redirects the public booking form to the secure checkout instead of only sending a request', () => {
    expect(pageSource).toContain('trpc.birthday.createCheckout.useMutation');
    expect(pageSource).toContain('window.location.assign(checkoutUrl)');
    expect(pageSource).toContain('PAY 50% DEPOSIT & REQUEST DATE');
  });
});
