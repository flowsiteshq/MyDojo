# MyDojo Billing Recovery — Approval Checklist

This release is intentionally staged. It adds read-only reconciliation policies, an admin review queue, a family-scoped statement, six-month prepaid quote rules, and SMS dry-run preview. It does not call processor mutation APIs.

## What is safe in this release

- Reconciliation groups source records by family and billing period.
- Same-enrollment settled duplicates become `duplicate_candidate`; separate enrollment IDs remain `authorized_family_charge` unless other evidence changes the classification.
- Refunds, credits, disputes, retry failures, and identity mismatches remain review cases.
- The family statement is authenticated and email-scoped. It exposes processor and safe enrollment metadata but does not infer a paid-through date from incomplete legacy data.
- Six-month prepaid quotes are non-renewing, existing-member-only, exclude enrollment fees, apply 10% to the actual chargeable monthly amount, and reject overlap with an active recurring period.
- SMS is preview-only. Opt-outs and quiet hours suppress drafts, and the secure path must be relative; balances and sensitive details are not included in the text.

## Migration

Apply only the additive forward migration `drizzle/0082_billing_recovery.sql` after review. It creates:

- `billingReconciliationCases`
- `prepaidTuitionIntents`
- `billingSmsDrafts`

No existing table is dropped, renamed, or rewritten. No raw card data is stored. The migration must be applied through the normal Drizzle migration process, not a destructive schema push.

## Admin review sequence

1. Import or stage read-only source evidence from Stripe, FluidPay, PayPal, and CRM.
2. Compare transaction IDs, enrollment IDs, billing periods, status, refund state, credits, and family membership.
3. Review duplicate candidates and identity mismatches.
4. Record an approval/rejection/resolution decision in the queue.
5. Only after a separate owner approval should a future operational adapter be enabled for a specific processor and exact record set.

This release contains no cancellation, refund, charge, retry, or SMS-send adapter. Never cancel records belonging to an unverified Flowsites Corp Stripe account.

## Six-month prepaid amounts

| Plan | Monthly base | Six-month price after 10% discount |
|---|---:|---:|
| Basic | $149.00 | $804.60 |
| Black Belt | $199.00 | $1,074.60 |
| Leadership | $249.00 | $1,344.60 |

For family members, calculate from the verified family-discounted monthly amount first, then apply the 10% prepaid discount. Do not stack a second discount against the full price. Existing members do not pay the $99 enrollment fee for migration. Prepaid coverage starts after the verified paid-through date and does not renew automatically.

## SMS approval rules

Generate a dry-run preview and recipient count first. Verify opt-out, quiet-hours, segment, and secure-login-path checks. Do not include balances, transaction IDs, or sensitive payment details in generic SMS. Sending requires a separate explicit owner approval and a provider-side opt-in check.

## Deployment and rollback

No deployment is included in this branch. Before deployment, run `pnpm check` and the focused billing-recovery tests, apply the additive migration in staging, and verify PayPal health without treating health as proof of webhook delivery.

Rollback is code rollback plus leaving the additive tables in place for audit history. Do not delete the tables or source evidence during rollback. Disable the new UI route if necessary, then restore the previous application release. Any operational action requires its own approval and processor verification.

## Main CRM

[DojoFlow / Kai CRM](https://dojoflowapp.com/)
