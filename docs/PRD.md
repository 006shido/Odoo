# BRIGHTLOOP
## Software Subscription Management System
### Product Requirements Document (PRD)

**Document version:** 1.0  
**Date:** 31 October 2026  
**Status:** Refined working baseline for implementation  
**Product:** Brightloop Software Subscription Management System

> **Requirements provenance.** This PRD consolidates the Brightloop requirements previously surfaced in the project conversation. The uploaded `Subscription_Management_System.pdf` could not be parsed in this session, so this is not represented as a word-for-word extraction or verification of that PDF. Items marked **Proposed default** are product decisions made to make the MVP implementable; confirm them with the project owner before production use.

---

# 1. Executive summary

Brightloop is a subscription operations platform for a business that sells products or software access through recurring plans. It centralizes the commercial and operational lifecycle: customer records, product catalogue, subscription plans, quotations, subscription activation and lifecycle changes, recurring invoices, discounts, payment allocation, and business reporting.

The product should replace fragmented spreadsheets and manual follow-up with a traceable workflow. A staff member should be able to configure a product and plan, prepare a quotation, convert an accepted quotation into a subscription, generate invoices on schedule, record full or partial payments, and see the resulting account status. Customers should have a restricted portal to review their own commercial documents and subscription information.

The first release is a polished, single-organization business application with three roles: Admin, Staff, and Customer. The system must prioritize correct money handling, secure customer-data isolation, a dependable recurring-billing process, and a premium, professional interface.

# 2. Product vision and positioning

**Vision:** Make recurring-subscription operations clear, controlled, and dependable from the first quotation to the final payment.

**Positioning:** Brightloop is an operational control center for teams managing customer subscriptions, not a payment processor and not a general-purpose accounting suite.

**Core promise:** Every customer, plan, subscription, invoice, payment, and lifecycle event is connected and auditable.

## 2.1 Product principles

1. **One source of truth:** commercial data is stored once and reused through the workflow.
2. **Financial correctness first:** money uses decimal-safe calculations, immutable document snapshots, and transactional updates.
3. **Lifecycle clarity:** statuses and permitted transitions are explicit and visible.
4. **Least privilege:** every API action checks role and record ownership on the server.
5. **Operational transparency:** scheduled billing can be inspected, retried safely, and audited.
6. **Premium usability:** a restrained, polished visual system supports serious daily work without visual clutter.

# 3. Goals, success measures, and non-goals

## 3.1 MVP goals

- Maintain customers, products, variants, and subscription plans.
- Create, send, accept, reject, and convert quotations.
- Activate, pause, resume, renew, close, and expire subscriptions.
- Generate recurring invoices without duplicates when a billing job is retried.
- Record payments, including partial payments, and allocate them to invoices.
- Provide role-appropriate dashboards and a customer self-service portal.
- Keep a clear audit trail for important commercial and financial actions.

## 3.2 Proposed success measures

| Measure | MVP target / definition |
|---|---|
| Core workflow completion | A demo user can complete quote → subscription → invoice → payment without manual database edits. |
| Billing safety | Re-running the same billing job does not create a duplicate invoice for a subscription billing period. |
| Financial integrity | Invoice totals, balances, and allocations reconcile to the cent/paisa using decimal arithmetic. |
| Access control | No customer can read another customer's records through the UI or API. |
| Performance | Common dashboard/list/detail API responses target under 2 seconds at the agreed demo workload; measure rather than assume. |
| Usability | Primary admin workflows have clear loading, empty, error, success, and confirmation states. |
| Reliability | Failed scheduled runs are logged and can be safely rerun. |

## 3.3 Non-goals for the first release

- Online card/UPI payment gateway integration or storage of card data.
- Full accounting/general-ledger, tax filing, or statutory compliance automation.
- Multi-organization SaaS tenancy and organization-to-organization data isolation.
- Multi-currency accounting, FX conversion, or consolidated foreign-currency reports.
- Complex proration, credit-note workflows, refunds, dunning sequences, or automated collections.
- Native mobile applications.
- A public app marketplace or product-led SaaS signup funnel.

# 4. Users, roles, and permissions

## 4.1 Admin

The Admin owns the Brightloop workspace. Admin can manage staff accounts, workspace settings, customers, catalogue, plans, quotations, subscriptions, invoices, discounts, payments, reports, and audit history. Only Admin can create or deactivate Staff users and change sensitive workspace-wide settings.

## 4.2 Staff

Staff handle daily customer and subscription operations. Staff can create and update customers, products, variants, plans, quotations, subscriptions, invoices, discounts, and payment records according to the standard Staff permission set. Staff cannot create/deactivate Admin or Staff accounts, change authentication/security settings, or alter workspace-wide numbering and currency settings. Record deletion is restricted; archive/void/close actions are preferred.

## 4.3 Customer

A Customer account is optionally linked to a Customer profile. Customers can view only their own profile, quotations, subscriptions, invoices, and payment history. They can accept or reject quotations where enabled, download their documents, and update limited contact details. Customers cannot access internal notes, other customers' data, staff-only pricing controls, or internal reports.

## 4.4 Authorization requirements

- Apply authentication and authorization on every protected API endpoint.
- Enforce customer ownership filters in server-side querysets; hiding a link in the UI is not access control.
- Use Django permissions/groups for role-level access and explicit object-ownership checks for Customer access.
- Deny by default when a role or permission is unknown.
- Audit user/role changes and sensitive financial actions.

# 5. Product scope and feature requirements

Priority key: **P0** = release-critical; **P1** = important MVP enhancement; **P2** = later.

## FR-01 Authentication and account access (P0)

- Sign in and sign out using the Django-managed identity system.
- Passwords must be stored using Django's password hashers; never store plaintext passwords.
- Provide secure password reset flow by email.
- Support Admin, Staff, and Customer roles.
- Create a custom Django user model before the first migration.
- Admin creates Staff accounts; Staff cannot self-promote or create privileged users.
- Customer accounts may be invited/created by Admin or Staff; public self-registration is disabled in MVP (**Proposed default**).
- Rate-limit or otherwise protect login and password-reset endpoints against abuse.

## FR-02 Customer management (P0)

- Create, view, edit, search, filter, and archive customer profiles.
- Store customer name/company name, email, phone, billing address, tax/business identifier where applicable, status, notes, and timestamps.
- Email should be unique at the account level where required; customer contact email may be shared only if the chosen business rule allows it.
- Link an optional portal user to the customer profile.
- Display related quotations, subscriptions, invoices, and payments on the customer detail page.

## FR-03 Product catalogue and variants (P0)

- Create and manage products with name, SKU/code, description, category, status, and default pricing metadata.
- Support product variants where an item has different editions, tiers, or configurations.
- A variant has a unique code within the catalogue, description/attributes, and active/archived status.
- Archive products/variants that are already referenced; do not hard-delete historical commercial records.

## FR-04 Subscription plans and pricing (P0)

- Create plans from products and variants with line-item quantities and agreed prices.
- Support daily, weekly, monthly, and yearly billing frequencies.
- Store plan price, optional one-time/extra charges, minimum quantity, availability start/end dates, and active status.
- Validate quantity, dates, frequency, and price before a plan can be offered.
- Support manual/automatic renewal configuration and whether pause is allowed.
- Preserve historical price snapshots in accepted quotations and subscriptions. Editing a catalogue price must not silently change an active subscription.

## FR-05 Quotations (P0)

- Create quotations for a customer with one or more plan/product lines, quantities, price snapshots, discounts, tax, payment terms, expiry date, and notes.
- Provide consistent quotation numbering and a professional PDF representation.
- Support Draft, Sent, Accepted, Rejected, Expired, and Converted lifecycle states.
- Accepted quotations become read-only commercial records; changes require a new revision or a documented amendment.
- Convert an accepted quotation to a subscription with a traceable source reference. Prevent duplicate conversion.
- Record acceptance actor and timestamp.

## FR-06 Subscription management (P0)

- Create a unique subscription number.
- Store customer, source quotation (if applicable), plan/item snapshots, quantities, start date, end date, billing frequency, next billing date, payment terms, renewal setting, tax/discount snapshots, and notes.
- Support Draft, Active, Paused, Closed, and Expired statuses.
- Support activate, pause, resume, renew, close early, and scheduled expiry actions.
- Keep lifecycle history with actor, timestamp, prior state, new state, effective date, and reason.
- A plan price change must not alter the agreed subscription price. An amendment is explicit, permission-checked, and audited.
- Customer portal displays only that customer's subscriptions.

## FR-07 Recurring billing engine (P0)

- Determine which active subscriptions are due for billing on a given business date/time.
- Generate an invoice with a specific billing period and due date based on payment terms.
- Support daily, weekly, monthly, and yearly periods; month-end handling must be deterministic.
- Use the workspace timezone for billing calendar decisions and store timestamps in UTC.
- Paused subscriptions do not generate invoices for periods fully within the pause.
- **Proposed default:** no automatic proration for partial periods; on resume, the next full period begins from the resume date. This rule must be visible and tested.
- Closed/expired subscriptions do not generate future invoices.
- Prevent duplicates with a database uniqueness constraint keyed by subscription and billing-period start/end, plus transactional/locking safeguards.
- A failed run can be retried safely. Persist run details, created/skipped/failed counts, and error messages.
- MVP schedule: one daily Render Cron Job invokes a Django management command. Do not run a scheduler inside each web worker.

## FR-08 Invoice management (P0)

- Create invoice numbers, issue dates, due dates, billing periods, customer details, line items, quantity, unit price, discount, tax, subtotal, total, paid amount, and balance due.
- Support Draft, Issued, Partially Paid, Paid, and Void states. Overdue is derived when due date has passed and balance due is positive; it may be shown as a status badge without being a separate financial state.
- Allow authorized users to issue, email, download/print, and void invoices. Issued financial documents must not be silently edited; use a documented void/reissue path.
- Generate PDF invoices with consistent branding and stored document snapshots.
- An invoice must preserve customer/legal details, tax rate, line description, price, discount, and totals as they were at issue time.

## FR-09 Discounts (P0)

- Create fixed-amount or percentage discounts.
- Configure validity window, minimum subtotal, minimum quantity, usage limit, active status, and applicability (quotation, one-time invoice, or recurring invoice).
- Validate eligibility on the server at the time the discount is applied.
- **Proposed default:** discounts do not stack; one discount may apply to a document unless an Admin-approved policy changes this.
- Snapshot the applied discount on the quotation/subscription/invoice. Later edits to a discount must not retroactively change an issued document.

## FR-10 Payment recording and allocation (P0)

- Record manual payments with customer, amount, date/time, method, reference, notes, and optional supporting metadata.
- Support full and partial payments.
- Support payment allocation to one or more invoices using a separate allocation record.
- Never allocate more than the payment's unallocated amount or an invoice's outstanding balance.
- Update invoice balances and payment status transactionally.
- Preserve immutable payment and allocation history; corrections use reversal/adjustment records rather than silent edits.
- MVP payment methods: Bank Transfer, Cash, Card (record only; no card data), UPI, and Other. Configurable method list is P1.

## FR-11 Dashboards and reports (P0/P1)

- Admin dashboard: active subscriptions, paused subscriptions, upcoming renewals/expiries, invoices due/overdue, outstanding balances, payments received, recent events, and revenue summaries.
- Staff dashboard: assigned/operational queues and customer follow-ups; no privileged account controls.
- Customer dashboard: own active subscriptions, next billing dates, open invoices, and payment history.
- Filters by date range, customer, status, plan, and payment method where relevant.
- Clearly distinguish **invoiced value** from **cash received**.
- MRR/ARR may be shown as **estimated normalized recurring value**, excluding taxes and one-time charges. The formula and assumptions must be visible; do not label it as recognized accounting revenue.

## FR-12 Subscription Control Tower (P1)

A consolidated operational view showing upcoming renewals, paused subscriptions, subscriptions nearing expiry, overdue invoices, failed billing runs, and customers requiring attention. Provide filters and direct navigation to the affected record. Health indicators must be rule-based and explainable, not generated by opaque AI.

## FR-13 Notifications and audit trail (P1)

- In-app and email notifications for quotation sent/accepted/rejected, subscription activation/renewal/expiry, invoice issued/due/overdue, and payment recorded.
- Notification sending must be retryable and should not block the financial transaction.
- Audit log important changes, including role changes, pricing changes, subscription lifecycle operations, invoice issue/void, discount use, payment and allocation changes, and billing-run outcomes.
- Record actor, action, entity, entity ID, timestamp, and safe before/after metadata. Do not log passwords, secrets, or full payment credentials.

## FR-14 Workspace settings and numbering (P1)

- Configure business display name, logo, contact details, billing timezone, currency, default payment terms, tax defaults, invoice/quotation number prefixes, and email sender details.
- Single workspace only for MVP.
- Defaults are applied to new documents; historical documents retain their snapshots.

# 6. Key user journeys

## Journey A: Configure a subscription offering

1. Admin/Staff creates a product and optional variants.
2. Admin/Staff creates a plan and selects its product/variant lines.
3. User sets frequency, price, minimum quantity, date availability, extra charges, and renewal/pause settings.
4. System validates and saves the plan as Active or Draft.
5. The plan becomes selectable in quotations.

## Journey B: Quote to active subscription

1. Staff selects a customer and creates a quotation.
2. Staff selects plans/items and quantities; the system calculates line totals, discounts, taxes, payment terms, and expiry.
3. Staff previews and sends the PDF quotation.
4. Customer accepts/rejects via an authenticated portal action or staff records the decision with evidence.
5. Staff converts the accepted quote to a subscription. Duplicate conversion is blocked.
6. Admin/authorized Staff reviews and activates the subscription.
7. The system creates an auditable billing schedule.

## Journey C: Recurring invoice generation

1. Daily scheduled job starts a billing run.
2. System queries eligible Active subscriptions due on the processing date.
3. Each subscription is locked/processed transactionally.
4. System calculates the billing period and checks the unique period constraint.
5. System creates invoice and lines using immutable price/tax/discount snapshots.
6. System advances next billing date and records the run outcome atomically.
7. Notifications are queued after commit.
8. Retrying the job skips invoices that already exist and records the skip.

## Journey D: Receive and allocate payment

1. Staff opens an invoice or customer account and records a payment.
2. System validates payment amount and method.
3. Staff allocates the payment to one or more open invoices.
4. System checks available payment balance and invoice balance in a transaction.
5. Invoice status/balance is recalculated.
6. Payment receipt and audit event are available; customer can see the payment in their portal.

# 7. Business rules and policy defaults

The following defaults make the MVP implementable. They are proposals, not claims about existing business policy.

| ID | Proposed default | Rationale / item to confirm |
|---|---|---|
| BR-01 | One business workspace; no tenant switching. | Keeps initial authorization model manageable. |
| BR-02 | Admin creates Staff; public registration off. | Avoids uncontrolled privileged access. |
| BR-03 | One discount per quotation/invoice; stacking off. | Simple, predictable calculations. |
| BR-04 | Tax is exclusive of displayed price by default and configurable. | Confirm jurisdiction and tax display rules before production. |
| BR-05 | No proration for partial billing periods in MVP. | Avoids complex credit/refund calculations. |
| BR-06 | Pause suppresses periods fully inside the pause; resume starts a new full period from resume date. | Must be reviewed against customer contracts. |
| BR-07 | Automatic invoice creation occurs on the billing date. | Can later add advance billing days. |
| BR-08 | Payment entry is manual; no payment gateway or card storage. | Keeps scope focused and avoids payment compliance scope. |
| BR-09 | One currency per workspace. | Multi-currency deferred. |
| BR-10 | Customer quotation acceptance requires authenticated portal access or an authorized staff-recorded action. | Prevents unverified acceptance. |
| BR-11 | Issued invoices and accepted quotations are immutable snapshots. | Preserves the agreed commercial record. |
| BR-12 | Overpayment is blocked; unallocated customer credit is deferred. | Keeps payment reconciliation straightforward. |
| BR-13 | Month-end billing uses calendar-month periods and clamps to the last valid day. | Example: Jan 31 monthly cycle becomes Feb 28/29, then Mar 31; store calculated period boundaries. |
| BR-14 | Customer data access is isolated by profile ownership at API query level. | Prevents cross-customer data exposure. |

# 8. Data model (conceptual)

All primary keys should be UUIDs unless there is a documented reason not to. Use foreign keys, unique constraints, check constraints where appropriate, `Decimal`/PostgreSQL `numeric` for money, and explicit timestamps. Do not use floating-point values for financial calculations.

| Entity | Key relationships / responsibility |
|---|---|
| WorkspaceSettings | Single-workspace identity, currency, timezone, tax/payment defaults, number sequences. |
| User | Custom Django user; role/groups; optional link to Customer profile. |
| Customer | Customer profile, business/contact/billing details, portal-user link. |
| Product | Catalogue item and status. |
| ProductVariant | Belongs to Product; SKU and variant attributes. |
| SubscriptionPlan | Frequency, availability, status, renewal/pause policy. |
| PlanItem | Plan line referencing product/variant, quantity, charge type, price. |
| Quotation | Customer, number, state, dates, totals, discount/tax/payment-term snapshots. |
| QuotationItem | Product/plan references plus immutable line description/price/tax snapshots. |
| Subscription | Customer, source quotation, plan terms, state, service dates, next billing date. |
| SubscriptionItem | Immutable commercial line snapshots for the active contract. |
| SubscriptionEvent | Lifecycle transition history. |
| Discount | Rule definition, validity, limits, type, scope. |
| DiscountRedemption | Usage tracking and document/subscription reference. |
| Invoice | Customer, number, state, due date, billing period, totals and snapshots. |
| InvoiceItem | Description, quantity, unit price, discount, tax, line totals. |
| Payment | Customer, amount, method, reference, received date and status. |
| PaymentAllocation | Amount allocated from Payment to Invoice. |
| BillingRun | Scheduled/manual run metadata and totals. |
| BillingRunItem | Per-subscription success/skip/failure information. |
| Notification | Recipient, channel, event, status, retry metadata. |
| AuditLog | Actor, action, entity reference, timestamp, safe before/after metadata. |

## 8.1 Required integrity constraints

- Unique user email (case-insensitive normalized email policy).
- Unique customer-facing document numbers within the workspace.
- Unique subscription + billing-period pair for recurring invoices.
- `quantity > 0`, `amount >= 0`, valid date ordering, and valid allocation constraints.
- Payment allocation sum cannot exceed payment amount; invoice allocation sum cannot exceed invoice total less existing allocations.
- Subscription `next_billing_date` and period progression must be updated with invoice creation in one transaction.
- Source quotation conversion must be unique/idempotent.
- Use explicit `on_delete` policy; preserve historic documents when catalogue entities are archived.

# 9. API and application architecture

## 9.1 Fixed stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling and UI | Tailwind CSS + shadcn/ui + Lucide icons |
| Frontend routing | React Router |
| API data/cache | TanStack Query |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts (only where a chart improves understanding) |
| Backend | Python 3.13 + Django 6.1.x + Django REST Framework |
| Data access | Django ORM + PostgreSQL |
| Identity | Django custom user model, session authentication, Django CSRF protection |
| API schema | drf-spectacular / OpenAPI 3 |
| Database hosting | Supabase PostgreSQL (Django connects directly to PostgreSQL; Supabase Auth is not used) |
| PDF | ReportLab |
| Email | Resend through a provider adapter; console backend locally |
| Scheduling | Render Cron invoking Django management command |
| Backend tests | pytest + pytest-django |
| Frontend tests | Vitest + React Testing Library |
| End-to-end tests | Playwright |
| Deployment | Vercel frontend; Render Django web service + Cron; Supabase PostgreSQL |

**Authentication topology:** expose API paths under `/api/v1/` through a same-origin proxy. In local development, configure the Vite dev-server proxy to Django. In production, configure the Vercel external rewrite/reverse proxy to the Render backend and verify session/CSRF behavior end-to-end. External API rewrites are supported by Vercel; do not enable CDN caching for authenticated, financial, or customer-specific API routes. Use secure HttpOnly session cookies, CSRF tokens, HTTPS, explicit allowed hosts, and exact origin configuration. Do not put session identifiers or long-lived credentials in localStorage. If same-origin proxying cannot be made reliable in the chosen deployment setup, document a deliberate alternative before implementing it; do not silently switch to an incompatible token package.

**Database connectivity:** Django uses the Supabase PostgreSQL connection string from the Supabase dashboard. Choose direct connection or session pooler based on Render network/IP compatibility; do not guess the pooler host. Use SSL, environment variables, sensible connection lifetime/health checks, and a separate migration procedure. Do not expose the database password or service credentials to the browser.

## 9.2 Repository structure

```text
brightloop/
  AGENTS.md
  README.md
  docs/
    PRD.md
    implementation-plan.md
    contracts/
      api-v1.yaml
      domain-glossary.md
      role-permissions.md
    decisions/
    design/
  frontend/
    src/
      app/                 # routes, providers, app shell
      components/          # shared UI components
      features/            # feature-specific pages/components/hooks
      lib/                 # api client, formatting, utilities
      types/
    tests/
  backend/
    manage.py
    config/                # settings, urls, ASGI/WSGI
    apps/
      identity/
      workspace/
      customers/
      catalogue/
      plans/
      quotations/
      subscriptions/
      billing/
      discounts/
      payments/
      analytics/
      notifications/
      audit/
    tests/
  infra/
    render.yaml             # optional, if using Render Blueprint
    vercel.json
```

## 9.3 API conventions

- Base path: `/api/v1/`.
- Use resource-oriented endpoints and predictable status codes.
- Use pagination, filtering, sorting, and search on collection endpoints.
- Return consistent validation errors that map cleanly to form fields.
- Publish OpenAPI schema and update it with each backend feature.
- Frontend consumes the generated/approved OpenAPI contract; do not invent field names or silently infer enums.
- Money is returned as decimal strings and currency code; never round-trip money through JavaScript floating point.

# 10. UX and visual design requirements

## 10.1 Design direction: premium, Apple-inspired restraint

Use the visual qualities the user requested from Apple websites as inspiration, not a literal reproduction of Apple's pages, branding, layouts, proprietary assets, or trade dress.

- Editorial typography with clear scale and strong hierarchy.
- Generous whitespace, deliberate alignment, simple grid, and calm page composition.
- Warm white/light neutral surfaces, near-black text, quiet gray borders, and one restrained accent color.
- Subtle shadows and controlled corner radii; avoid excessive glassmorphism, gradients, and decorative cards.
- Crisp, consistent iconography (Lucide) and polished micro-interactions.
- Motion should be short, purposeful, and respect `prefers-reduced-motion`.
- Data-dense tables must remain readable and efficient; minimalism must not hide important information.
- Responsive layouts for desktop, tablet, and mobile; keyboard accessibility and visible focus states.

## 10.2 Core screens

1. Sign in / reset password.
2. Admin dashboard.
3. Staff dashboard.
4. Customer directory and customer detail.
5. Product and variant catalogue.
6. Subscription plan list and editor.
7. Quotation list, builder, detail, and PDF preview.
8. Subscription list, detail, and Control Tower.
9. Invoice list, detail, and PDF preview.
10. Discounts.
11. Payments and allocation workflow.
12. Reports/analytics.
13. Customer portal.
14. User and workspace settings.
15. Activity/notification center.

## 10.3 UX quality bar

Every data screen needs loading, empty, error, success, and disabled states. Confirm destructive/irreversible actions. Use inline validation and clear recovery guidance. Provide search/filter/sort/pagination for long lists. Keep status labels consistent across screens. Never use fabricated production metrics; demo fixtures must be visibly marked as demo data.

# 11. Non-functional requirements

## 11.1 Security and privacy

- Enforce HTTPS in production, secure cookies, CSRF protection, exact `ALLOWED_HOSTS`, and secret management through environment variables.
- Use Django password hashing; add login/password reset throttling.
- Enforce role permissions and customer record ownership on the server.
- Validate all incoming data through DRF serializers and domain/service rules.
- Prevent mass assignment of protected fields (role, owner, status, totals, payment balances).
- Never trust client-calculated totals; the backend recalculates financial values.
- Protect file/document downloads with authorization checks and safe content types.
- Do not log secrets, passwords, or full card/bank credentials.
- Run Django deployment checks and review security settings before release.

## 11.2 Integrity and resilience

- Use database transactions for invoice issue, subscription conversion, billing generation, payment allocation, and status transitions.
- Use unique constraints for idempotency; application checks alone are insufficient.
- Store money with Decimal/numeric; define rounding at line/tax/total level and test boundary cases.
- Use audit records and preserve historical document snapshots.
- Scheduled jobs must be safe on retry and produce structured run output.
- Maintain database backups according to the chosen Supabase plan and verify restoration procedure before production.

## 11.3 Performance

- Target under 2 seconds for common list/detail/dashboard API calls at the agreed workload.
- Use pagination, query optimization (`select_related`, `prefetch_related`), indexing, and measured aggregation.
- Avoid N+1 queries and unbounded list endpoints.
- Add caching only after measuring; do not make stale financial status look current.

## 11.4 Accessibility and compatibility

- Target WCAG 2.2 AA for core interactions where practicable.
- Full keyboard operation, semantic labels, contrast, focus management, and screen-reader-friendly form errors.
- Support current evergreen Chrome, Edge, Firefox, and Safari; verify the agreed browser set in Playwright.

## 11.5 Maintainability

- Feature-based frontend modules and Django domain apps.
- Thin viewsets/views; business rules live in explicit service/domain functions.
- Typed API interfaces generated from or aligned to OpenAPI.
- Lint, format, type-check, migrations check, unit tests, integration tests, and end-to-end tests run in CI.
- No unreviewed direct database edits in production.

# 12. Testing and acceptance criteria

## 12.1 Critical acceptance scenarios

- Admin can create a Staff user; Staff cannot create or promote users.
- Customer API requests cannot access another Customer's profile, quotations, subscriptions, invoices, payments, or document PDFs by guessing IDs.
- Product/variant and plan CRUD works with validation and archive rules.
- Accepted quotation converts once; second conversion is rejected safely.
- Active subscription creates one invoice for its due period; repeating the billing job does not create a duplicate.
- Paused/closed/expired subscriptions follow the pause/closure billing policy.
- Monthly billing handles Jan 29/30/31, leap years, and end-of-month periods deterministically.
- Invoice totals, discount, tax, payment amount, allocation, and outstanding balance reconcile using Decimal arithmetic.
- Partial payments update balance correctly; over-allocation is rejected.
- Issued invoices and accepted quotations preserve historical snapshots.
- Dashboard distinguishes invoiced value from actual payments received.
- Core flows work at mobile and desktop widths; empty/error/loading states are complete.

## 12.2 Required test layers

- Backend unit tests for services and calculations.
- API tests for permissions, ownership, validation, filtering, pagination, and transitions.
- Database tests for unique constraints and concurrent/idempotent billing.
- Frontend component tests for forms, table states, role-specific navigation, and calculations display.
- Playwright end-to-end tests for login, quote conversion, recurring invoice, partial payment, and customer isolation.
- Deployment smoke test for Vercel proxy, Django cookies/CSRF, Supabase connection, migrations, PDF, email, and Cron.

# 13. Delivery roadmap and milestones

| Phase | Focus | Exit gate |
|---|---|---|
| 0. Product/architecture baseline | Confirm rules, repo layout, OpenAPI baseline, design principles, ownership. | PRD/decision log/contracts agreed. |
| 1. Foundation | Vite frontend, Django API, Supabase PostgreSQL, CI, auth topology. | Local frontend can call health/API endpoint; migrations run. |
| 2. Identity and workspace | Custom user, Admin/Staff/Customer permissions, customer isolation, workspace settings. | Permission/ownership test suite passes. |
| 3. Customers and catalogue | Customers, products, variants, plans and pricing. | CRUD and validation pass. |
| 4. Commercial flow | Quotations, PDF, acceptance, conversion, subscription lifecycle. | Quote-to-active-subscription flow passes. |
| 5. Billing and finance | Invoice records, recurring billing, discounts, payments/allocation. | Idempotency and reconciliation tests pass. |
| 6. Experience and reporting | Dashboards, Control Tower, customer portal, notifications. | Role-appropriate complete journeys work. |
| 7. Hardening/release | QA, security, accessibility, performance, deployment, scheduled jobs. | Release checklist passes; demo flow rehearsed. |

# 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Billing duplicates after retries or parallel runs | Unique DB constraint, transaction/locking, idempotent management command, concurrency tests. |
| Frontend/backend contracts drift | OpenAPI is the source of truth; contract owner; mock adapters generated from contract. |
| Cross-domain cookies/CSRF fail in hosted deployment | Same-origin `/api` proxy in Vite and Vercel; explicit end-to-end auth smoke test before feature rollout. |
| Wrong billing calendar around month ends/timezones | Store workspace timezone; deterministic period calculator; boundary tests. |
| Price/discount changes rewrite history | Immutable snapshots on accepted quotes, subscriptions, and issued invoices. |
| Customer can view another customer's data | Server-side ownership querysets and IDOR tests for every customer-facing resource. |
| Scope creep from accounting/payment integration | Keep gateways, refunds, multi-currency, and full tax compliance outside MVP. |
| UI looks polished but slows daily work | Test real workflows; maintain readable density, search, filters, and keyboard support. |

# 15. Open decisions to confirm before production

The plan uses defaults so implementation can proceed, but these should be confirmed with the business owner:

1. Currency and business jurisdiction; tax inclusive/exclusive treatment and required tax fields.
2. Whether Customers can self-register or are invitation-only.
3. Exact Staff permissions and whether records can be reassigned.
4. Pause rules: exact billing date behavior, resumption date, and whether any proration/credit is required.
5. Month-end renewal rule and billing timezone.
6. Whether invoices are generated on the billing date or a configurable number of days in advance.
7. Whether discounts can stack and whether they apply once or recur for a defined term.
8. Whether overpayments/prepayments should create customer credit (excluded by default).
9. Whether a quotation acceptance is self-service, staff-entered, or both.
10. Whether closed subscriptions can be reopened or only replaced with a new subscription.
11. Invoice numbering format and whether invoice issue requires approval.
12. Expected number of customers, subscriptions, invoices, users, and peak concurrent users.

# 16. Definition of Done

A feature is complete only when:

- It meets its acceptance criteria and matches the approved design/API contract.
- Server-side validation and authorization are implemented; the UI is not the security boundary.
- Database migrations and constraints are included where needed.
- Unit/API/component tests cover normal, invalid, permission-denied, and boundary cases.
- Loading, empty, error, success, and responsive states are implemented.
- No hard-coded demo data is used in production flows.
- Lint, type-check, migrations check, and relevant tests pass.
- Documentation/OpenAPI and audit behavior are updated.
- The pull request describes files changed, tests run, known limitations, and integration notes.

# 17. Technical references

- Django download and supported releases (Django 6.1.2 latest listed on 31 Oct 2026): https://www.djangoproject.com/download/
- Django REST Framework supported platform versions: https://www.django-rest-framework.org/
- Vercel external rewrites / reverse proxy: https://vercel.com/docs/routing/rewrites
- Django deployment checklist: https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/
- Django security overview: https://docs.djangoproject.com/en/6.1/topics/security/
- Supabase PostgreSQL connection options: https://supabase.com/docs/guides/database/connecting-to-postgres
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite
- Vite production build: https://vite.dev/guide/build
- Render Cron Jobs: https://render.com/docs/cronjobs
