# Legacy Payment Reference Inventory

> **Audit scope:** every source file returned by the final case-insensitive search for `fluidpay`, legacy token fields, or prior charge helpers. New payment collection is Stripe-only.

| File | Classification | Active payment capability |
|---|---|---|
| `client/src/components/FluidPayEnrollmentForm.tsx` | Historical filename; current secure enrollment component | Stripe PaymentIntent only |
| `client/src/components/IntakeChatbot.tsx` | Imports the historical-named enrollment component | Stripe-only via imported component |
| `client/src/pages/Enroll.tsx` | Imports historical-named enrollment component | Stripe-only |
| `client/src/pages/Shop.tsx` | Historical migration comment | None |
| `client/src/pages/AdminBilling.tsx` | Historic event display | Read-only archive |
| `client/src/pages/AdminBillingSchedule.tsx` | Historic record field display | No legacy charge action |
| `client/src/pages/AdminCampEnrollments.tsx` | Historic transaction field fallback | Read-only export |
| `client/src/pages/AdminEnrollments.tsx` | Historic enrollment fields | Read-only display |
| `client/src/pages/AdminPackages.tsx` | Legacy schema field typing only | No provider setup UI |
| `client/src/pages/AdminStudents.tsx` | Legacy source badge mapped to “Legacy Import” | Read-only display |
| `drizzle/schema.ts` | Historic ID columns preserved for existing rows | Data compatibility only |
| `server/_core/env.ts` | Retained environment compatibility keys | No call site in active payment flow |
| `server/_core/index.ts` | No legacy webhook registration remains | None |
| `server/billingHealthCheckJob.ts` | Migration health diagnostics | Read-only provider lookup |
| `server/memberDashboard.ts` | Legacy transaction/subscription history | Read-only lookup |
| `server/routers.ts` | Historic reporting and compatibility fields | No legacy creation or charge mutation |
| `server/fluidpayHelper.ts` | Archived helper module | Not imported by active payment routes |
| `server/fluidpayWebhook.ts` | Archived webhook handler | Route removed; unreachable |
| `server/stripeHelper.ts` | Compatibility mapping for historical records | Stripe creates all new payments |
| `server/*legacy*.test.ts`, `server/fluidpay.test.ts` | Migration and historical regression tests | Test-only |
| `server/paymentOverhaul.test.ts` | Stripe-only enforcement tests | Test-only |

## Callable-path result

The active server no longer registers `/api/fluidpay/webhook`, installs a provider-specific global fetch wrapper, exposes legacy token/nonced creation procedures, or schedules legacy automatic charges. Existing `fluidpay*` columns and helper names are retained only so historic records remain reportable. All new customer payments, saved-method setup, subscriptions, event registrations, shop orders, camps, and scheduled charges use Stripe contracts.

**Callable-path verification:** the final active-flow search returned exactly two legacy-provider URLs, both in `server/routers.ts`: transaction search and recurring subscription retrieve. They are read-only history lookups. No legacy webhook route, tokenizer, payment nonce, card-token, vaulted-card charge, or legacy payment-creation path remains reachable.

## Customer and staff wording result

Customer-facing pages use neutral secure-payment language. Staff screens label retained historic values as payment history, payment record ID, or legacy import; they no longer provide legacy processor setup, plan configuration, card capture, or charge actions.
