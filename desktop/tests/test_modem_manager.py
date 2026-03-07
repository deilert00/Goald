"""
Unit tests for modem_utils utility functions.

Run with:  python -m unittest tests/test_modem_manager.py
       or:  python -m pytest tests/test_modem_manager.py
"""

import sys
import os
import unittest
import json
import xml.etree.ElementTree as ET

# Allow importing modem_utils from the parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import modem_utils as mm


class TestQualityLabel(unittest.TestCase):
    """Tests for the quality_label helper function."""

    def test_excellent_rsrp(self):
        label, colour = mm.quality_label("-75", mm.RSRP_LEVELS)
        self.assertEqual(label, "Excellent")
        self.assertEqual(colour, "#27ae60")

    def test_good_rsrp(self):
        label, colour = mm.quality_label("-85", mm.RSRP_LEVELS)
        self.assertEqual(label, "Good")
        self.assertEqual(colour, "#2ecc71")

    def test_fair_rsrp(self):
        label, colour = mm.quality_label("-95", mm.RSRP_LEVELS)
        self.assertEqual(label, "Fair")
        self.assertEqual(colour, "#f39c12")

    def test_poor_rsrp(self):
        label, colour = mm.quality_label("-105", mm.RSRP_LEVELS)
        self.assertEqual(label, "Poor")
        self.assertEqual(colour, "#e67e22")

    def test_very_poor_rsrp(self):
        label, colour = mm.quality_label("-115", mm.RSRP_LEVELS)
        self.assertEqual(label, "Very Poor")
        self.assertEqual(colour, "#e74c3c")

    def test_none_value(self):
        label, colour = mm.quality_label(None, mm.RSRP_LEVELS)
        self.assertEqual(label, "N/A")
        self.assertEqual(colour, "#95a5a6")

    def test_dash_value(self):
        label, colour = mm.quality_label("—", mm.RSRP_LEVELS)
        self.assertEqual(label, "N/A")
        self.assertEqual(colour, "#95a5a6")

    def test_non_numeric_value(self):
        label, colour = mm.quality_label("not_a_number", mm.RSRP_LEVELS)
        self.assertEqual(label, "N/A")

    def test_excellent_sinr(self):
        label, colour = mm.quality_label("25", mm.SINR_LEVELS)
        self.assertEqual(label, "Excellent")

    def test_good_sinr(self):
        label, colour = mm.quality_label("15", mm.SINR_LEVELS)
        self.assertEqual(label, "Good")

    def test_fair_sinr(self):
        label, colour = mm.quality_label("5", mm.SINR_LEVELS)
        self.assertEqual(label, "Fair")

    def test_poor_sinr(self):
        label, colour = mm.quality_label("-2", mm.SINR_LEVELS)
        self.assertEqual(label, "Poor")

    def test_very_poor_sinr(self):
        label, colour = mm.quality_label("-10", mm.SINR_LEVELS)
        self.assertEqual(label, "Very Poor")

    def test_value_with_dbm_suffix(self):
        label, _ = mm.quality_label("-75dBm", mm.RSRP_LEVELS)
        self.assertEqual(label, "Excellent")

    def test_value_with_db_suffix(self):
        label, _ = mm.quality_label("-75dB", mm.RSRP_LEVELS)
        self.assertEqual(label, "Excellent")

    def test_value_with_whitespace(self):
        label, _ = mm.quality_label("  -85  ", mm.RSRP_LEVELS)
        self.assertEqual(label, "Good")


class TestXmlText(unittest.TestCase):
    """Tests for the _xml_text helper function."""

    def _make_element(self, xml_str: str) -> ET.Element:
        return ET.fromstring(xml_str)

    def test_finds_existing_tag(self):
        root = self._make_element("<response><rsrp>-90</rsrp></response>")
        result = mm._xml_text(root, "rsrp")
        self.assertEqual(result, "-90")

    def test_returns_default_for_missing_tag(self):
        root = self._make_element("<response></response>")
        result = mm._xml_text(root, "rsrp")
        self.assertEqual(result, "—")

    def test_returns_custom_default_for_missing_tag(self):
        root = self._make_element("<response></response>")
        result = mm._xml_text(root, "rsrp", default="N/A")
        self.assertEqual(result, "N/A")

    def test_returns_default_for_none_element(self):
        result = mm._xml_text(None, "rsrp")
        self.assertEqual(result, "—")

    def test_trims_whitespace(self):
        root = self._make_element("<response><band>  B3  </band></response>")
        result = mm._xml_text(root, "band")
        self.assertEqual(result, "B3")

    def test_returns_default_for_empty_tag(self):
        root = self._make_element("<response><rsrp></rsrp></response>")
        result = mm._xml_text(root, "rsrp")
        self.assertEqual(result, "—")


class TestFindJsonField(unittest.TestCase):
    """Tests for the _find_json_field helper function."""

    def test_finds_first_candidate(self):
        data = {"rssi": "-70", "RSSI": "-71"}
        result = mm._find_json_field(data, ["rssi", "RSSI"])
        self.assertEqual(result, "-70")

    def test_falls_back_to_second_candidate(self):
        data = {"RSSI": "-71"}
        result = mm._find_json_field(data, ["rssi", "RSSI"])
        self.assertEqual(result, "-71")

    def test_returns_none_when_no_match(self):
        data = {"unrelated_key": "value"}
        result = mm._find_json_field(data, ["rssi", "RSSI"])
        self.assertIsNone(result)

    def test_converts_int_to_str(self):
        data = {"rsrp": -90}
        result = mm._find_json_field(data, ["rsrp"])
        self.assertEqual(result, "-90")

    def test_returns_none_for_none_value(self):
        data = {"rsrp": None}
        result = mm._find_json_field(data, ["rsrp"])
        self.assertIsNone(result)

    def test_empty_data(self):
        result = mm._find_json_field({}, ["rsrp", "RSRP"])
        self.assertIsNone(result)


class TestRFSignalAsDict(unittest.TestCase):
    """Tests for RFSignal.as_dict()."""

    def test_all_none_by_default(self):
        signal = mm.RFSignal()
        d = signal.as_dict()
        self.assertIn("rssi", d)
        self.assertIn("rsrp", d)
        self.assertIn("sinr", d)
        self.assertIn("band", d)
        self.assertIn("timestamp", d)
        for val in d.values():
            self.assertIsNone(val)

    def test_populated_values_round_trip(self):
        signal = mm.RFSignal(
            rssi="-75",
            rsrp="-85",
            rsrq="-10",
            sinr="20",
            band="B3",
            channel="1300",
            timestamp="2026-01-01T00:00:00",
        )
        d = signal.as_dict()
        self.assertEqual(d["rssi"], "-75")
        self.assertEqual(d["rsrp"], "-85")
        self.assertEqual(d["band"], "B3")
        self.assertEqual(d["timestamp"], "2026-01-01T00:00:00")

    def test_as_dict_is_json_serialisable(self):
        signal = mm.RFSignal(rsrp="-90", sinr="15", band="B7")
        serialised = json.dumps(signal.as_dict())
        restored = json.loads(serialised)
        self.assertEqual(restored["rsrp"], "-90")
        self.assertEqual(restored["band"], "B7")


class TestHilinkBandLockBitmask(unittest.TestCase):
    """
    Test the band-lock bitmask logic inside set_hilink_band_lock.

    We test the bitmask calculation logic directly (without making HTTP calls).
    """

    def _compute_bitmask(self, bands):
        """Delegate to the public modem_utils helper."""
        return mm._bands_to_bitmask(bands)

    def test_band_1(self):
        bitmask = self._compute_bitmask(["1"])
        self.assertEqual(bitmask, 0b01)

    def test_band_3(self):
        bitmask = self._compute_bitmask(["3"])
        self.assertEqual(bitmask, 0b100)

    def test_band_7_and_20(self):
        bitmask = self._compute_bitmask(["7", "20"])
        expected = (1 << 6) | (1 << 19)
        self.assertEqual(bitmask, expected)

    def test_all_bands(self):
        bitmask = self._compute_bitmask(["3", "7", "20"])
        expected = (1 << 2) | (1 << 6) | (1 << 19)
        self.assertEqual(bitmask, expected)

    def test_invalid_band_ignored(self):
        bitmask = self._compute_bitmask(["abc", "3"])
        self.assertEqual(bitmask, 1 << 2)

    def test_out_of_range_band_ignored(self):
        bitmask = self._compute_bitmask(["0", "65", "3"])
        self.assertEqual(bitmask, 1 << 2)

    def test_empty_bands_zero(self):
        bitmask = self._compute_bitmask([])
        self.assertEqual(bitmask, 0)

    def test_bitmask_hex_format(self):
        bitmask = self._compute_bitmask(["3"])
        hex_str = format(bitmask, "016X")
        self.assertEqual(len(hex_str), 16)
        self.assertEqual(hex_str, "0000000000000004")


class TestFetchJsonSignalParsing(unittest.TestCase):
    """
    Tests for fetch_json_signal field-mapping logic, using a mock HTTP call.
    """

    def _parse_json_body(self, body: str) -> mm.RFSignal:
        """
        Replicate the parsing logic of fetch_json_signal without HTTP.
        """
        import datetime

        data = json.loads(body)
        for key in ("signal", "data", "result", "response"):
            if key in data and isinstance(data[key], dict):
                data = data[key]
                break

        return mm.RFSignal(
            rssi=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["rssi"]),
            rsrp=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["rsrp"]),
            rsrq=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["rsrq"]),
            sinr=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["sinr"]),
            band=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["band"]),
            channel=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["channel"]),
            bandwidth=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["bandwidth"]),
            mode=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["mode"]),
            cell_id=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["cell_id"]),
            pci=mm._find_json_field(data, mm.JSON_SIGNAL_FIELD_MAP["pci"]),
            timestamp=datetime.datetime.now().isoformat(timespec="seconds"),
        )

    def test_flat_json_lowercase(self):
        body = json.dumps({"rsrp": "-88", "sinr": "12", "band": "B3"})
        signal = self._parse_json_body(body)
        self.assertEqual(signal.rsrp, "-88")
        self.assertEqual(signal.sinr, "12")
        self.assertEqual(signal.band, "B3")

    def test_flat_json_uppercase(self):
        body = json.dumps({"RSRP": "-88", "SINR": "12"})
        signal = self._parse_json_body(body)
        self.assertEqual(signal.rsrp, "-88")
        self.assertEqual(signal.sinr, "12")

    def test_wrapped_in_signal_key(self):
        body = json.dumps({"signal": {"rsrp": "-92", "band": "B7"}})
        signal = self._parse_json_body(body)
        self.assertEqual(signal.rsrp, "-92")
        self.assertEqual(signal.band, "B7")

    def test_wrapped_in_data_key(self):
        body = json.dumps({"data": {"rsrp": "-95", "earfcn": "2850"}})
        signal = self._parse_json_body(body)
        self.assertEqual(signal.rsrp, "-95")
        self.assertEqual(signal.channel, "2850")

    def test_missing_fields_are_none(self):
        body = json.dumps({"rsrp": "-88"})
        signal = self._parse_json_body(body)
        self.assertIsNone(signal.rssi)
        self.assertIsNone(signal.band)


class TestHilinkXmlParsing(unittest.TestCase):
    """Tests for Huawei HiLink XML signal response parsing."""

    def _parse_xml_response(self, xml_str: str) -> mm.RFSignal:
        """Replicate fetch_hilink_signal parsing without HTTP."""
        import datetime

        root = ET.fromstring(xml_str)
        return mm.RFSignal(
            rssi=mm._xml_text(root, "rssi"),
            rsrp=mm._xml_text(root, "rsrp"),
            rsrq=mm._xml_text(root, "rsrq"),
            sinr=mm._xml_text(root, "sinr"),
            band=mm._xml_text(root, "band"),
            channel=mm._xml_text(root, "earfcn"),
            bandwidth=mm._xml_text(root, "bandwidth"),
            mode=mm._xml_text(root, "mode"),
            cell_id=mm._xml_text(root, "cell_id"),
            pci=mm._xml_text(root, "pci"),
            timestamp=datetime.datetime.now().isoformat(timespec="seconds"),
        )

    def test_typical_hilink_response(self):
        xml = (
            "<?xml version='1.0' encoding='UTF-8'?>"
            "<response>"
            "<rssi>-75</rssi>"
            "<rsrp>-90</rsrp>"
            "<rsrq>-11</rsrq>"
            "<sinr>18</sinr>"
            "<band>B3</band>"
            "<earfcn>1300</earfcn>"
            "<bandwidth>20</bandwidth>"
            "<mode>LTE</mode>"
            "<cell_id>12345</cell_id>"
            "<pci>123</pci>"
            "</response>"
        )
        signal = self._parse_xml_response(xml)
        self.assertEqual(signal.rssi, "-75")
        self.assertEqual(signal.rsrp, "-90")
        self.assertEqual(signal.rsrq, "-11")
        self.assertEqual(signal.sinr, "18")
        self.assertEqual(signal.band, "B3")
        self.assertEqual(signal.channel, "1300")
        self.assertEqual(signal.bandwidth, "20")
        self.assertEqual(signal.mode, "LTE")
        self.assertEqual(signal.cell_id, "12345")
        self.assertEqual(signal.pci, "123")

    def test_partial_response_uses_dash_default(self):
        xml = "<response><rsrp>-88</rsrp></response>"
        signal = self._parse_xml_response(xml)
        self.assertEqual(signal.rsrp, "-88")
        self.assertEqual(signal.rssi, "—")
        self.assertEqual(signal.band, "—")


if __name__ == "__main__":
    unittest.main()
