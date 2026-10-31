# BRIGHTLOOP
## Implementation Plan and Parallel AI Session Playbook

**Version:** 1.0  
**Date:** 31 October 2026  
**Companion document:** `Brightloop_PRD_v1.md`

This playbook converts the PRD into small, sequenced sessions. It has two distinct tracks: **Part A - Antigravity (frontend/UI)** and **Part B - Codex (Django/backend/data/integration)**. Use one task prompt per session. Do not paste the entire prompt library into an implementation session.

---

# 1. Refined product definition

Brightloop is a polished subscription-operations workspace for one business. Its complete MVP workflow is:

**Catalogue → Plan → Quotation → Customer acceptance → Subscription → Recurring invoice → Payment allocation → Reporting.**

The central product differentiator is the **Subscription Control Tower**: one place where Admin and Staff can see renewals, pauses, expiries, invoices due/overdue, billing-run exceptions, and customers needing attention. Its indicators are rule-based and explainable.

The first release intentionally prioritizes correctness over breadth: one workspace currency, manual payment recording, no proration, no payment gateway, and no full accounting suite. Customer-facing access is limited to that customer's own commercial records.

# 2. Fixed technology baseline

| Area | Decision |
|---|---|
| Frontend | React + Vite + TypeScript |
| UI | Tailwind CSS + shadcn/ui + Lucide React |
| Routing/state | React Router + TanStack Query |
| Forms | React Hook Form + Zod |
| Tables/charts | TanStack Table + Recharts (selectively) |
| Backend | Python 3.13 + Django 6.1.x + Django REST Framework |
| ORM/database | Django ORM + PostgreSQL on Supabase |
| Auth | Django custom User + session authentication + CSRF protection |
| API contract | OpenAPI 3 via drf-spectacular; base path `/api/v1/` |
| PDF | ReportLab |
| Email | Resend through an email-provider adapter |
| Recurring jobs | Render Cron → Django management command |
| Backend tests | pytest + pytest-django |
| Frontend tests | Vitest + React Testing Library |
| E2E tests | Playwright |
| Deployment | Vercel (frontend proxy) + Render (Django web/Cron) + Supabase PostgreSQL |

## 2.1 Architecture rules that must not drift

- Django owns all business rules, calculated totals, permissions, document numbering, billing dates, and financial status.
- React is a client UI. It must not connect directly to PostgreSQL or use Supabase service keys.
- Use Django's custom user model from the first migration. Do not use Supabase Auth in parallel.
- Use session cookies + CSRF on a same-origin `/api` path. Vite proxies `/api` during development; Vercel proxies `/api` to Render in production. Verify the entire login/CSRF flow early. Do not silently change authentication models.
- Use PostgreSQL `numeric`/Django `DecimalField` for money. Never use binary floats for financial values.
- Recurring invoice creation is an idempotent Django management command called by Render Cron; do not run cron in every web worker.
- The OpenAPI schema and approved `docs/contracts/` files define the frontend/backend boundary.
- Preserve document and subscription price snapshots. Changes to catalogue prices do not rewrite historical commitments.

# 3. Repository and file ownership

```text
brightloop/
  AGENTS.md                     # shared rules; integration lead owns edits
  README.md
  docs/
    PRD.md
    implementation-plan.md
    contracts/                  # Codex contract owner; changes reviewed before use
    decisions/                  # architecture/business decision records
    design/                     # Antigravity design notes and tokens
  frontend/                     # Antigravity primary ownership
  backend/                      # Codex primary ownership
  infra/                        # deployment configuration; integration lead coordinates
```

**Antigravity ownership:** `frontend/**`, `docs/design/**`, and frontend tests. It may read but must not modify `backend/**`, migrations, root dependencies, or the approved API contract unless the integration lead explicitly assigns a contract task.

**Codex ownership:** `backend/**`, backend tests, OpenAPI output, `docs/contracts/**`, backend dependency files, and backend deployment configuration. It must not rewrite `frontend/**` UI components. It may provide frontend integration examples in docs, not implement UI screens.

**Shared ownership:** `AGENTS.md`, root CI, repository-wide tooling, `infra/`, and architectural contracts are controlled by the integration lead. Any shared change needs an explicit handoff and review.

Never let two agents edit the same working tree or branch simultaneously. Each task gets a branch and pull request. Never merge an unreviewed database migration or conflicting API contract.

# 4. Parallel work model and dependency waves

| Wave | Codex work | Antigravity work | Merge gate |
|---|---|---|---|
| 0 - Baseline | CX-00 architecture/domain/API contracts; CX-01 project foundation | AG-00 design system and frontend foundation | App boots; API route and visual shell agree. |
| 1 - Identity | CX-02 auth/RBAC; CX-03 user/workspace settings | AG-01 auth screens; AG-02 app shell/navigation | Login, roles, route guards and server permission tests work. |
| 2 - Core records | CX-04 customers; CX-05 catalogue; CX-06 plans | AG-03 dashboard; AG-04 customers; AG-05 catalogue; AG-06 plans | Contract-backed CRUD passes; fixture adapters removed or explicitly isolated. |
| 3 - Commercial flow | CX-07 quotations; CX-08 subscriptions | AG-07 quotations; AG-08 subscriptions/control tower | Quote acceptance and one-time conversion flow passes end-to-end. |
| 4 - Billing/finance | CX-09 invoices; CX-10 billing engine; CX-11 discounts; CX-12 payments | AG-09 invoices; AG-10 discounts/payments | Invoice idempotency and allocation reconciliation tests pass. |
| 5 - Experience | CX-13 analytics; CX-14 notifications/audit | AG-11 reports; AG-12 customer portal; AG-13 settings/notifications | Role-specific flows and data isolation pass. |
| 6 - Hardening | CX-15 security/integration/tests; CX-16 deployment/operations | AG-14 responsive, accessibility and visual QA | Release checklist and demo workflow pass. |

**Concurrency rule:** parallelize only tasks in the same wave after the shared contract has been approved. If an endpoint is not ready, the UI may use a typed fixture/MSW adapter behind a service boundary, but it must not invent a second API shape. Remove or clearly quarantine fixtures before release.

# 5. Recommended team operating sequence

1. Create a GitHub repository and use the structure above.
2. Put this package's `AGENTS.md` in the root. Put `PRD.md` and `implementation-plan.md` in `docs/`.
3. Start one Codex main session and paste the **Codex master prompt** from Part B. Then run CX-00 and CX-01 in order.
4. Start one Antigravity main session and paste the **Antigravity master prompt** from Part A. AG-00 can begin after the repo exists; it must follow the design direction and must not invent backend fields.
5. Run each numbered task as one session. Copy only that session's prompt block. Do not ask an agent to implement the next task automatically.
6. Use feature branches and pull requests. Review tests, migrations, API schema, visual screenshots, and file ownership before merge.
7. At every merge gate, run the integrated app and a critical user journey before starting the next wave.
8. Keep an unresolved-decision log. Agents must not guess tax policy, currency, pause/proration rules, or payment policy.

# 6. Integration gates

## Gate A - Foundation
- `frontend` starts, builds, and has lint/test scripts.
- `backend` starts, `/api/v1/health/` returns a valid response, and migrations run against a disposable/dev PostgreSQL database.
- Vite `/api` proxy works locally.
- OpenAPI document is available and versioned.
- No secrets are committed.

## Gate B - Identity
- Admin/Staff/Customer roles are enforced server-side.
- Customer IDOR tests prove cross-customer access is denied.
- Session cookie + CSRF works through the local proxy.
- Role-aware navigation does not replace backend authorization.

## Gate C - Commercial flow
- Create customer/product/plan/quotation.
- Accept quotation and convert exactly once.
- Activate, pause, resume, renew, close, and expire with a history record.

## Gate D - Billing/finance
- Run billing command twice; one period produces one invoice.
- Month-end and timezone tests pass.
- Tax/discount/total calculations reconcile using Decimal.
- Partial and full payments allocate correctly; over-allocation is rejected.

## Gate E - Release
- Customer portal has no cross-customer data leakage.
- Dashboard distinguishes billed and collected amounts.
- All critical flows pass E2E tests.
- `manage.py check --deploy`, production env review, secure cookies/HTTPS, backup and restore plan, scheduled job, PDF, and email are verified.

# 7. Shared completion report format

Every session must end with:

```text
SESSION ID:
STATUS: Complete / Partially complete / Blocked
SUMMARY:
FILES CREATED:
FILES MODIFIED:
DATABASE / API CONTRACT CHANGES:
TESTS RUN:
TEST RESULTS:
MANUAL VERIFICATION:
KNOWN LIMITATIONS:
FOLLOW-UP / DEPENDENCIES:
```

Do not claim a test passed unless it was run and its result was observed. If blocked by another module, report the exact missing endpoint/field/decision and stop rather than fabricating it.
