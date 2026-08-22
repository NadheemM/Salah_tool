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


# ---------- Two timings for one prayer (Shafi / Hanafi) ----------
# Mixed case on purpose: real charts arrive as "asr Shafi", and column names are
# normalised to lowercase before matching.
DUAL_ROWS = [
    {"month": "January", "date": "1", "fajr": "05:14", "zuhar": "12:27",
     "asr Shafi": "15:33", "asr Hanafi": "16:19", "magrib": "18:02",
     "isha shafi": "19:17", "isha Hanafi": "19:26"},
]
# Same values, Hanafi listed first — the layout that silently flipped the output.
FLIPPED_ROWS = [
    {"month": "January", "date": "1", "fajr": "05:14", "zuhar": "12:27",
     "asr Hanafi": "16:19", "asr Shafi": "15:33", "magrib": "18:02",
     "isha Hanafi": "19:26", "isha shafi": "19:17"},
]
NO_ROUNDING = {"mode": "adjustment", "rounding": "custom", "custom_value": 0}


def _make_chart(name, rows):
    r = requests.post(f"{BASE_URL}/api/waqth-charts", headers=HEADERS,
                      json={"name": name, "prayer_times": rows}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["chart_id"]


def _generate(masjid_id, chart_id, adjustments, chart_number=1):
    requests.post(f"{BASE_URL}/api/salah-configs", headers=HEADERS, timeout=20,
                  json={"masjid_id": masjid_id, "chart_number": chart_number,
                        "waqth_chart_id": chart_id, "adjustments": adjustments})
    r = requests.post(f"{BASE_URL}/api/generate-salah", headers=HEADERS, timeout=30,
                      json={"masjid_id": masjid_id, "chart_number": chart_number})
    assert r.status_code == 200, r.text
    return r.json()["generated"][0]


class TestDualTimings:
    def test_variants_detected_and_labelled(self):
        cid = _make_chart("TEST_Dual", DUAL_ROWS)
        try:
            r = requests.get(f"{BASE_URL}/api/waqth-charts/{cid}/columns",
                             headers=HEADERS, timeout=20)
            assert r.status_code == 200, r.text
            variants = r.json()["variants"]
            assert set(variants) == {"asr", "isha"}, f"got {list(variants)}"
            assert [v["label"] for v in variants["asr"]] == ["Shafi", "Hanafi"]
            assert [v["column"] for v in variants["asr"]] == ["asr shafi", "asr hanafi"]
            assert [v["label"] for v in variants["isha"]] == ["Shafi", "Hanafi"]
        finally:
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)

    def test_single_timing_chart_has_no_variants(self):
        cid = _make_chart("TEST_Single", [{"date": "1", "fajr": "05:14", "asr": "15:33"}])
        try:
            r = requests.get(f"{BASE_URL}/api/waqth-charts/{cid}/columns",
                             headers=HEADERS, timeout=20)
            assert r.json()["variants"] == {}
        finally:
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)

    def test_pinned_column_selects_the_right_timing(self):
        cid = _make_chart("TEST_Dual_Pin", DUAL_ROWS)
        m = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS,
                          json={"name": "TEST_Dual_Masjid"}, timeout=20).json()["masjid_id"]
        try:
            hanafi = _generate(m, cid, {
                "asr": {**NO_ROUNDING, "column": "asr hanafi"},
                "isha": {**NO_ROUNDING, "column": "isha hanafi"}})
            assert hanafi["asr_azan"] == "16:19", hanafi
            assert hanafi["isha_azan"] == "19:26", hanafi

            shafi = _generate(m, cid, {
                "asr": {**NO_ROUNDING, "column": "asr shafi"},
                "isha": {**NO_ROUNDING, "column": "isha shafi"}})
            assert shafi["asr_azan"] == "15:33", shafi
            assert shafi["isha_azan"] == "19:17", shafi

            # Mixed selection is allowed — the choice is per prayer.
            mixed = _generate(m, cid, {
                "asr": {**NO_ROUNDING, "column": "asr hanafi"},
                "isha": {**NO_ROUNDING, "column": "isha shafi"}})
            assert mixed["asr_azan"] == "16:19" and mixed["isha_azan"] == "19:17", mixed
        finally:
            requests.delete(f"{BASE_URL}/api/masjids/{m}", headers=HEADERS, timeout=20)
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)

    def test_config_without_column_keeps_old_behaviour(self):
        """Regression guard: configs saved before this feature must not change."""
        cid = _make_chart("TEST_Dual_Legacy", DUAL_ROWS)
        m = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS,
                          json={"name": "TEST_Legacy_Masjid"}, timeout=20).json()["masjid_id"]
        try:
            row = _generate(m, cid, {"asr": NO_ROUNDING, "isha": NO_ROUNDING})
            assert row["asr_azan"] == "15:33", row
            assert row["isha_azan"] == "19:17", row
        finally:
            requests.delete(f"{BASE_URL}/api/masjids/{m}", headers=HEADERS, timeout=20)
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)

    def test_pinned_column_survives_reordered_columns(self):
        """Pinning by column name, not position, is what removes the order hazard."""
        cid = _make_chart("TEST_Dual_Flipped", FLIPPED_ROWS)
        m = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS,
                          json={"name": "TEST_Flipped_Masjid"}, timeout=20).json()["masjid_id"]
        try:
            # Unpinned, the first column wins — here that is Hanafi.
            unpinned = _generate(m, cid, {"asr": NO_ROUNDING})
            assert unpinned["asr_azan"] == "16:19", unpinned
            # Pinned to Shafi, position is irrelevant.
            pinned = _generate(m, cid, {"asr": {**NO_ROUNDING, "column": "asr shafi"}})
            assert pinned["asr_azan"] == "15:33", pinned
        finally:
            requests.delete(f"{BASE_URL}/api/masjids/{m}", headers=HEADERS, timeout=20)
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)


# ---------- Date built from separate month / date columns ----------
class TestMonthDateColumns:
    def _run(self, rows):
        cid = _make_chart("TEST_MonthDate", rows)
        m = requests.post(f"{BASE_URL}/api/masjids", headers=HEADERS,
                          json={"name": "TEST_MonthDate_Masjid"}, timeout=20).json()["masjid_id"]
        try:
            gen = _generate(m, cid, {"asr": NO_ROUNDING})
            r = requests.post(f"{BASE_URL}/api/generate-salah", headers=HEADERS, timeout=30,
                              json={"masjid_id": m, "chart_number": 1})
            return [row["date"] for row in r.json()["generated"]], gen
        finally:
            requests.delete(f"{BASE_URL}/api/masjids/{m}", headers=HEADERS, timeout=20)
            requests.delete(f"{BASE_URL}/api/waqth-charts/{cid}", headers=HEADERS, timeout=20)

    def test_month_plus_day_in_date_column(self):
        """'month'=January + 'date'=1 must render as 1/1, not 1."""
        rows = [{"month": m, "date": str(d), "fajr": "05:14", "asr": "15:33"}
                for m in ("January", "February") for d in (1, 6, 24)]
        dates, _ = self._run(rows)
        assert dates == ["1/1", "6/1", "24/1", "1/2", "6/2", "24/2"], dates

    def test_full_date_column_is_left_alone(self):
        """A date column that already holds a real date must not be rewritten."""
        rows = [{"month": "January", "date": "01/01", "fajr": "05:14", "asr": "15:33"},
                {"month": "January", "date": "2026-01-15", "fajr": "05:15", "asr": "15:34"}]
        dates, _ = self._run(rows)
        assert dates == ["01/01", "2026-01-15"], dates

    def test_month_plus_day_columns_still_work(self):
        """The original month+day shape must keep working."""
        rows = [{"month": "3", "day": "5", "fajr": "05:14", "asr": "15:33"}]
        dates, _ = self._run(rows)
        assert dates == ["5/3"], dates

    def test_bare_day_without_month_column_unchanged(self):
        rows = [{"date": "5", "fajr": "05:14", "asr": "15:33"}]
        dates, _ = self._run(rows)
        assert dates == ["5"], dates


# ---------- Masjid serial numbers ----------
class TestMasjidSerialNumbers:
    def test_serial_not_reused_after_delete(self):
        """Deleting a masjid must not let the next one reuse its M0xx serial."""
        created = []
        try:
            for i in range(3):
                r = requests.post(
                    f"{BASE_URL}/api/masjids", headers=HEADERS,
                    json={"name": f"TEST_Serial_{i}"}, timeout=20,
                )
                assert r.status_code == 200, r.text
                created.append(r.json())

            first_serials = [m["serial_no"] for m in created]
            assert len(set(first_serials)) == 3, f"serials collided: {first_serials}"

            # Drop the middle one, then add another.
            requests.delete(
                f"{BASE_URL}/api/masjids/{created[1]['masjid_id']}",
                headers=HEADERS, timeout=20,
            )
            created.pop(1)

            r = requests.post(
                f"{BASE_URL}/api/masjids", headers=HEADERS,
                json={"name": "TEST_Serial_after_delete"}, timeout=20,
            )
            assert r.status_code == 200, r.text
            created.append(r.json())

            serials = [m["serial_no"] for m in created]
            assert len(set(serials)) == len(serials), f"serial reused: {serials}"
            assert created[-1]["serial_no"] > max(first_serials), (
                f"new serial {created[-1]['serial_no']} must exceed {max(first_serials)}"
            )
        finally:
            for m in created:
                requests.delete(
                    f"{BASE_URL}/api/masjids/{m['masjid_id']}", headers=HEADERS, timeout=20,
                )


# ---------- Masjid search ----------
class TestMasjidSearch:
    @pytest.mark.parametrize("term", ["(", "[", "*", "a(b", "+", "?"])
    def test_regex_metacharacters_do_not_500(self, term):
        """The search box is a substring search; metacharacters must not blow up."""
        r = requests.get(
            f"{BASE_URL}/api/masjids", headers=HEADERS,
            params={"search": term}, timeout=20,
        )
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), list)

    def test_metacharacters_match_literally(self):
        r = requests.post(
            f"{BASE_URL}/api/masjids", headers=HEADERS,
            json={"name": "TEST_Regex_(paren)"}, timeout=20,
        )
        assert r.status_code == 200, r.text
        mid = r.json()["masjid_id"]
        try:
            s = requests.get(
                f"{BASE_URL}/api/masjids", headers=HEADERS,
                params={"search": "(paren)"}, timeout=20,
            )
            assert s.status_code == 200, s.text
            assert any(m["masjid_id"] == mid for m in s.json()), \
                "literal '(paren)' should match the masjid named TEST_Regex_(paren)"
        finally:
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
