"""
Backend API tests for Salah Time Generator.
Tests all major endpoints: auth, masjids, waqth-charts, salah-configs,
generate-salah, exports, dashboard stats.

Auth: Bearer token test_session_salah_123 (seeded test user 'test-user-salah').
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://azan-scheduler-pro.preview.emergentagent.com").rstrip("/")
SESSION_TOKEN = "test_session_salah_123"
HEADERS = {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}


# ---------- AUTH ----------
class TestAuth:
    def test_me_authenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=HEADERS, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == "test-user-salah"
        assert "email" in data

    def test_me_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=20)
        assert r.status_code == 401

    def test_me_invalid_token(self):
        r = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_xyz"},
            timeout=20,
        )
        assert r.status_code == 401


# ---------- DASHBOARD ----------
class TestDashboard:
    def test_stats(self):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=HEADERS, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        for key in ["masjid_count", "chart_count", "config_count", "recent_masjids"]:
            assert key in data
        assert isinstance(data["masjid_count"], int)
        assert data["masjid_count"] >= 1
        assert data["chart_count"] >= 1


# ---------- MASJID CRUD ----------
class TestMasjid:
    created_id = None

    def test_list_masjids(self):
        r = requests.get(f"{BASE_URL}/api/masjids", headers=HEADERS, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert any(m["masjid_id"] == "masjid_14b6ab69c3f2" for m in data)

    def test_create_get_update_delete(self):
        # Create
        payload = {"name": "TEST_Masjid_Auto", "location_link": "https://maps.google.com/?q=test"}
        r = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert "masjid_id" in data
        mid = data["masjid_id"]
        TestMasjid.created_id = mid

        # Get
        r2 = requests.get(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["name"] == payload["name"]

        # Update
        update = {"name": "TEST_Masjid_Updated", "location_link": "https://maps.google.com/?q=updated"}
        r3 = requests.put(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, json=update, timeout=20)
        assert r3.status_code == 200
        # Verify persistence
        r4 = requests.get(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        assert r4.json()["name"] == "TEST_Masjid_Updated"

        # Delete
        r5 = requests.delete(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        assert r5.status_code == 200
        r6 = requests.get(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        assert r6.status_code == 404

    def test_get_seeded_masjid(self):
        r = requests.get(f"{BASE_URL}/api/masjids/masjid_14b6ab69c3f2", headers=HEADERS, timeout=20)
        assert r.status_code == 200
        assert r.json()["name"]


# ---------- WAQTH CHARTS ----------
class TestWaqthCharts:
    def test_list_charts(self):
        r = requests.get(f"{BASE_URL}/api/waqth-charts", headers=HEADERS, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert any(c["chart_id"] == "chart_e9e924a51a31" for c in data)

    def test_create_and_delete_chart(self):
        payload = {
            "name": "TEST_Chart_Auto",
            "district": "TestDist",
            "state": "TS",
            "country": "Testland",
            "prayer_times": [
                {"date": "2026-01-01", "fajr": "05:32", "sunrise": "06:45",
                 "zuhr": "12:13", "asr": "15:23", "maghrib": "17:54", "isha": "19:11"}
            ],
        }
        r = requests.post(f"{BASE_URL}/api/waqth-charts", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 200, r.text
        cid = r.json()["chart_id"]
        # Get
        r2 = requests.get(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)
        assert r2.status_code == 200
        assert r2.json()["name"] == "TEST_Chart_Auto"
        assert len(r2.json()["prayer_times"]) == 1
        # Delete
        r3 = requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)
        assert r3.status_code == 200


# ---------- SALAH CONFIGS ----------
class TestSalahConfig:
    def test_get_seeded_config(self):
        r = requests.get(
            f"{BASE_URL}/api/salah-configs/masjid_14b6ab69c3f2",
            headers=HEADERS, timeout=20,
        )
        assert r.status_code == 200
        configs = r.json()
        assert isinstance(configs, list)
        assert len(configs) >= 1

    def test_create_config_upsert(self):
        payload = {
            "masjid_id": "masjid_14b6ab69c3f2",
            "chart_number": 2,
            "waqth_chart_id": "chart_e9e924a51a31",
            "adjustments": {
                "fajr": {"mode": "adjustment", "rounding": "round_up_5", "iqamah_offset": 20},
                "zuhr": {"mode": "fixed", "fixed_time": "13:30", "iqamah_offset": 5},
            },
        }
        r = requests.post(f"{BASE_URL}/api/salah-configs", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 200, r.text
        # Upsert again
        r2 = requests.post(f"{BASE_URL}/api/salah-configs", headers=HEADERS, json=payload, timeout=20)
        assert r2.status_code == 200

        # Verify - chart_number=2 config should exist
        r3 = requests.get(
            f"{BASE_URL}/api/salah-configs/masjid_14b6ab69c3f2", headers=HEADERS, timeout=20
        )
        configs = r3.json()
        chart_nums = [c["chart_number"] for c in configs]
        assert 2 in chart_nums


# ---------- GENERATE SALAH ----------
class TestGenerateSalah:
    def test_generate(self):
        payload = {"masjid_id": "masjid_14b6ab69c3f2", "chart_number": 1}
        r = requests.post(f"{BASE_URL}/api/generate-salah", headers=HEADERS, json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "generated" in data
        assert isinstance(data["generated"], list)
        assert len(data["generated"]) >= 1
        first = data["generated"][0]
        # Should have azan and iqamah keys for prayers
        assert "fajr_azan" in first
        assert "fajr_iqamah" in first

    def test_generate_missing_config(self):
        payload = {"masjid_id": "masjid_does_not_exist", "chart_number": 1}
        r = requests.post(f"{BASE_URL}/api/generate-salah", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 404


# ---------- EXPORTS ----------
class TestExports:
    SAMPLE = [
        {"date": "2026-01-01", "fajr_azan": "05:35", "fajr_iqamah": "05:55",
         "zuhr_azan": "13:30", "zuhr_iqamah": "13:35"}
    ]

    def test_export_csv(self):
        r = requests.post(
            f"{BASE_URL}/api/export/csv",
            headers=HEADERS,
            json={"data": self.SAMPLE, "masjid_name": "TEST_Masjid"},
            timeout=20,
        )
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "")
        assert b"fajr_azan" in r.content

    def test_export_excel(self):
        r = requests.post(
            f"{BASE_URL}/api/export/excel",
            headers=HEADERS,
            json={"data": self.SAMPLE, "masjid_name": "TEST_Masjid"},
            timeout=20,
        )
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "spreadsheet" in ct or "openxmlformats" in ct
        assert len(r.content) > 100

    def test_export_pdf(self):
        r = requests.post(
            f"{BASE_URL}/api/export/pdf",
            headers=HEADERS,
            json={"data": self.SAMPLE, "masjid_name": "TEST_Masjid"},
            timeout=20,
        )
        assert r.status_code == 200
        assert "pdf" in r.headers.get("content-type", "")
        assert r.content[:4] == b"%PDF"
