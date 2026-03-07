"""router_client.py — HTTP API client for wireless modem management.

Communicates with the router's REST API at ``http://<host>/api``.
Authentication is handled via a Session-ID (SID) cookie/header that is
obtained by logging in and must be refreshed when it expires.

Typical usage::

    client = RouterClient("192.168.8.1")
    client.login("admin", "password")          # stores SID internally
    print(client.get_status())                 # fetch device status
    print(client.send_at_command("AT"))        # validate SID via AT command
    client.logout()
"""

from __future__ import annotations

import logging
import re
import xml.etree.ElementTree as ET
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# Default timeout for every HTTP request (seconds)
_DEFAULT_TIMEOUT = 10


class RouterAPIError(Exception):
    """Raised when the router API returns an error response."""

    def __init__(self, code: str, message: str = "") -> None:
        self.code = code
        super().__init__(f"Router API error {code}: {message}" if message else f"Router API error {code}")


class RouterClient:
    """Thin HTTP client for a wireless modem's REST API.

    The API is modelled after the common Huawei HiLink interface exposed by
    many LTE/5G dongles and routers, but the class can be adapted to any
    router that uses XML-over-HTTP with SID cookies.

    Args:
        host: IP address or hostname of the router (no scheme, no trailing slash).
        timeout: Request timeout in seconds.
    """

    def __init__(self, host: str, timeout: int = _DEFAULT_TIMEOUT) -> None:
        self.host = host.rstrip("/")
        self.timeout = timeout
        self._session = requests.Session()
        self._sid: Optional[str] = None

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    @property
    def base_url(self) -> str:
        return f"http://{self.host}/api"

    @property
    def sid(self) -> Optional[str]:
        """Current session ID, or *None* if not authenticated."""
        return self._sid

    @sid.setter
    def sid(self, value: Optional[str]) -> None:
        self._sid = value
        if value:
            self._session.headers.update({"Cookie": f"SessionID={value}"})
        else:
            self._session.headers.pop("Cookie", None)

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def login(self, username: str, password: str) -> str:
        """Authenticate with the router and store the returned SID.

        Returns:
            The new SID string.

        Raises:
            RouterAPIError: If the router returns an error code.
            requests.RequestException: On network failure.
        """
        body = (
            "<?xml version='1.0' encoding='UTF-8'?>"
            "<request>"
            f"<Username>{_xml_escape(username)}</Username>"
            f"<Password>{_xml_escape(password)}</Password>"
            "<password_type>4</password_type>"
            "</request>"
        )
        root = self._post("user/login", body)
        sid = root.findtext("SesInfo") or root.findtext("SessionID") or ""
        if not sid:
            raise RouterAPIError("no-sid", "Login succeeded but no SID was returned")
        self.sid = sid
        logger.debug("Login successful, SID=%s…", sid[:8])
        return sid

    def logout(self) -> None:
        """Terminate the current session on the router."""
        try:
            self._post(
                "user/logout",
                "<?xml version='1.0' encoding='UTF-8'?><request><Logout>1</Logout></request>",
            )
        except (RouterAPIError, requests.RequestException):
            pass  # best-effort logout; clear SID regardless of network outcome
        finally:
            self.sid = None
            logger.debug("Logged out")

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    def get_status(self) -> dict[str, str]:
        """Fetch device status summary.

        Returns:
            A dictionary with keys such as ``ConnectionStatus``,
            ``SignalIcon``, ``CurrentNetworkType``, ``WanIPAddress``, etc.
        """
        root = self._get("monitoring/status")
        return {child.tag: (child.text or "") for child in root}

    def get_device_info(self) -> dict[str, str]:
        """Fetch static device information (model, firmware, IMEI, …)."""
        root = self._get("device/information")
        return {child.tag: (child.text or "") for child in root}

    # ------------------------------------------------------------------
    # AT commands
    # ------------------------------------------------------------------

    def send_at_command(self, command: str) -> str:
        """Send a raw AT command to the modem and return the response text.

        The plain ``AT`` command is useful for validating that the SID is
        still valid — a healthy modem returns ``OK``.

        Args:
            command: AT command string, e.g. ``"AT"`` or ``"AT+CSQ"``.

        Returns:
            The modem's response text (e.g. ``"OK"`` or ``"+CSQ: 18,0\\r\\nOK"``).

        Raises:
            RouterAPIError: On API-level errors.
            requests.RequestException: On network failures.
        """
        body = (
            "<?xml version='1.0' encoding='UTF-8'?>"
            "<request>"
            f"<Index>0</Index>"
            f"<AT>{_xml_escape(command)}\r\n</AT>"
            "</request>"
        )
        root = self._post("device/at-execute", body)
        response = root.findtext("AT") or ""
        logger.debug("AT command %r → %r", command, response)
        return response.strip()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get(self, endpoint: str) -> ET.Element:
        url = f"{self.base_url}/{endpoint}"
        resp = self._session.get(url, timeout=self.timeout)
        resp.raise_for_status()
        return self._parse_response(resp.text)

    def _post(self, endpoint: str, body: str) -> ET.Element:
        url = f"{self.base_url}/{endpoint}"
        headers = {"Content-Type": "text/xml; charset=UTF-8"}
        resp = self._session.post(url, data=body.encode("utf-8"), headers=headers, timeout=self.timeout)
        resp.raise_for_status()
        return self._parse_response(resp.text)

    @staticmethod
    def _parse_response(text: str) -> ET.Element:
        """Parse an XML response; raise RouterAPIError for ``<error>`` roots."""
        try:
            root = ET.fromstring(text)
        except ET.ParseError as exc:
            raise RouterAPIError("parse-error", str(exc)) from exc

        if root.tag == "error":
            code = root.findtext("code") or "unknown"
            message = root.findtext("message") or ""
            raise RouterAPIError(code, message)

        return root


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _xml_escape(value: str) -> str:
    """Minimal XML character escaping for values inserted into XML bodies."""
    return (
        value.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;")
             .replace("'", "&apos;")
    )
