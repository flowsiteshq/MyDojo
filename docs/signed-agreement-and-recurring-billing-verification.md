# Signed Agreement and Recurring Billing Verification

## Enrollment agreement

The agreement component now requires a handwritten signature drawn on screen. On completed enrollment, the signature image is stored separately and embedded in a generated PDF agreement. The member Account Documents panel shows the recorded signature and provides an **Open signed PDF** link when the stored artifact is available.

The PDF renderer was exercised directly and produces a valid `%PDF` document. It buffers pages before adding footer text so multi-page signed agreements render reliably.

## Recurring billing and payment-method records

New paid membership enrollments create a secure payment intent configured with `setup_future_usage=off_session`. After the member authorizes card or eligible Apple Pay checkout, the system creates a monthly subscription that uses the saved method and stores only display-safe metadata: card brand, last four digits, expiration, wallet type, payment-method ID, and recurring subscription ID. Full card numbers and CVV values are never stored.

Summer camp enrollments use the same secure payment entry but are stored as a one-time purchase without creating a recurring subscription. Updating a saved membership payment method also refreshes the safe metadata shown in Account.

## Verification

TypeScript is clean. Focused Account, payment-copy, signed-agreement, PDF-rendering, and recurring-billing regression suites pass with 9 total tests. Stripe’s official Apple Pay recurring-payment guidance is recorded in `docs/stripe-apple-pay-recurring-notes.md`.

Apple Pay availability is device, browser, wallet, and domain dependent. The configured enrollment flow exposes it through Stripe’s express checkout element and creates an off-session reusable method when eligible. A compatible iPhone/Safari wallet should complete one live enrollment verification after this checkpoint is published; no payment was created during automated validation.
