# Supabase PostgreSQL setup

React now uses the authenticated Django workspace API. Django owns all writes, calculations and database access; no Supabase credentials belong in the frontend.

1. Copy backend/.env.example to backend/.env, then set DATABASE_URL from Supabase > Connect > Session pooler (port 5432 on IPv4). Percent-encode reserved password characters.
2. Use Python 3.13, create a backend virtual environment and install requirements.txt.
3. Run python manage.py check and python manage.py migrate from backend.
4. Start Django on 127.0.0.1:8000 and Vite on 127.0.0.1:5173. Vite proxies /api to Django.
5. Use a real Django account. Registration creates customer accounts only. An administrator must grant staff/admin roles; browser role switching is disabled.

The local administrator login generated at the user's request is stored in backend/.env.local-admin, which is Git ignored. It is not a database connection file. Neither it nor backend/.env should be committed.

The connection requires SSL. Production requires DATABASE_URL; SQLite fallback is development-only. RLS/security migrations protect Django tables from Supabase Data API access. Do not create competing tables by hand or add Supabase Auth.

Current validation: 35 migrations applied to development Supabase; no drift. 15 backend tests on isolated SQLite and 51 frontend tests passed. Live backend creation/conversion and browser create/reload persistence were verified; disposable verification records removed. No production/performance guarantee is implied.

See ../docs/contracts/workspace-integration.md for supported commands and explicit feature boundaries, and INTEGRATION_REPORT.md for the session report. The intentionally irreversible security migrations require review before merge.
