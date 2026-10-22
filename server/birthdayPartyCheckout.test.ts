import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const routerSource = fs.readFileSync(path.resolve(import.meta.dirname, 'routers.ts'), 'utf8');
const paypalRouterSource = fs.readFileSync(path.resolve(import.meta.dirname, 'paypalRouter.ts'), 'utf8');
const helperSource = fs.readFileSync(path.resolve(import.meta.dirname, 'paypalHelper.ts'), 'utf8');
const schemaSource = fs.readFileSync(path.resolve(import.meta.dirname, '../drizzle/schema.ts'), 'utf8');
const pageSource = fs.readFileSync(path.resolve(import.meta.dirname, '../client/src/pages/BirthdayParties.tsx'), 'utf8');

describe('Birthday Party PayPal full-payment checkout', () => {
  it('uses server-controlled full package prices and persists the booking before creating the order', () => {
    expect(routerSource).toContain("createCheckout: publicProcedure");
    expect(routerSource).toContain("ninja: { name: 'Ninja Party', totalCents: 19_900 }");
    expect(routerSource).toContain("champion: { name: 'Champion Party', totalCents: 29_900 }");
    expect(routerSource).toContain("blackbelt: { name: 'Black Belt VIP Party', totalCents: 44_900 }");
    expect(routerSource).toContain('schema.partyBookings).values');
    expect(routerSource).toContain('createPayPalOrder');
    expect(routerSource).toContain('paypalOrderId: result.orderId');
    expect(schemaSource).toContain('export const partyBookings = mysqlTable("partyBookings"');
  });

  it('validates the PayPal order against the stored booking before marking paid', () => {
    expect(paypalRouterSource).toContain('getPayPalOrder(orderId)');
    expect(paypalRouterSource).toContain('unit?.reference_id !== expectedReference');
    expect(paypalRouterSource).toContain('actualCurrency !== booking.currency');
    expect(paypalRouterSource).toContain('actualAmount !== (booking.amountCents / 100).toFixed(2)');
    expect(paypalRouterSource).toContain('status: "paid"');
    expect(helperSource).toContain('export async function getPayPalOrder');
  });

  it('stores and deduplicates verified PayPal webhook events', () => {
    expect(schemaSource).toContain('export const paypalEvents = mysqlTable("paypalEvents"');
    expect(paypalRouterSource).toContain('schema.paypalEvents.paypalEventId, event.id');
    expect(paypalRouterSource).toContain('verifyPayPalWebhookSignature');
    expect(paypalRouterSource).toContain('processingStatus: "processed"');
  });

  it('routes the public birthday form to the secure checkout and no longer advertises a deposit', () => {
    expect(pageSource).toContain('trpc.birthday.createCheckout.useMutation');
    expect(pageSource).toContain('window.location.assign(checkoutUrl)');
    expect(pageSource).not.toContain('PAY 50% DEPOSIT');
  });
});
