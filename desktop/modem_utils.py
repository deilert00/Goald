"""
modem_utils.py — Pure-function utilities for Modem RF Parameter Manager.

Contains all logic that does NOT depend on tkinter:
  - Data models (RFSignal, DeviceInfo)
  - HTTP helpers (_http_get, _http_post)
  - Huawei HiLink API adapter
  - Generic JSON API adapter
  - Signal quality interpretation helpers
  - Background polling thread
"""

import json
import queue
import threading
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Version
# ---------------------------------------------------------------------------
APP_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


@dataclass
class RFSignal:
    """Snapshot of current modem RF signal parameters."""

    rssi: Optional[str] = None  # Received Signal Strength Indicator (dBm)
    rsrp: Optional[str] = None  # Reference Signal Received Power (dBm)
    rsrq: Optional[str] = None  # Reference Signal Received Quality (dB)
    sinr: Optional[str] = None  # Signal-to-Interference-plus-Noise Ratio (dB)
    band: Optional[str] = None  # Active LTE / NR band (e.g. "B3")
    channel: Optional[str] = None  # EARFCN / ARFCN
    bandwidth: Optional[str] = None  # Channel bandwidth (MHz)
    mode: Optional[str] = None  # Connection mode (LTE, NR, WCDMA…)
    cell_id: Optional[str] = None  # Cell identifier
    pci: Optional[str] = None  # Physical Cell ID
    timestamp: Optional[str] = None  # ISO-8601 timestamp of the reading

    def as_dict(self) -> Dict[str, Optional[str]]:
        return {
            "rssi": self.rssi,
            "rsrp": self.rsrp,
            "rsrq": self.rsrq,
            "sinr": self.sinr,
            "band": self.band,
            "channel": self.channel,
            "bandwidth": self.bandwidth,
            "mode": self.mode,
            "cell_id": self.cell_id,
            "pci": self.pci,
            "timestamp": self.timestamp,
        }


@dataclass
class DeviceInfo:
    """Static device information returned by the modem."""

    device_name: Optional[str] = None
    hardware_version: Optional[str] = None
    software_version: Optional[str] = None
    imei: Optional[str] = None
    imsi: Optional[str] = None
    iccid: Optional[str] = None
    msisdn: Optional[str] = None
    wan_ip: Optional[str] = None


# ---------------------------------------------------------------------------
# API client helpers
# ---------------------------------------------------------------------------

REQUEST_TIMEOUT = 8  # seconds


def _http_get(url: str, timeout: int = REQUEST_TIMEOUT) -> Tuple[int, str]:
    """
    Perform an HTTP GET and return (status_code, body_text).
    Raises urllib.error.URLError / urllib.error.HTTPError on failure.
    """
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json, application/xml, text/xml, */*",
            "User-Agent": f"ModemRFManager/{APP_VERSION}",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
        return response.status, body


def _http_post(
    url: str,
    data: Any,
    timeout: int = REQUEST_TIMEOUT,
    content_type: str = "application/json",
) -> Tuple[int, str]:
    """
    Perform an HTTP POST with a JSON (or XML) body.
    Returns (status_code, body_text).
    """
    if content_type == "application/json":
        raw = json.dumps(data).encode("utf-8")
    else:
        raw = data.encode("utf-8") if isinstance(data, str) else str(data).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=raw,
        headers={
            "Content-Type": content_type,
            "Accept": "application/json, application/xml, */*",
            "User-Agent": f"ModemRFManager/{APP_VERSION}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        body = response.read().decode("utf-8", errors="replace")
        return response.status, body


# ---------------------------------------------------------------------------
# Huawei HiLink API adapter
# ---------------------------------------------------------------------------

HILINK_PATHS = {
    "device_info": "/api/device/information",
    "signal": "/api/device/signal",
    "status": "/api/monitoring/status",
    "token": "/api/webserver/SesTokInfo",
}


def _xml_text(element: Optional[ET.Element], tag: str, default: str = "—") -> str:
    """Return text of *tag* child, or *default* if absent/empty."""
    if element is None:
        return default
    child = element.find(tag)
    return child.text.strip() if child is not None and child.text else default


def fetch_hilink_signal(base_url: str) -> RFSignal:
    """
    Fetch signal parameters from a Huawei HiLink modem at *base_url*.

    Example:  fetch_hilink_signal("http://192.168.8.1")
    """
    import datetime

    url = base_url.rstrip("/") + HILINK_PATHS["signal"]
    _status, body = _http_get(url)
    root = ET.fromstring(body)

    return RFSignal(
        rssi=_xml_text(root, "rssi"),
        rsrp=_xml_text(root, "rsrp"),
        rsrq=_xml_text(root, "rsrq"),
        sinr=_xml_text(root, "sinr"),
        band=_xml_text(root, "band"),
        channel=_xml_text(root, "earfcn"),
        bandwidth=_xml_text(root, "bandwidth"),
        mode=_xml_text(root, "mode"),
        cell_id=_xml_text(root, "cell_id"),
        pci=_xml_text(root, "pci"),
        timestamp=datetime.datetime.now().isoformat(timespec="seconds"),
    )


def fetch_hilink_device_info(base_url: str) -> DeviceInfo:
    """Fetch static device information from a Huawei HiLink modem."""
    url = base_url.rstrip("/") + HILINK_PATHS["device_info"]
    _status, body = _http_get(url)
    root = ET.fromstring(body)
    return DeviceInfo(
        device_name=_xml_text(root, "DeviceName"),
        hardware_version=_xml_text(root, "HardwareVersion"),
        software_version=_xml_text(root, "SoftwareVersion"),
        imei=_xml_text(root, "Imei"),
        imsi=_xml_text(root, "Imsi"),
        iccid=_xml_text(root, "Iccid"),
        msisdn=_xml_text(root, "Msisdn"),
        wan_ip=_xml_text(root, "WanIPAddress"),
    )


def set_hilink_band_lock(base_url: str, bands: List[str]) -> bool:
    """
    Request a band lock on a HiLink modem.

    *bands* is a list of band numbers as strings, e.g. ["3", "7", "20"].
    Returns True on success, False if no valid bands were provided.
    """
    bitmask = _bands_to_bitmask(bands)
    if bitmask == 0:
        return False

    bitmask_hex = format(bitmask, "016X")
    xml_body = (
        "<?xml version='1.0' encoding='UTF-8'?>"
        "<request>"
        "<NetworkMode>03</NetworkMode>"
        f"<LTEBandList>{bitmask_hex}</LTEBandList>"
        "<LTEBandWidth>0</LTEBandWidth>"
        "</request>"
    )
    url = base_url.rstrip("/") + "/api/net/net-mode"
    _http_post(url, xml_body, content_type="application/xml")
    return True


def _bands_to_bitmask(bands: List[str]) -> int:
    """
    Convert a list of band number strings to an LTE band bitmask.

    Band n maps to bit (n-1).  Valid range: 1–64.
    """
    bitmask = 0
    for b in bands:
        try:
            n = int(b)
            if 1 <= n <= 64:
                bitmask |= 1 << (n - 1)
        except ValueError:
            pass
    return bitmask


# ---------------------------------------------------------------------------
# Generic JSON API adapter
# ---------------------------------------------------------------------------

JSON_SIGNAL_FIELD_MAP: Dict[str, List[str]] = {
    "rssi": ["rssi", "RSSI", "signal_strength"],
    "rsrp": ["rsrp", "RSRP"],
    "rsrq": ["rsrq", "RSRQ"],
    "sinr": ["sinr", "SINR", "snr", "SNR"],
    "band": ["band", "Band", "lte_band", "cell_band"],
    "channel": ["earfcn", "EARFCN", "channel", "arfcn"],
    "bandwidth": ["bandwidth", "Bandwidth", "bw"],
    "mode": ["mode", "Mode", "network_type", "rat"],
    "cell_id": ["cell_id", "CellId", "cellId", "enodeb_id"],
    "pci": ["pci", "PCI", "physical_cell_id"],
}


def _find_json_field(data: Dict[str, Any], candidates: List[str]) -> Optional[str]:
    """Return the value of the first matching key in *data*, as a string."""
    for key in candidates:
        if key in data:
            val = data[key]
            return str(val) if val is not None else None
    return None


def fetch_json_signal(endpoint_url: str) -> RFSignal:
    """
    Fetch signal parameters from a generic JSON REST endpoint.
    Field names are matched using common variations.
    """
    import datetime

    _status, body = _http_get(endpoint_url)
    data: Dict[str, Any] = json.loads(body)

    # Allow top-level wrapper objects (e.g. {"signal": {...}})
    for key in ("signal", "data", "result", "response"):
        if key in data and isinstance(data[key], dict):
            data = data[key]
            break

    return RFSignal(
        rssi=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["rssi"]),
        rsrp=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["rsrp"]),
        rsrq=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["rsrq"]),
        sinr=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["sinr"]),
        band=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["band"]),
        channel=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["channel"]),
        bandwidth=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["bandwidth"]),
        mode=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["mode"]),
        cell_id=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["cell_id"]),
        pci=_find_json_field(data, JSON_SIGNAL_FIELD_MAP["pci"]),
        timestamp=datetime.datetime.now().isoformat(timespec="seconds"),
    )


# ---------------------------------------------------------------------------
# Signal quality interpretation helpers
# ---------------------------------------------------------------------------

RSRP_LEVELS = [
    (-80, "Excellent", "#27ae60"),
    (-90, "Good", "#2ecc71"),
    (-100, "Fair", "#f39c12"),
    (-110, "Poor", "#e67e22"),
    (None, "Very Poor", "#e74c3c"),
]

SINR_LEVELS = [
    (20, "Excellent", "#27ae60"),
    (13, "Good", "#2ecc71"),
    (0, "Fair", "#f39c12"),
    (-3, "Poor", "#e67e22"),
    (None, "Very Poor", "#e74c3c"),
]


def quality_label(value_str: Optional[str], levels: list) -> Tuple[str, str]:
    """
    Return (quality_text, colour_hex) for a dBm/dB value string.
    *levels* is a list of (threshold, label, colour) tuples, descending.
    """
    if not value_str or value_str == "—":
        return "N/A", "#95a5a6"
    try:
        val = float(value_str.replace("dBm", "").replace("dB", "").strip())
    except ValueError:
        return "N/A", "#95a5a6"

    for threshold, label, colour in levels:
        if threshold is None or val >= threshold:
            return label, colour
    return "N/A", "#95a5a6"


# ---------------------------------------------------------------------------
# Background polling thread
# ---------------------------------------------------------------------------


class PollingThread(threading.Thread):
    """
    Background thread that fetches RF parameters at a fixed interval and
    puts results (or errors) on a thread-safe queue.
    """

    def __init__(
        self,
        result_queue: "queue.Queue[Tuple[str, Any]]",
        fetch_fn: Any,
        interval_s: float = 5.0,
    ) -> None:
        super().__init__(daemon=True)
        self._queue = result_queue
        self._fetch = fetch_fn
        self._interval = interval_s
        self._stop_event = threading.Event()

    def run(self) -> None:
        while not self._stop_event.is_set():
            try:
                result = self._fetch()
                self._queue.put(("ok", result))
            except (OSError, ValueError) as exc:
                self._queue.put(("error", str(exc)))
            self._stop_event.wait(self._interval)

    def stop(self) -> None:
        self._stop_event.set()
