# Brightloop – Subscription Management System

> Odoo Hackathon 2026 | Team: Talent Not Found

Brightloop is a web-based subscription management platform built to manage the complete subscription lifecycle: product catalog and variants, flexible subscription plans, quotations, automated recurring billing, discount rules, payment allocation, and an operations dashboard.

---

## Modules and capabilities

1. **Dashboard**: Live overview of active subscriptions, monthly recurring revenue (MRR), cash collected, and overdue invoices.
2. **Customer Management**: Customer profiles, contact details, tax identifiers, and billing history.
3. **Product Catalog**: Products, add-ons, and pricing variants.
4. **Subscription Plans**: Recurring billing intervals (daily, weekly, monthly, yearly), duration limits, and renewal rules.
5. **Quotations**: Proposal builder with line items, tax, and one-click conversion to active subscriptions.
6. **Subscription Management**: Active contracts, lifecycle transitions (active, paused, closed), and renewal scheduling.
7. **Automated Recurring Billing**: Scheduled billing runs (`run_billing_day`), duplicate billing prevention, and PDF invoice generation.
8. **Invoices**: Status tracking (draft, issued, paid, overdue), balance calculations, and PDF downloads.
9. **Payments**: Payment recording (bank transfer, UPI, card, cash) and allocation across open invoices.
10. **Discounts**: Percentage and fixed discount rules with minimum spend and product scope validation.
11. **Reports & Analytics**: Invoiced vs. collected cash, invoice ageing, and retention metrics.
12. **Control Tower**: Operational monitor for renewals due soon, paused subscriptions, and overdue balances.

---

## Authentication and database integration

The active React interface uses Django session authentication and persists records in Supabase PostgreSQL through `/api/v1/workspace/`. Demo role switching and browser-only business storage are disabled. Create a customer account through the login page; staff/admin accounts require administrator provisioning.

For this development machine, the user-requested local administrator credentials are in `backend/.env.local-admin` (Git ignored). Credentials are not included in this repository. Teammates need their own private backend `.env`; copy `.env.example` as a template, never commit the populated file.

See [integration contract](docs/contracts/workspace-integration.md) for API commands, validation and remaining feature boundaries, and [database setup](backend/SUPABASE.md) for connection instructions.

---

## Quickstart

### 1. Backend (Django 6.1 + DRF)

```bash
cd backend

# Activate virtual environment
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env and configure your database first
python manage.py migrate

# (Optional) Test the recurring billing engine
python manage.py run_billing_day

# Start Django server (port 8000)
python manage.py runserver
```

### 2. Frontend (React 19 + Vite + TypeScript + Tailwind)

```bash
cd frontend

# Install dependencies
npm install

# Run unit tests
npm run test

# Start Vite dev server (port 5173)
npm run dev
```

The frontend runs at `http://localhost:5173`.

---

## Automated test verification

- **Backend tests** (models, variant pricing, quote conversion idempotency, billing retry safety, partial payment reconciliation):
  ```bash
  cd backend
  python manage.py test tests
  # Current integration validation: 15 backend tests passed on isolated SQLite
  ```

- **Frontend tests** (UI primitives, states, badges, dialogs, pagination, decimal math):
  ```bash
  cd frontend
  npm run test
  # Current integration validation: 12 test files, 51 tests passed
  ```

- **Typecheck and build**:
  ```bash
  cd frontend
  npx tsc --noEmit
  npm run build
  ```
