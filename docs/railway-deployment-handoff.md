# MyDojo Railway Deployment Handoff

## Scope and current readiness

MyDojo is a single Node.js service containing the React frontend and Express/tRPC backend. Railway can use the repository’s existing build and start scripts without a Dockerfile:

| Railway service setting | Value |
| --- | --- |
| Source | `flowsiteshq/MyDojo` GitHub repository |
| Build command | `pnpm build` |
| Start command | `pnpm start` |
| Runtime | Node.js with Corepack/pnpm enabled |
| Service type | One web service only; retain a single replica until recurring jobs are moved out of the web process |

The server already reads Railway’s injected `PORT` environment variable. Railway can also detect package scripts automatically, but setting the build and start commands explicitly avoids ambiguity. [1]

## Required Railway variables

Add the following values through Railway’s **Variables** screen. Keep every credential sealed; do not commit a `.env` file or paste values into source code. Railway exposes service variables to both builds and running deployments. [2]

| Area | Variables to provide | Required action |
| --- | --- | --- |
| Database | `DATABASE_URL` | Point this to a database reachable from Railway. Confirm that the current MyDojo database permits Railway network access before deployment. |
| Application security | `JWT_SECRET`, `OWNER_OPEN_ID`, `OWNER_NAME` | Use the existing production values; changing `JWT_SECRET` invalidates current user sessions. |
| App URL | `PUBLIC_SITE_URL`, `VITE_APP_URL` | Set both to the final HTTPS Railway custom domain, for example `https://www.mydojoma.com`. |
| Payments | `STRIPE_LIVE_SECRET_KEY`, `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Create or update the payment webhook destination after the Railway domain is active: `https://<production-domain>/api/stripe/webhook`. |
| Email and SMS | `RESEND_API_KEY`, `VITE_EMAIL_FROM`, `EIGHT_HUNDRED_API_KEY`, `EIGHT_HUNDRED_FROM_NUMBER` | Preserve the current production configuration and update inbound SMS callback destinations where applicable. |
| Lead and CRM integrations | `DOJO_FLOW_URL`, `DOJO_FLOW_EMAIL`, `DOJO_FLOW_PASSWORD`, `GHL_API_KEY`, `SYNC_EXPORT_API_KEY` | Re-enter the current values securely; the existing GHL token should be corrected because the current logs show authentication failures. |
| Facebook lead flow | `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Update the Meta lead webhook to `https://<production-domain>/api/facebook/webhook` after the Railway domain is active. |
| Other enabled integrations | `ELEVENLABS_API_KEY`, `FLUIDPAY_DEMO_SECRET_KEY`, `FLUIDPAY_SECRET_KEY`, `FLUIDPAY_WEBHOOK_SECRET` | Add only if the associated legacy/admin features remain in use. No new customer payments should use the legacy processor. |

## Critical migration blockers

The current site depends on `/manus-storage/*` URLs for product imagery, including the new sparring gear assets. Its storage proxy obtains signed asset links through Manus-provided Forge credentials, which Railway will not supply automatically. Before switching customer traffic to Railway, migrate these images to a host accessible from Railway, update the image URLs, and verify the shop visuals.

The app also starts multiple recurring SMS, sync, billing, and social-post jobs inside the web server process. A Railway web service restart can rerun the startup jobs, and multiple replicas would duplicate schedules. Deploy with exactly one replica at first, then move those interval jobs to dedicated Railway cron/worker services with an idempotency review.

Finally, verify all external callback settings after the new domain is live. This includes payment webhooks, Meta lead webhooks, inbound SMS callbacks, authentication/reset links, and any CRM callback URLs. A Railway health check should call an endpoint that returns HTTP 200 only after the service is ready; Railway routes traffic to a new deployment only after that health check succeeds. [3]

## Deployment sequence

1. Create a Railway project and connect the `flowsiteshq/MyDojo` repository.
2. Add all required variables as sealed Railway service variables.
3. Set the build command to `pnpm build` and start command to `pnpm start`.
4. Deploy to a temporary Railway domain and verify the homepage, `/shop`, direct login, database-backed pages, and product images.
5. Configure a custom domain, set `PUBLIC_SITE_URL` and `VITE_APP_URL`, then redeploy.
6. Update payment, Meta, SMS, and CRM webhooks to the final HTTPS domain. Test each inbound route before sending any marketing message or accepting a customer order.
7. Confirm the $195 sparring package is visible and can create a checkout session, without completing a live payment.

## References

[1] [Railway — Build and Start Commands](https://docs.railway.com/builds/build-and-start-commands)

[2] [Railway — Using Variables](https://docs.railway.com/variables)

[3] [Railway — Healthchecks](https://docs.railway.com/guides/healthchecks)
