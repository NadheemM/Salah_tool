"""Seed the local dev database with the fixtures the test suite expects.

Both test files in backend/tests/ were written against a hosted preview
environment and reference fixed IDs (a session token, one masjid, two charts).
This script recreates exactly those documents locally and is idempotent, so it
is safe to re-run. It also creates the indexes the query patterns in server.py
need.

Usage:
    backend/.venv/bin/python backend/scripts/seed_dev.py
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

sys.path.insert(0, str(ROOT_DIR))
from indexes import INDEXES, ensure_indexes_sync  # noqa: E402

# IDs hardcoded in backend/tests/backend_test.py and test_new_features.py
USER_ID = "test-user-salah"
SESSION_TOKEN = "test_session_salah_123"
MASJID_ID = "masjid_14b6ab69c3f2"
PLAIN_CHART = "chart_e9e924a51a31"
PERIOD_CHART = "chart_343475f69d4a"

# Period-format times ("5.2" means 5:20) exercise parse_time_str in server.py.
PERIOD_ROWS = [
    {"date": "01/01", "fajr": "5.2", "sunrise": "6.32", "zuhr": "12.15",
     "asr": "15.45", "maghrib": "18.32", "isha": "19.48"},
    {"date": "02/01", "fajr": "5.21", "sunrise": "6.33", "zuhr": "12.16",
     "asr": "15.46", "maghrib": "18.33", "isha": "19.49"},
    {"date": "03/01", "fajr": "5.22", "sunrise": "6.34", "zuhr": "12.17",
     "asr": "15.47", "maghrib": "18.34", "isha": "19.5"},
]

PLAIN_ROWS = [
    {"date": "01/01", "fajr": "05:32", "sunrise": "06:45", "zuhr": "12:13",
     "asr": "15:23", "maghrib": "17:54", "isha": "19:11"},
    {"date": "02/01", "fajr": "05:33", "sunrise": "06:46", "zuhr": "12:14",
     "asr": "15:24", "maghrib": "17:55", "isha": "19:12"},
]

def main():
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        sys.exit("MONGO_URL and DB_NAME must be set (see backend/.env)")

    db = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)[db_name]
    now = datetime.now(timezone.utc)

    db.users.update_one(
        {"user_id": USER_ID},
        {"$set": {
            "user_id": USER_ID,
            "email": "test-user-salah@local.test",
            "name": "Test User Salah",
            "password_hash": bcrypt.hashpw(b"testpass123", bcrypt.gensalt()).decode(),
        }, "$setOnInsert": {"created_at": now.isoformat()}},
        upsert=True,
    )

    # Long expiry so the fixture token does not go stale mid-development.
    db.user_sessions.update_one(
        {"session_token": SESSION_TOKEN},
        {"$set": {
            "user_id": USER_ID,
            "session_token": SESSION_TOKEN,
            "expires_at": (now + timedelta(days=3650)).isoformat(),
        }, "$setOnInsert": {"created_at": now.isoformat()}},
        upsert=True,
    )

    db.masjids.update_one(
        {"masjid_id": MASJID_ID},
        {"$set": {
            "masjid_id": MASJID_ID,
            "serial_no": 1,
            "name": "Seed Masjid",
            "district": "Chennai",
            "state": "Tamil Nadu",
            "masjid_address": "1 Seed Street",
            "location_link": "",
            "mihrab_masjid_id": "MIHRAB-SEED",
            "imam": "Seed Imam",
            "imam_number": "+910000000001",
            "muaddin": "Seed Muaddin",
            "muaddin_number": "+910000000002",
            "committee_members": [],
            "waqth_chart_id": PLAIN_CHART,
            "adjustments": {},
            "remark": "Seeded fixture for backend/tests",
            "source": "seed",
            "user_id": USER_ID,
        }, "$setOnInsert": {"created_at": now.isoformat()}},
        upsert=True,
    )

    for chart_id, name, rows in (
        (PLAIN_CHART, "Seed Chart", PLAIN_ROWS),
        (PERIOD_CHART, "Period Format Test Chart", PERIOD_ROWS),
    ):
        db.waqth_charts.update_one(
            {"chart_id": chart_id},
            {"$set": {
                "chart_id": chart_id,
                "name": name,
                "district": "Chennai",
                "state": "Tamil Nadu",
                "country": "India",
                "prayer_times": rows,
                "user_id": USER_ID,
            }, "$setOnInsert": {"created_at": now.isoformat()}},
            upsert=True,
        )

    # backend_test.py::TestGenerateSalah::test_generate needs chart_number=1.
    db.salah_configs.update_one(
        {"masjid_id": MASJID_ID, "chart_number": 1, "user_id": USER_ID},
        {"$set": {
            "config_id": "config_seed000000001",
            "masjid_id": MASJID_ID,
            "chart_number": 1,
            "waqth_chart_id": PLAIN_CHART,
            "adjustments": {
                "fajr": {"mode": "adjustment", "rounding": "round_up_5", "iqamah_offset": 20},
                "zuhr": {"mode": "fixed", "fixed_time": "13:00", "iqamah_offset": 15},
                "asr": {"mode": "adjustment", "rounding": "nearest_5", "iqamah_offset": 10},
                "maghrib": {"mode": "adjustment", "rounding": "nearest_5", "iqamah_offset": 5},
                "isha": {"mode": "adjustment", "rounding": "round_up_5", "iqamah_offset": 15},
            },
            "user_id": USER_ID,
        }, "$setOnInsert": {"created_at": now.isoformat()}},
        upsert=True,
    )

    index_count = ensure_indexes_sync(db)

    print(f"Seeded {db_name}:")
    print(f"  user           {USER_ID}")
    print(f"  session token  {SESSION_TOKEN}")
    print(f"  masjid         {MASJID_ID}")
    print(f"  charts         {PLAIN_CHART}, {PERIOD_CHART}")
    print(f"  indexes        {index_count} across {len(INDEXES)} collections")


if __name__ == "__main__":
    main()
