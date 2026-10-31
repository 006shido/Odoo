import os
import unittest
from pathlib import Path
from unittest.mock import patch
from config.database import database_config


class DatabaseConfigTests(unittest.TestCase):
    def test_local_fallback(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(database_config(Path('.'))['ENGINE'], 'django.db.backends.sqlite3')

    def test_production_requires_database(self):
        with patch.dict(os.environ, {'DJANGO_DEBUG': 'False'}, clear=True):
            with self.assertRaises(ValueError):
                database_config(Path('.'))

    def test_pooler_and_encoded_password(self):
        with patch.dict(os.environ, {'DATABASE_URL': 'postgresql://postgres.example:p%40ss%3Aword@pooler.example:5432/postgres'}, clear=True):
            config = database_config(Path('.'))
            self.assertEqual(config['PASSWORD'], 'p@ss:word')
            self.assertEqual(config['USER'], 'postgres.example')
            self.assertEqual(config['OPTIONS']['sslmode'], 'require')
            self.assertIsNone(config['OPTIONS']['prepare_threshold'])
            self.assertEqual(config['CONN_MAX_AGE'], 0)
            self.assertEqual(config['OPTIONS']['pool']['max_size'], 4)

    def test_rejects_insecure_or_invalid_database(self):
        for url in ('sqlite:///test', 'postgresql://db/test?sslmode=disable'):
            with self.subTest(url=url), patch.dict(os.environ, {'DATABASE_URL': url}, clear=True):
                with self.assertRaises(ValueError):
                    database_config(Path('.'))
