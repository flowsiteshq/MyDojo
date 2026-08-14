# Private $1 Recurring Billing Test

## Purpose

The **Private $1 Recurring Test** is a live monthly subscription used only to verify that the current checkout, subscription, and recurring-payment setup can process a real transaction. It is configured as **invitation-only**, so it does not appear on the public enrollment page.

| Setting | Value |
| --- | --- |
| Price | $1.00 per month |
| Initial charge | $1.00 |
| Visibility | Administrator-only checkout; excluded from public enrollment |
| Package record | `Private $1 Recurring Test` |
| Checkout type | Hosted subscription checkout |

## Staff workflow

An authorized staff member or administrator opens **Admin → Membership Packages** and selects **$1 Recurring Test**. The action creates a new hosted checkout session on demand and transfers the authorized user to the secure checkout page. The resulting subscription renews at $1 per month unless it is cancelled.

> Use a recognizable email address when completing the test so the resulting subscription can be found and cancelled promptly.

## Verification and cleanup

After completing the $1 charge, verify that the subscription is active in the payment dashboard and that the applicable webhook activity has been received. To clean up, open the payment dashboard, locate the subscription by the email used for the test or the **MyDojo $1 Recurring Test** product, then cancel the subscription immediately. This test checkout is not a student enrollment, so no MyDojo enrollment record needs to be cancelled afterward. The private MyDojo package should remain active and invitation-only for future controlled tests; do not activate it for public enrollment.
