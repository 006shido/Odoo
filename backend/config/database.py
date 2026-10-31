import os
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs


def database_config(base_dir: Path) -> dict:
    """Use Supabase Postgres when configured; SQLite is local development only."""
    url = os.environ.get('DATABASE_URL', '').strip()
    if not url:
        if os.environ.get('DJANGO_DEBUG', 'True') != 'True':
            raise ValueError('DATABASE_URL is required when DJANGO_DEBUG is not True')
        return {'ENGINE': 'django.db.backends.sqlite3', 'NAME': base_dir / 'db.sqlite3'}
    parsed = urlsplit(url)
    if parsed.scheme not in ('postgres', 'postgresql') or not parsed.hostname:
        raise ValueError('DATABASE_URL must be a PostgreSQL connection URL')
    sslmode = parse_qs(parsed.query).get('sslmode', ['require'])[0]
    if sslmode not in ('require', 'verify-ca', 'verify-full'):
        raise ValueError('DATABASE_URL must require SSL')
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': unquote(parsed.path.lstrip('/')) or 'postgres',
        'USER': unquote(parsed.username or ''),
        'PASSWORD': unquote(parsed.password or ''),
        'HOST': parsed.hostname,
        'PORT': str(parsed.port or 5432),
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
        'DISABLE_SERVER_SIDE_CURSORS': True,
        'OPTIONS': {'sslmode': sslmode, 'connect_timeout': 10, 'prepare_threshold': None},
    }
