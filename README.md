# Brightloop Subscription Management
> Odoo Hackathon 2026 | Team: Talent Not Found

A web application for subscription operations: product catalog, recurring plans, quotations, automated billing, discounts, payments, and an operations dashboard.

---

## Problem statement coverage

| Problem scene (Odoo PDF) | Implementation |
|---|---|
| 1. A new customer signs up | Custom user model with roles: Admin, Staff, and Customer. Online registration validates passwords (minimum 8 characters, uppercase, lowercase, special character). Role-based views: Admin manages the workspace, Staff handles daily records, and Customers use an isolated self-service portal. |
| 2. Launching a new plan | Product catalog with sales and cost price, tax rates, and price-adjusting variants (e.g. brand Odoo Edition adds ₹560.00). Plans support daily, weekly, monthly, and yearly intervals with toggles for auto-close, early closure, pause, and renewal. |
| 3. Turning a quote into a subscription | Quotation builder with payment terms and item totals. Full lifecycle: Draft → Sent → Accepted / Rejected → Converted. One-click conversion to a subscription with duplicate conversion prevention. |
| 4. Billing day | Automated recurring billing engine (`manage.py run_billing_day` and UI button). Generates invoices for eligible active subscriptions due on or before the selected date. Unique database constraint `(subscription, billing_period_start, billing_period_end)` prevents duplicate invoices on retry. PDF invoice generation using ReportLab. |
| 5. A customer asks for a better price | Discount rules: percentage or fixed amount, minimum spend or quantity, usage limits, and product or subscription scope. Verified and applied directly to invoice lines. |
| 6. The money comes in | Payments via bank transfer, UPI, card, and cash. Full and partial allocation to invoices with real time balance calculation and automatic status changes to paid. Overdue detection based on invoice due date. |
| 7. The finance lead at end of month | Control Tower dashboard displaying active and paused subscriptions, normalized MRR, invoiced revenue vs. cash collected, and overdue balances. |

---

## Quickstart

### 1. Backend (Django 6.1 + DRF)

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already installed)
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

## Demo accounts

The login screen includes quick fill buttons and a topbar role switcher:

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | `admin@brightloop.io` | `Brightloop@2026` | Full workspace access: catalog, plans, discounts, billing engine, and control tower. |
| Staff | `staff@brightloop.io` | `Brightloop@2026` | Day-to-day operations: customers, quotes, subscriptions, invoices, and payments. |
| Customer | `alex@acmecorp.com` | `Brightloop@2026` | Customer portal: view own subscriptions, accept quotes, download invoice PDFs, make payments. |

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
