# SwiftDrop initial project audit — 2026-11-06

## Scope and verification
Root checkout: D:\canada project. Inventoried and programmatically scanned 594 source/config/document files across working copies, excluding dependencies, generated output, runtime data and .env secrets. Root src contains 232 files, 49 pages and 91 API routes (21,993 lines). Selected core implementations were manually inspected. This is an architecture/static audit, not a claim that every line or button has been independently verified. ZIP entry lists were inspected; archive contents were not audited. Images and runtime databases were not inspected.

Validation: npx tsc --noEmit --incremental false passed. No automated test files were found in the scanned project sources and package.json has no test script. README claims 19 regression checks, but those checks were not reproduced. Browser workflows and real provider delivery remain unverified.

## Folder map
- src/app: marketing pages, Merchant, Driver, Customer and Admin portals plus Next.js API handlers.
- src/components: reusable forms, actions, maps, tracking, chat, account and portal UI.
- src/lib: SQLite schema, repository, auth, pricing, dispatch, routing, notifications, upload storage, retention and shared services.
- scripts: setup, seed/demo history and administrator creation.
- public: service worker, manifest, icons and product screenshots.
- data: runtime persistence; .next and node_modules: generated output and dependencies.
- swiftdrop: alternative working copy; against root src, 69 identical files, 87 differing files and 76 absent files.
- swiftdrop-extracted: alternative extracted copy; 111 identical, 52 differing and 69 absent root source files.
- swiftdrop-scaffold/swiftdrop: no matching root source files found.
- Claude outputs: historical feature patch archives and a standalone db.ts.
- Root ZIPs: archived project versions. Do not merge these blindly into the current checkout.

## Architecture
Next.js 14 / React 18 / TypeScript / Tailwind. Credentials authentication uses NextAuth JWT sessions and bcrypt. Four portal roles are enforced by middleware and server-side helpers. SQLite uses node:sqlite and a central repository. Uploads are stored beside the database; identity files have encryption support. Order creation is shared across portal, API, CSV and recurring flows.

## Feature integration assessment
| Area | Evidence in code | Remaining verification/work |
|---|---|---|
| Accounts and approvals | Auth, signup, role guards, application review and account routes | Exercise each role, suspension, deletion and error cases |
| Order lifecycle | Creation, dispatch, accept, pickup, delivery photo, cancellation and return endpoints | End-to-end multi-role tests and failure/retry coverage |
| Tracking/maps | Driver location, live maps, geocoding and OSRM integration | Browser GPS permissions, provider availability and degraded operation |
| Merchant tools | Bulk upload, recurring orders, API keys and outbound webhooks | Duplicate submission handling, scheduling and delivery reliability |
| Notifications | Twilio SMS, Resend email and web push code | Credentials/configuration and actual delivery not verified; absent SMS/email credentials use audit logs |
| Money movement | Payout request ledger and administrator status updates | Real merchant charging, provider payouts and reconciliation absent; Stripe dependency alone does not implement payments |
| Support/safety | Tickets, chat, SOS, location sharing and admin review routes | Role/access checks and browser workflows |
| Deployment | Filesystem-backed DB/uploads and environment configuration | Persistent storage, backups, scheduled jobs and hosting validation |

## Concrete issues to address
1. Payment-provider integration is not implemented. Courier payout requests are recorded and admins manually mark them paid.
2. ActiveDeliveryCard.post/handleDeliver and PayoutPanel.request have fetch paths without try/finally recovery. A network rejection can leave busy state stuck and fail to show a useful error.
3. Recurring generation marks a schedule generated even when creation throws, preventing another attempt that day. Its UTC date key and local weekday/window calculations also need a consistent timezone policy.
4. Dispatch API requires a signed-in session. README cron examples alone do not establish authenticated unattended scheduling. Design and verify a dedicated job authentication path.
5. Outbound webhooks have timeout/error logging but the inspected sender has no signature or durable retry queue.
6. Multiple project copies and extensive pre-existing uncommitted changes exist. Use the root checkout as the provisional implementation target and preserve existing work.

## Suggested implementation sequence
1. Run isolated multi-role workflow checks and create a button-to-API checklist; fix broken flows and network-error recovery.
2. Add reliable recurring/dispatch jobs, duplicate protection and webhook retries.
3. Implement the chosen payment provider in test mode, including onboarding, charges, refunds, payouts and event reconciliation.
4. Verify notification providers, uploads and location workflows with the configured services.
5. Validate production build/deployment, persistent storage and end-to-end regression coverage.

No application implementation was changed during this audit. Generated companion artifact: PROJECT-FILE-INVENTORY.tsv (paths, line counts and hashes).
