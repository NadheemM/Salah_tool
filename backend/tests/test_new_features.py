"""
Iteration 2 tests - period-format time parsing, exports as binary files,
edit-masjid with new fields (imam, muaddin, committee_members, remark, mihrab_masjid_id),
waqth-chart detail, CORS expose_headers.
"""
import os
import io
import csv
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://azan-scheduler-pro.preview.emergentagent.com",
).rstrip("/")
SESSION_TOKEN = "test_session_salah_123"
HEADERS = {"Authorization": f"Bearer {SESSION_TOKEN}", "Content-Type": "application/json"}

SEED_MASJID = "masjid_14b6ab69c3f2"
PERIOD_CHART = "chart_343475f69d4a"  # has 5.2, 18.32 etc.


# ---------- Period-format time parsing ----------
PERIOD_ADJUSTMENTS = {
    "fajr": {"mode": "adjustment", "rounding": "round_up_5", "iqamah_offset": 20},
    "sunrise": {"mode": "adjustment", "rounding": "nearest_5", "iqamah_offset": 0},
    "zuhr": {"mode": "fixed", "fixed_time": "13:00", "iqamah_offset": 15},
    "asr": {"mode": "adjustment", "rounding": "nearest_5", "iqamah_offset": 10},
    "maghrib": {"mode": "adjustment", "rounding": "nearest_5", "iqamah_offset": 5},
    "isha": {"mode": "adjustment", "rounding": "round_up_5", "iqamah_offset": 15},
}


@pytest.fixture(autouse=False)
def _seed_period_config():
    """Ensure chart_number=2 on SEED_MASJID points at PERIOD_CHART with known adjustments."""
    requests.post(
        f"{BASE_URL}/api/salah-configs",
        headers=HEADERS,
        json={
            "masjid_id": SEED_MASJID,
            "chart_number": 2,
            "waqth_chart_id": PERIOD_CHART,
            "adjustments": PERIOD_ADJUSTMENTS,
        },
        timeout=20,
    )
    yield


class TestPeriodFormatParsing:
    def test_generate_with_period_format_chart(self, _seed_period_config):
        """chart_number=2 on seeded masjid references chart_343475f69d4a with '5.2','18.32' format."""
        r = requests.post(
            f"{BASE_URL}/api/generate-salah",
            headers=HEADERS,
            json={"masjid_id": SEED_MASJID, "chart_number": 2},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        gen = data["generated"]
        assert len(gen) >= 2, "Expected 2 rows from Period Format Test Chart"
        first = gen[0]
        # Raw fajr = "5.2" must parse to 5:20; with round_up_5 → 05:20; iqamah_offset 20 → 05:40
        assert first["fajr_azan"] == "05:20", f"fajr_azan={first.get('fajr_azan')}"
        assert first["fajr_iqamah"] == "05:40", f"fajr_iqamah={first.get('fajr_iqamah')}"
        # Raw maghrib = "18.32" → 18:32; nearest_5 → 18:30; iqamah_offset 5 → 18:35
        assert first["maghrib_azan"] == "18:30", f"maghrib_azan={first.get('maghrib_azan')}"
        assert first["maghrib_iqamah"] == "18:35", f"maghrib_iqamah={first.get('maghrib_iqamah')}"
        # zuhr is fixed 13:00 with iqamah_offset 15 -> 13:15
        assert first["zuhr_azan"] == "13:00"
        assert first["zuhr_iqamah"] == "13:15"
        # Raw isha = "19.48" → 19:48; round_up_5 → 19:50; iqamah_offset 15 → 20:05
        assert first["isha_azan"] == "19:50", f"isha_azan={first.get('isha_azan')}"
        assert first["isha_iqamah"] == "20:05", f"isha_iqamah={first.get('isha_iqamah')}"

    def test_all_times_hhmm_format(self, _seed_period_config):
        r = requests.post(
            f"{BASE_URL}/api/generate-salah",
            headers=HEADERS,
            json={"masjid_id": SEED_MASJID, "chart_number": 2},
            timeout=30,
        )
        assert r.status_code == 200
        gen = r.json()["generated"]
        for row in gen:
            for key, val in row.items():
                if key == "date" or val == "":
                    continue
                # All produced times must be HH:MM
                assert len(val) == 5 and val[2] == ":", f"{key}={val} not HH:MM"
                hh, mm = val.split(":")
                assert hh.isdigit() and mm.isdigit()
                assert 0 <= int(hh) <= 23
                assert 0 <= int(mm) <= 59


# ---------- Waqth Chart Detail ----------
class TestWaqthChartDetail:
    def test_get_period_chart(self):
        r = requests.get(
            f"{BASE_URL}/api/waqth-charts/{PERIOD_CHART}",
            headers=HEADERS,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["chart_id"] == PERIOD_CHART
        assert data["name"] == "Period Format Test Chart"
        assert isinstance(data["prayer_times"], list)
        assert len(data["prayer_times"]) >= 2
        pt = data["prayer_times"][0]
        for k in ["date", "fajr", "sunrise", "zuhr", "asr", "maghrib", "isha"]:
            assert k in pt

    def test_get_nonexistent_chart_404(self):
        r = requests.get(
            f"{BASE_URL}/api/waqth-charts/chart_does_not_exist_xyz",
            headers=HEADERS,
            timeout=20,
        )
        assert r.status_code == 404


# ---------- Edit Masjid with new fields ----------
class TestMasjidEditNewFields:
    def test_create_with_new_fields(self):
        payload = {
            "name": "TEST_NewFields_Masjid",
            "location_link": "https://maps.google.com/?q=x",
            "imam": "Imam Abdullah",
            "muaddin": "Bilal",
            "committee_members": ["Ali", "Omar", "Yusuf"],
            "remark": "Friday jamaat 13:30",
            "mihrab_masjid_id": "MIHRAB-0001",
        }
        r = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        mid = data["masjid_id"]
        assert data["imam"] == "Imam Abdullah"
        assert data["muaddin"] == "Bilal"
        assert data["committee_members"] == ["Ali", "Omar", "Yusuf"]
        assert data["remark"] == "Friday jamaat 13:30"
        assert data["mihrab_masjid_id"] == "MIHRAB-0001"

        # GET to verify persistence
        g = requests.get(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        assert g.status_code == 200
        gd = g.json()
        assert gd["imam"] == "Imam Abdullah"
        assert gd["committee_members"] == ["Ali", "Omar", "Yusuf"]

        # UPDATE all the fields
        update = {
            "name": "TEST_NewFields_Updated",
            "location_link": "https://maps.google.com/?q=y",
            "imam": "Imam Ahmad",
            "muaddin": "Zayd",
            "committee_members": ["Hamza"],
            "remark": "Updated remark",
            "mihrab_masjid_id": "MIHRAB-9999",
        }
        u = requests.put(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, json=update, timeout=20)
        assert u.status_code == 200, u.text
        ud = u.json()
        assert ud["name"] == "TEST_NewFields_Updated"
        assert ud["imam"] == "Imam Ahmad"
        assert ud["muaddin"] == "Zayd"
        assert ud["committee_members"] == ["Hamza"]
        assert ud["remark"] == "Updated remark"
        assert ud["mihrab_masjid_id"] == "MIHRAB-9999"

        # GET to verify update persistence
        g2 = requests.get(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)
        gd2 = g2.json()
        assert gd2["imam"] == "Imam Ahmad"
        assert gd2["committee_members"] == ["Hamza"]
        assert gd2["mihrab_masjid_id"] == "MIHRAB-9999"

        # Cleanup
        requests.delete(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)

    def test_optional_fields_default_empty(self):
        """Creating without new fields should default to empty values."""
        payload = {"name": "TEST_NoNewFields", "location_link": ""}
        r = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS, json=payload, timeout=20)
        assert r.status_code == 200
        d = r.json()
        mid = d["masjid_id"]
        assert d.get("imam", "") == ""
        assert d.get("muaddin", "") == ""
        assert d.get("committee_members", []) == []
        requests.delete(f"{BASE_URL}/api/masjids/{mid}", headers=HEADERS, timeout=20)


# ---------- Export as binary ----------
SAMPLE = [
    {"date": "2026-01-01", "fajr_azan": "05:20", "fajr_iqamah": "05:40",
     "maghrib_azan": "18:30", "maghrib_iqamah": "18:35"}
]


class TestExportsBinary:
    def test_csv_download(self):
        r = requests.post(
            f"{BASE_URL}/api/export/csv",
            headers=HEADERS,
            json={"data": SAMPLE, "masjid_name": "TEST_Export"},
            timeout=20,
        )
        assert r.status_code == 200
        # Content-Disposition header must be set AND exposed via CORS expose_headers
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd
        assert "TEST_Export_salah_times.csv" in cd
        # Parse as csv
        text = r.content.decode()
        reader = list(csv.DictReader(io.StringIO(text)))
        assert len(reader) == 1
        assert reader[0]["fajr_azan"] == "05:20"
        assert reader[0]["maghrib_azan"] == "18:30"

    def test_excel_download(self):
        r = requests.post(
            f"{BASE_URL}/api/export/excel",
            headers=HEADERS,
            json={"data": SAMPLE, "masjid_name": "TEST_Export"},
            timeout=20,
        )
        assert r.status_code == 200
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd
        assert "TEST_Export_salah_times.xlsx" in cd
        # XLSX files start with PK (zip magic)
        assert r.content[:2] == b"PK", "Not a valid XLSX (missing zip header)"
        assert len(r.content) > 500

    def test_pdf_download(self):
        r = requests.post(
            f"{BASE_URL}/api/export/pdf",
            headers=HEADERS,
            json={"data": SAMPLE, "masjid_name": "TEST_Export"},
            timeout=20,
        )
        assert r.status_code == 200
        cd = r.headers.get("Content-Disposition", "")
        assert "attachment" in cd
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 500

    def test_cors_expose_headers_content_disposition(self):
        """Ensure Content-Disposition is listed in Access-Control-Expose-Headers so frontend can read filename."""
        # Send a request with Origin header to trigger CORS response header
        r = requests.post(
            f"{BASE_URL}/api/export/csv",
            headers={**HEADERS, "Origin": "https://azan-scheduler-pro.preview.emergentagent.com"},
            json={"data": SAMPLE, "masjid_name": "TEST_Export"},
            timeout=20,
        )
        assert r.status_code == 200
        expose = r.headers.get("Access-Control-Expose-Headers", "")
        assert "Content-Disposition" in expose, f"expose_headers missing Content-Disposition: {r.headers}"
