# Brightloop AI Agent and Engineering Rules

## Product and stack

Brightloop is a single-workspace subscription operations system. Read `docs/PRD.md` and `docs/implementation-plan.md` before every task.

- Frontend: React + Vite + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form + Zod.
- Backend: Python 3.13, Django 6.1.x, Django REST Framework, Django ORM.
- Database: Supabase PostgreSQL; Django is the only database/business-rule authority.
- Identity: custom Django User model, Django sessions, CSRF. Do not add Supabase Auth or substitute JWT without an approved architecture decision.
- API: `/api/v1/`, OpenAPI 3 (`drf-spectacular`).
- PDF: ReportLab. Email: Resend behind provider adapter. Scheduling: Render Cron → Django management command.
- Tests: pytest/pytest-django; Vitest/React Testing Library; Playwright.

## Ownership

- Antigravity: `frontend/**`, `docs/design/**`, frontend tests. Do not edit backend, migrations, approved API contracts, or shared root configuration.
- Codex: `backend/**`, backend tests, OpenAPI, `docs/contracts/**`. Do not implement frontend UI screens.
- Integration lead: root `AGENTS.md`, CI, shared configuration, `infra/**`, and approved architectural/business decisions.
- One agent per branch/working tree at a time. Every feature uses a branch + PR. Do not merge unreviewed migrations or API breaking changes.

## Architecture

- Django owns all business logic, calculations, permissions, statuses, document numbering, billing calendar, and customer ownership checks.
- UI is not a security boundary. Check permissions in API handlers/services/querysets.
- Customer users can access only records linked to their own Customer profile. Test IDOR on every customer-facing resource.
- Business rules live in services/domain functions; keep viewsets/controllers thin.
- All APIs and frontend DTOs follow the approved OpenAPI contract. Do not guess fields/enums. Propose contract changes in writing.
- Vite proxies `/api` locally; Vercel proxies `/api` to Render in production. Verify session/CSRF in browser. Never disable CSRF as a shortcut.

## Data integrity and money

- Use UUID primary keys unless documented otherwise.
- Use Django DecimalField / PostgreSQL numeric for money. No floats for financial calculations. API monetary amounts are decimal strings plus currency code.
- Use foreign keys, unique/check constraints, indexes, and explicit deletion/archive policies.
- Preserve historical quote, subscription, and issued invoice snapshots. Catalogue/discount edits must not rewrite historical records.
- Transactions are mandatory for quote conversion, invoice issue, recurring billing, payment allocation, and sensitive lifecycle transitions.
- Billing is idempotent: database uniqueness on subscription + billing period is mandatory; safe retry and concurrency tests are mandatory.
- Keep audit history for status transitions and financial actions. Do not silently edit issued invoices or accepted quotes.

## UI quality

- Premium, Apple-inspired restraint; do not clone Apple branding, assets, or exact page layouts.
- Strong hierarchy, whitespace, consistent spacing, calm neutral palette, one restrained accent, crisp icons, subtle motion, readable business tables.
- Every page includes loading, empty, error, success, and permission states where relevant.
- No dead controls, placeholder links, fake metrics, or hidden errors.
- Keyboard access, visible focus, labels, contrast, responsive layouts, reduced motion.

## Security

- Never commit secrets. Use `.env.example` with placeholders only.
- Do not expose Supabase credentials or service keys to frontend.
- Use session cookie + CSRF through same-origin proxy; secure cookies and HTTPS in production.
- Validate all inputs server-side; never trust client totals or protected fields.
- Do not log passwords, tokens, secrets, card data, or full sensitive payment credentials.
- Document and test authorization for PDF/download endpoints.

## Required workflow per task

1. Inspect repository, active branch, existing patterns, and relevant contracts.
2. List intended files, migrations, API changes, and dependencies.
3. Implement only the assigned task; avoid unrelated refactors.
4. Add tests for success, validation, permissions, and relevant edge cases.
5. Run lint/type-check/build/tests and Django checks as relevant; report exact commands/results.
6. Update docs/OpenAPI/migration notes.
7. Provide this report:

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

Do not claim a command passed unless it was actually run. Do not start the next task automatically. If a missing decision or contract blocks safe implementation, report it precisely and stop at that boundary.
