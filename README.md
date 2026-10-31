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

## User roles & evaluation accounts

The login screen includes quick fill buttons and a role switcher:

| Role | Email | Password | Access scope |
|---|---|---|---|
| Admin | `admin@brightloop.io` | `Brightloop@2026` | Full system access: catalog, plans, discounts, billing engine, and control tower. |
| Staff | `staff@brightloop.io` | `Brightloop@2026` | Daily operations: customers, quotes, subscriptions, invoices, and payments. |
| Customer | `alex@acmecorp.com` | `Brightloop@2026` | Self-service portal: view subscriptions, accept quotes, download invoice PDFs, make payments. |

---

## Quickstart

### 1. Backend (Django 6.1 + DRF)

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed demo data
python manage.py migrate
python manage.py seed_demo_data

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
  # Ran 4 tests in 0.23s -> OK
  ```

- **Frontend tests** (UI primitives, states, badges, dialogs, pagination, decimal math):
  ```bash
  cd frontend
  npm run test
  # 11 test files passed, 48 of 48 tests passed
  ```

- **Typecheck and build**:
  ```bash
  cd frontend
  npx tsc --noEmit
  npm run build
  ```
