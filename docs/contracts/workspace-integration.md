# Workspace integration contract

React uses Django sessions and CSRF through the Vite /api proxy. It never calls Supabase directly.

GET /api/v1/workspace/ returns the current user, allowed users, workspace settings, scoped customers, products, plans, discounts, quotations, subscriptions, invoices, payments, billing runs, audit entries and server-calculated metrics. All monetary fields are decimal strings. Anonymous requests return 403. Customer records are filtered by the signed-in user, not a supplied customer ID. Internal-only notes, cost prices, team data and billing runs are omitted or masked for customers.

POST /api/v1/workspace/ accepts { action, payload } and returns { id }. The client reloads the server snapshot after a successful mutation. Payload conventions are {data: fields} for create/updateSettings, {id,data: fields} for updates, {id} for lifecycle actions, {id,reason} for pause, {id,enabled} for auto-renew, and {targetDate?} for billing.

Actions: create/update/archiveCustomer; create/updateProduct; create/updatePlan; create/updateDiscount; create/send/accept/rejectQuotation; convertQuotationToSubscription; create/activate/pause/resume/closeSubscription; setSubscriptionAutoRenew; runBillingEngine; issue/voidInvoice; recordPayment; updateSettings. Names use camelCase (for example createCustomer). Archive is archiveCustomer.

Each command executes in one database transaction with a workspace command lock and a persistent audit entry. Customer-facing commands are restricted to their own plan requests, sent-quote acceptance/rejection, and auto-renew preferences. Customers cannot mark invoices paid. Only admins write products, discounts and settings. Internal staff perform operational commands. Legacy endpoints also require authenticated role checks.

The adapter maps UI fields to existing domain models: product.code to sku, plan.frequency to billing_frequency, quotation.number to quotation_number, invoice confirmed/cancelled to issued/void, and partial paid balances to partially_paid. No client-provided totals, document numbers, actor identities or protected statuses are trusted. Customer quotation prices come from the selected plan.

## Supported boundaries

- One plan per quotation and products belonging to that plan. Mixed tax rates require separate quotations.
- One-time setup fee billing is not implemented: nonzero setup fees return a validation error.
- Payment allocations must use the full payment amount. Multi-invoice allocations are transactional and persisted as one payment record per invoice; unallocated credit is rejected.
- Invoice email delivery, password reset delivery, payment gateways, automated renewal charging and staff invitation UI are not configured in this integration. The UI does not simulate payment or password-reset success.
- Notifications have no fabricated seed entries. Audit history is persisted; the notification tray is currently empty.
- Snapshot lists load all allowed records; large-dataset pagination and performance benchmarking remain follow-up work.
- Database migration identity.0004 protects the two new workspace tables with RLS and revoked Data API grants. It is intentionally irreversible, matching the earlier security migration.

## Validation

15 backend tests pass on isolated SQLite, including the full quote/subscription/billing/partial-payment flow, customer isolation, overpayment rollback and CSRF session login/logout. 51 frontend tests pass, including server-backed hydration, persistence across remount and rejected-save behavior. Production build and lint pass (existing lint warnings and bundle-size warning remain).

Live Supabase: catalogue/customer/plan/quote conversion and fresh-session reads passed in a rolled-back transaction. Browser: a customer created through the React form remained visible after full reload and was independently confirmed in PostgreSQL, then removed as a disposable verification record. New tables retain RLS. No credentials are committed.

## Local demo role entry points
Run python manage.py setup_demo_logins and set ENABLE_LOCAL_DEMO_LOGIN=True in the private backend .env for local demonstrations. GET /api/v1/auth/demo-login/ reports availability; POST with role admin/staff/customer creates a real Django session for a fixed synthetic demo identity. CSRF is mandatory. The endpoint is disabled unless DEBUG, explicit opt-in, a loopback host and a loopback client are all present. These accounts have unusable passwords and cannot use normal password login. Do not enable this feature for a deployed service. The Customer identity is linked to the DEMO Acme profile.

Merge note: purchasePlan is an explicitly local-demo-only checkout action for the fixed demo customer identity. It persists a synthetic subscription, invoice and payment atomically with server prices. Normal customer accounts must request quotations; no real card details are transmitted or stored. Client-only pricing localization is not applied to authoritative server records.
