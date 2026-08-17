"""Index definitions for the Salah Tool database.

Single source of truth, imported by both the app (which ensures them on startup)
and backend/scripts/seed_dev.py, so local and deployed databases cannot drift.

Every index here is derived from an actual query in server.py; the comment on
each entry names the caller. `create_index` is idempotent, so re-running this is
a cheap no-op once the indexes exist.

Apply to a deployed database without waiting for a redeploy:

    MONGO_URL='<atlas-uri>' DB_NAME=salah_db backend/.venv/bin/python backend/indexes.py
"""
import os
import sys
from pathlib import Path

from pymongo import ASCENDING

# collection -> list of index key specs
INDEXES = {
    # find_one by session_token runs on EVERY authenticated request (server.py:108).
    "user_sessions": [
        [("session_token", ASCENDING)],
        [("user_id", ASCENDING)],          # delete_many on password reset
    ],
    # find_one by user_id also runs on every authenticated request (server.py:120).
    "users": [
        [("user_id", ASCENDING)],
        [("email", ASCENDING)],            # login / register / forgot-password
    ],
    # masjid_id is a UUID, so it is selective on its own — and server.py:418
    # queries it with no user_id, which a user_id-prefixed index cannot serve.
    "masjids": [
        [("masjid_id", ASCENDING)],
        [("user_id", ASCENDING), ("serial_no", ASCENDING)],   # next-serial lookup
        [("user_id", ASCENDING), ("created_at", ASCENDING)],  # dashboard recents
    ],
    "waqth_charts": [
        [("chart_id", ASCENDING)],
        [("user_id", ASCENDING)],          # list + count
    ],
    "salah_configs": [
        [("user_id", ASCENDING), ("masjid_id", ASCENDING), ("chart_number", ASCENDING)],
        [("masjid_id", ASCENDING)],        # cascade delete at server.py:427
    ],
    "password_reset_tokens": [
        [("token", ASCENDING)],
        [("user_id", ASCENDING)],
    ],
}

TOTAL = sum(len(v) for v in INDEXES.values())


async def ensure_indexes(db):
    """Create any missing indexes. Async (motor) — used by the app on startup."""
    count = 0
    for collection, keysets in INDEXES.items():
        for keys in keysets:
            await db[collection].create_index(keys)
            count += 1
    return count


def ensure_indexes_sync(db):
    """Create any missing indexes. Sync (pymongo) — used by scripts."""
    count = 0
    for collection, keysets in INDEXES.items():
        for keys in keysets:
            db[collection].create_index(keys)
            count += 1
    return count


def main():
    from dotenv import load_dotenv
    from pymongo import MongoClient

    load_dotenv(Path(__file__).resolve().parent / ".env")
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        sys.exit("MONGO_URL and DB_NAME must be set (see backend/.env)")

    # Show where this is pointing — this script is meant to be run against
    # production too, so make the target unmistakable before it writes.
    host = mongo_url.split("@")[-1].split("/")[0] if "@" in mongo_url else mongo_url
    print(f"Ensuring {TOTAL} indexes on {db_name} at {host}")

    db = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)[db_name]
    ensure_indexes_sync(db)

    for collection in INDEXES:
        names = [ix["name"] for ix in db[collection].list_indexes()]
        print(f"  {collection:22} {len(names)} total: {', '.join(names)}")
    print("Done.")


if __name__ == "__main__":
    main()
