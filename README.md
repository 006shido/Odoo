# Brightloop Software — Subscription Management System
> **Odoo Hackathon 2026** — Team: Talent Not Found

A unified software platform that runs the full lifecycle of a subscription business: product catalogue & variants, flexible subscription plans, sales quotations, automated recurring billing, discount rules, payment allocation, and the Finance Control Tower.

---

## 🎯 Problem Statement Coverage

| Problem Scene (Odoo PDF) | Implementation & Solution |
|---|---|
| **1. A new customer signs up** | Custom User model with roles: `Admin`, `Staff`, `Customer`. Online registration enforces password criteria (>8 chars, uppercase, lowercase, special character). Role-based views: Admin controls whole workspace, Staff has day-to-day operations, Customers access isolated self-service portal. |
| **2. Launching a new plan** | Product catalogue with sales/cost price, taxes, and price-modifying variants (e.g. brand **Odoo Edition adds ₹560.00**). Plans support daily, weekly, monthly, and yearly intervals with admin policy toggles (auto-close, early closure, pause, and renewal). |
| **3. Turning a quote into a subscription** | Quotation builder with payment terms and line item totals. Full lifecycle: `Draft` → `Sent` → `Accepted` / `Rejected` → `Converted`. One-click conversion to Subscription with idempotency safeguard (cannot convert twice). |
| **4. Billing day** | Automated recurring billing engine (`manage.py run_billing_day` and UI button). Automatically generates invoices for eligible active subscriptions due for billing. Unique database constraint `(subscription, billing_period_start, billing_period_end)` prevents duplicate billing on retry. Real PDF generation using **ReportLab**. |
| **5. A customer asks for a better price** | Admin discount rules: percentage or fixed amount, minimum spend/quantity, usage limits, and product or whole subscription scope. Automatically checked and applied on invoices. |
| **6. The money comes in** | Multi-method payments (Bank Transfer, UPI, Card, Cash). Full and partial payment allocation with real-time balance tracking and automatic `paid` status transitions. Overdue detection. |
| **7. The finance lead at end of month** | **Finance Control Tower**: Real-time KPI dashboard displaying active vs paused subscriptions, estimated normalized MRR, invoiced revenue vs cash collected, and outstanding overdue receivables with explainable operational health alerts. |

---

## 🚀 Quickstart Guide

### 1. Backend (Django 6.1.x + DRF)

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run migrations & seed realistic demo data
python manage.py migrate
python manage.py seed_demo_data

# (Optional) Test the Automated Recurring Billing Engine
python manage.py run_billing_day

# Start Django Development Server (port 8000)
python manage.py runserver
```

### 2. Frontend (React + Vite + TypeScript + Tailwind)

```bash
cd frontend

# Install dependencies
npm install

# Run tests
npm run test

# Start Vite Dev Server (port 5173)
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## ⚡ 1-Click Evaluation Credentials

The application includes 1-click evaluation buttons in the login screen and a topbar role switcher for rapid judging:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Admin** | `admin@brightloop.io` | `Brightloop@2026` | Full system control, catalogue, plans, discounts, billing engine, finance control tower. |
| **Staff** | `staff@brightloop.io` | `Brightloop@2026` | Daily customer operations: customers, quotes, subscriptions, invoices, and payments. |
| **Customer** | `alex@acmecorp.com` | `Brightloop@2026` | Self-service portal: own subscriptions, accept quotes, download invoice PDFs, view payments. |

---

## 🧪 Automated Test Verification

- **Backend tests** (models, variant pricing, quote conversion idempotency, billing retry safety, partial payment reconciliation):
  ```bash
  cd backend
  python manage.py test tests
  # Ran 4 tests in 0.200s -> OK
  ```

- **Frontend tests** (UI primitives, states, badges, dialogs, pagination):
  ```bash
  cd frontend
  npm run test
  # 9 test files passed, 32 of 32 tests passed
  ```

- **Typecheck & Production Build**:
  ```bash
  cd frontend
  npx tsc --noEmit
  npm run build
  ```
