# Supabase PostgreSQL setup

Django is the database authority. React must call Django, never Supabase directly.
Do not add Supabase Auth or place database credentials in VITE_* variables.

1. Create a free Supabase project. Keep Data API disabled for this backend-only database; do not automatically expose Django tables.
2. In Connect, copy the Session pooler URI for an IPv4 development machine (port 5432). Use the dashboard-provided hostname and username.
3. Copy backend/.env.example to backend/.env and replace placeholders locally. Percent-encode reserved password characters. Never commit .env.
4. Use the repository-required Python 3.13 environment and install requirements.txt.
5. Run from backend: python manage.py check; python manage.py migrate --plan; python manage.py migrate.
6. Run python manage.py showmigrations to verify applied migrations. Run seed_demo_data only for an explicitly disposable demo database; it creates public demo login credentials.
7. Verify API create/read persistence after restarting Django.

The connection requires SSL and disables prepared statements and server-side cursors for pooler compatibility. Production requires DATABASE_URL; SQLite fallback is development-only.

No model definitions or API contracts changed. A PostgreSQL security migration protects the Django tables. Existing migrations create the schema; do not hand-create competing Supabase tables.

## Review findings

The active React App mounts SubscriptionProvider, whose business records and user state are stored in localStorage. Existing API helper and auth-context files do not establish that active feature screens use the backend. Frontend API integration remains separate work.

Django has models/migrations and endpoints for identity, catalogue, plans, quotations, subscriptions, invoices, discounts, payments and analytics, plus a billing management command. Password reset is simulated. Existing permissive API/CORS/host defaults need a separate authorization and deployment review before real customer data is used.

## Verification in this session

Four standalone database configuration tests passed. Full backend and live database results are recorded below.

Update: Python 3.13.15 environment installed; Django 6.1.2 system check passed; live Supabase SELECT 1 succeeded. All eight backend tests passed against an isolated SQLite test database (not the cloud database). PostgreSQL concurrency and frontend persistence are not yet verified.

## Completed live verification

- All 28 Django migrations applied, including identity.0002_protect_supabase_tables; no migrations pending.
- All 26 public Django tables have RLS enabled. anon and authenticated cannot SELECT identity_customuser.
- Django ORM create/read succeeds after protection; verification data was rolled back.
- Eight backend tests passed in isolated SQLite; this is not a PostgreSQL concurrency test.
- No demo users/data seeded. No frontend changes or API contract changes.
- Security migration is PostgreSQL-only and intentionally irreversible. Future migrations adding tables must also protect those tables before use.
- A disconnected migration left an idle transaction holding locks. It was identified by its exact migration SQL and terminated, rolling back that attempt; the subsequent batched migration succeeded.
- Development branch: codex/supabase-database. Review the security migration before merging.

## Session report

SESSION ID: Supabase database integration, 2026-10-31
STATUS: Database integration complete; frontend API integration remains pending.
FILES CREATED: config/database.py, .env.example, .env (ignored), tests/test_database_config.py, apps/identity/migrations/0002_protect_supabase_tables.py, SUPABASE.md, supabase-project.png
FILES MODIFIED: config/settings.py, requirements.txt, .gitignore
DATABASE / API CONTRACT CHANGES: Existing model schema migrated to Supabase; new RLS/grant protection migration; no API changes.
TESTS RUN: manage.py check; manage.py makemigrations --check --dry-run; manage.py test tests --noinput (SQLite override); manage.py migrate --noinput; live ORM/role/RLS checks.
TEST RESULTS: System check clean; no model changes detected; 8 tests passed; live write/read and rollback passed; zero pending migrations.
MANUAL VERIFICATION: Supabase dashboard shows Healthy.
KNOWN LIMITATIONS: Active frontend still uses localStorage. Existing backend authorization and simulated password reset need separate work before production use. No live PostgreSQL concurrency or browser login verification.
FOLLOW-UP / DEPENDENCIES: Wire frontend to Django endpoints under frontend ownership; review backend authorization; configure deployment separately.
