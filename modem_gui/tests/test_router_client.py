"""tests/test_router_client.py — Unit tests for RouterClient and helpers.

Run with::

    cd modem_gui
    python -m pytest tests/ -v
"""

from __future__ import annotations

import sys
import os
import unittest
from unittest.mock import MagicMock, patch
import xml.etree.ElementTree as ET

# Ensure the modem_gui package is importable when running from repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from router_client import RouterAPIError, RouterClient, _xml_escape


class TestXmlEscape(unittest.TestCase):
    def test_plain_string_unchanged(self) -> None:
        self.assertEqual(_xml_escape("hello"), "hello")

    def test_ampersand(self) -> None:
        self.assertEqual(_xml_escape("a&b"), "a&amp;b")

    def test_lt_gt(self) -> None:
        self.assertEqual(_xml_escape("<tag>"), "&lt;tag&gt;")

    def test_quotes(self) -> None:
        self.assertEqual(_xml_escape('"it\'s"'), "&quot;it&apos;s&quot;")

    def test_combined(self) -> None:
        self.assertEqual(_xml_escape('<a b="c&d">'), "&lt;a b=&quot;c&amp;d&quot;&gt;")


class TestRouterAPIError(unittest.TestCase):
    def test_message_format_with_detail(self) -> None:
        err = RouterAPIError("125001", "Wrong password")
        self.assertIn("125001", str(err))
        self.assertIn("Wrong password", str(err))

    def test_message_format_without_detail(self) -> None:
        err = RouterAPIError("999")
        self.assertIn("999", str(err))


class TestRouterClientProperties(unittest.TestCase):
    def setUp(self) -> None:
        self.client = RouterClient("192.168.8.1")

    def test_base_url(self) -> None:
        self.assertEqual(self.client.base_url, "http://192.168.8.1/api")

    def test_base_url_strips_trailing_slash(self) -> None:
        client = RouterClient("192.168.8.1/")
        self.assertEqual(client.base_url, "http://192.168.8.1/api")

    def test_sid_initially_none(self) -> None:
        self.assertIsNone(self.client.sid)

    def test_set_sid_updates_header(self) -> None:
        self.client.sid = "abc123"
        self.assertIn("abc123", self.client._session.headers.get("Cookie", ""))

    def test_clear_sid_removes_header(self) -> None:
        self.client.sid = "abc123"
        self.client.sid = None
        self.assertNotIn("Cookie", self.client._session.headers)


class TestParseResponse(unittest.TestCase):
    def test_parses_valid_xml(self) -> None:
        xml = "<response><Status>902</Status></response>"
        root = RouterClient._parse_response(xml)
        self.assertEqual(root.tag, "response")
        self.assertEqual(root.findtext("Status"), "902")

    def test_raises_on_error_root(self) -> None:
        xml = "<error><code>125003</code><message>Too many attempts</message></error>"
        with self.assertRaises(RouterAPIError) as ctx:
            RouterClient._parse_response(xml)
        self.assertEqual(ctx.exception.code, "125003")
        self.assertIn("Too many attempts", str(ctx.exception))

    def test_raises_on_invalid_xml(self) -> None:
        with self.assertRaises(RouterAPIError) as ctx:
            RouterClient._parse_response("not xml at all")
        self.assertEqual(ctx.exception.code, "parse-error")

    def test_error_without_message(self) -> None:
        xml = "<error><code>999</code></error>"
        with self.assertRaises(RouterAPIError) as ctx:
            RouterClient._parse_response(xml)
        self.assertEqual(ctx.exception.code, "999")


class TestLoginLogout(unittest.TestCase):
    def setUp(self) -> None:
        self.client = RouterClient("192.168.8.1")

    def _mock_post_response(self, xml_text: str) -> MagicMock:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = xml_text
        mock_resp.raise_for_status = MagicMock()
        return mock_resp

    def test_login_stores_sid(self) -> None:
        xml = "<response><SesInfo>sid_value_xyz</SesInfo></response>"
        self.client._session.post = MagicMock(return_value=self._mock_post_response(xml))
        result = self.client.login("admin", "pass")
        self.assertEqual(result, "sid_value_xyz")
        self.assertEqual(self.client.sid, "sid_value_xyz")

    def test_login_raises_on_missing_sid(self) -> None:
        xml = "<response><State>1</State></response>"
        self.client._session.post = MagicMock(return_value=self._mock_post_response(xml))
        with self.assertRaises(RouterAPIError):
            self.client.login("admin", "wrong")

    def test_logout_clears_sid(self) -> None:
        self.client.sid = "some_sid"
        xml = "<response><State>1</State></response>"
        self.client._session.post = MagicMock(return_value=self._mock_post_response(xml))
        self.client.logout()
        self.assertIsNone(self.client.sid)

    def test_logout_is_safe_when_not_logged_in(self) -> None:
        import requests as req_mod
        self.client._session.post = MagicMock(side_effect=req_mod.exceptions.ConnectionError("network error"))
        self.client.logout()  # must not raise
        self.assertIsNone(self.client.sid)


class TestGetStatus(unittest.TestCase):
    def setUp(self) -> None:
        self.client = RouterClient("192.168.8.1")
        self.client.sid = "test_sid"

    def test_returns_dict(self) -> None:
        xml = (
            "<response>"
            "<ConnectionStatus>901</ConnectionStatus>"
            "<WanIPAddress>10.0.0.1</WanIPAddress>"
            "</response>"
        )
        mock_resp = MagicMock()
        mock_resp.text = xml
        mock_resp.raise_for_status = MagicMock()
        self.client._session.get = MagicMock(return_value=mock_resp)

        status = self.client.get_status()
        self.assertEqual(status["ConnectionStatus"], "901")
        self.assertEqual(status["WanIPAddress"], "10.0.0.1")


class TestSendAtCommand(unittest.TestCase):
    def setUp(self) -> None:
        self.client = RouterClient("192.168.8.1")
        self.client.sid = "test_sid"

    def _mock_post(self, at_response: str) -> MagicMock:
        xml = f"<response><AT>{at_response}</AT></response>"
        mock_resp = MagicMock()
        mock_resp.text = xml
        mock_resp.raise_for_status = MagicMock()
        return mock_resp

    def test_at_returns_ok(self) -> None:
        self.client._session.post = MagicMock(return_value=self._mock_post("\r\nOK\r\n"))
        result = self.client.send_at_command("AT")
        self.assertEqual(result, "OK")

    def test_at_command_with_response(self) -> None:
        self.client._session.post = MagicMock(return_value=self._mock_post("+CSQ: 18,0\r\nOK\r\n"))
        result = self.client.send_at_command("AT+CSQ")
        self.assertIn("CSQ", result)
        self.assertIn("OK", result)

    def test_at_raises_on_api_error(self) -> None:
        error_xml = "<error><code>125002</code><message>Not authorized</message></error>"
        mock_resp = MagicMock()
        mock_resp.text = error_xml
        mock_resp.raise_for_status = MagicMock()
        self.client._session.post = MagicMock(return_value=mock_resp)
        with self.assertRaises(RouterAPIError):
            self.client.send_at_command("AT")


if __name__ == "__main__":
    unittest.main()
