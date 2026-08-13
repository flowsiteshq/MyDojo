# Stripe Recurring Apple Pay Implementation Notes

Source: [Stripe — Manage recurring payments on Apple Pay](https://docs.stripe.com/apple-pay/apple-pay-recurring), accessed August 13, 2026.

For Apple Pay recurring billing, Stripe requires the first on-session customer-initiated transaction to consume the wallet cryptogram promptly. A `PaymentIntent` with `setup_future_usage=off_session`, or a `SetupIntent` with `usage=off_session`, creates the required reusable payment method for later merchant-initiated recurring charges. Stripe then uses the device or merchant account number together with the original network transaction reference to improve later authorization rates.

Apple Pay saved payment methods are for **off-session** recurring use. For a new on-session purchase, the member must authorize a new wallet transaction. Stripe Checkout and Elements apply the recommended Apple Pay recurring-payment behavior when configured for saved payment methods and recurring use.

For memberships, Stripe’s recurring-payments guide recommends a Stripe Subscription with a saved default payment method. The implementation must retain only Stripe token IDs and display-safe card metadata (brand, last four digits, expiration, wallet type); it must never store full card numbers or CVV values.
