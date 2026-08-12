# Student Dashboard Audit

## Current Route Review

The current `/dashboard` route was visually reviewed in the development preview on 2026-08-11. The page renders as a dense desktop dashboard with a narrow top navigation containing Dashboard, Curriculum, Meal Plan, Progress, Messages, My Children, Billing, and MyDojo Bucks. The initial overview presents Today’s Classes, progress, achievements, quick actions, goals, announcements, latest messages, and payment history in a multi-column card grid.

## Design Implications

The existing dashboard already has the necessary data hooks and functional areas, but its desktop-first top navigation and large number of simultaneous cards conflict with the desired mobile-first member experience. A safe redesign should preserve the active-tab data model and account/billing actions while replacing the overview shell and presenting fewer priority actions at once.

## Proposed Member Experience

The redesign will use a concise dashboard header and a single priority overview: the member’s next class, current belt progress, unread messages, and account status. Secondary actions should remain one tap away rather than appearing as a dense grid.

On mobile, a five-item bottom navigation should map the requested member experience onto existing, working areas:

| Mobile item | Primary dashboard area | Preserved access |
| --- | --- | --- |
| Home | Dashboard overview | Today’s classes, check-in, announcements |
| Benefits | Progress and curriculum | Belt progress, curriculum, achievements |
| Locate | Class/schedule discovery | Current class location and schedule |
| Shop | Member perks and bucks | MyDojo Bucks and shop link |
| Account | Billing and family | Payment history, membership actions, children |

Messages remains accessible from the header with its unread indicator. The desktop navigation retains all complete feature areas until a later dedicated desktop refresh, avoiding removal of existing billing, curriculum, family, and messaging functions.

## Observed Preview

- Route: `https://3000-if0s3rl3ksqfaabtqbmnc-b1c5456d.us2.manus.computer/dashboard`
- Screenshot: `/home/ubuntu/screenshots/3000-if0s3rl3ksqfaab_2026-08-11_23-59-11_6349.webp`
- The preview loaded the existing student dashboard after its initial loading state.
