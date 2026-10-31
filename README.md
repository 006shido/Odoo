# Brightloop

**Software Subscription Management System**

A subscription operations platform that centralizes the commercial and operational lifecycle: customer records, product catalogue, subscription plans, quotations, subscription activation and lifecycle changes, recurring invoices, discounts, payment allocation, and business reporting.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Lucide React |
| Routing/State | React Router + TanStack Query |
| Forms | React Hook Form + Zod |
| Tables/Charts | TanStack Table + Recharts |
| Backend | Python 3.13 + Django 6.1.x + DRF |
| Database | Supabase PostgreSQL |
| Auth | Django custom User + sessions + CSRF |
| API | OpenAPI 3 via drf-spectacular (`/api/v1/`) |
| PDF | ReportLab |
| Email | Resend |
| Scheduling | Render Cron → Django management command |
| Deployment | Vercel (frontend) + Render (backend) + Supabase (DB) |

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Implementation Plan](docs/implementation-plan.md)
- [Agent Rules](AGENTS.md)
