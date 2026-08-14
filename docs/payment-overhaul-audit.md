# Payment-System Overhaul Audit

## Audit result

MyDojo currently has a mixed payment estate. The student enrollment flow, Pro Shop, belt testing, and some event registrations use Stripe paths, while several public purchase paths and administrative payment tools still load the legacy FluidPay tokenizer directly. This split creates inconsistent browser behavior, separate failure handling, confusing operations reporting, and multiple recurring-billing implementations.

## Customer-facing paths identified

| Area | Current state | Target state |
|---|---|---|
| Membership enrollment | Stripe Payment Element with recurring subscription creation | Retain and harden as the membership standard |
| Shop | Stripe Checkout | Retain and standardize return, receipt, and fulfillment states |
| Belt testing and selected events | Stripe Checkout | Retain and standardize return, receipt, and fulfillment states |
| Custom payment links | FluidPay legacy path plus a partial Stripe path | Replace the customer flow with a Stripe-only hosted checkout path |
| Intro offers, day passes, family enrollment, summer camp, and open-house payments | Direct FluidPay tokenizer forms | Migrate to the shared Stripe checkout experience |
| Member kickboxing checkout | Direct FluidPay tokenizer embedded in the dashboard | Migrate to the shared Stripe checkout experience |
| Card updates and scheduled/admin payments | Mixed FluidPay and Stripe forms | Use Stripe Setup Intents and saved payment methods for new and migrated members |

## Failure patterns

The legacy tokenizer paths depend on third-party script loading, imperative iframe initialization, and independent state machines. They can remain blank or loading when script delivery, tokenization, or follow-up API calls fail. The current system also records some Stripe identifiers in legacy-named fields, which makes payment-status reconciliation and support work unreliable.

## Architecture decision

All **new** customer payments will use Stripe only. One-time charges will use a shared Stripe Checkout session with consistent success/cancel return pages. New memberships will continue with the secure Stripe Payment Element so a payment method is authorized for future off-session recurring charges. Existing legacy subscriptions will remain readable for historical continuity, but new customer forms will no longer initialize the FluidPay tokenizer.
