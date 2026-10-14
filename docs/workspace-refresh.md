# Mobile workspace and Portfolio access

The workspace keeps Bhada's charcoal and gold identity. DM Sans handles working screens and numbers; Gotu remains in the brand. Palette: canvas `#111111`, surface `#191919`, text `#edede8`, secondary text `#a7a7a1`, hairline `#343431`, action gold `#e4c77a`.

The layout puts rent collected and pending first, followed by recent payments, income history and properties. Bottom navigation stays within reach, including settings under More. Account guidance explains the trial without requiring a card.

| Before | After | Why |
| --- | --- | --- |
| Four metrics with decorative trend arrows | One rent summary with actual collection progress | Avoid implying changes that weren't calculated |
| Repeated collection charts | Recent payments directly below the summary | Keep routine work near the top |
| Settings behind the top menu | More in bottom navigation; accessible shadcn Sheet | Reachable on a phone, with focus management |
| Small controls, dim secondary text | 44px buttons, higher contrast, 16px mobile inputs | Easier tapping and reading; prevent input zoom |
| Section entry animations | Immediate section changes; reduced-motion support | Frequent navigation stays responsive |
| No introduction to the update | Dismissible, replayable four-step walkthrough | Existing users can learn the new layout |

## Access rules

- Paid access requires an active/pending Portfolio subscription and an unexpired current period. Authentication alone does not unlock Portfolio. Cancelled, completed, expired, paused and halted states do not unlock it, even with a future date or stale cancellation flag.
- A never-subscribed free account can explicitly start one 7-day trial. The existing `saas_billing_event` ledger stores a deterministic `portfolio_trial_<landlordId>` event using server time and a unique primary key. No database migration is required. Trial rows have provider `bhada`, zero amount and event type `portfolio.trial_started`; they are not receipts or revenue.
- A captured paid transaction revokes trial access. A later downgrade or new checkout cannot revive it. Repeated activation requests cannot reset the start date.
- At expiry, CSV export is denied by its route. The oldest property and its oldest three units remain writable on One Door; excess rentals remain visible. Edits, tenant creation/movement, payment recording, electricity billing and automatic rent generation respect server-side rental access. Deletion remains available to let users reduce their portfolio; it retains existing destructive confirmation.
- Property/unit creation counts are checked inside a transaction after taking an account row lock to prevent concurrent requests exceeding the plan limit.
- Webhooks reconcile current provider state rather than trusting stale event status. Conditional writes avoid overwriting a concurrently changed billing account. Checkout verification and cancellation use the same concurrent-change protection.
- Browser expiry refreshes and disabled controls improve the experience; server checks remain authoritative.

## Verification

`npm test` runs financial-metric, access-policy and route/action regression tests with external services mocked. `npm run lint` and `npm run build` check the app. Real payments are not made by these tests.

The UI fixture at `scripts/fixtures/workspace.tsx` uses synthetic rentals. `npm run test:ui` temporarily mounts it, starts a local development server, runs phone/tablet/desktop checks, writes screenshots to ignored `artifacts/ui`, and removes the preview route. It requires Microsoft Edge for Playwright's `msedge` channel. It never creates accounts or writes rental records.

Before releasing billing changes, exercise Razorpay's test-mode activation, cancellation and renewal webhooks against the staging database. No production deployment or live subscription changes are part of this update.
