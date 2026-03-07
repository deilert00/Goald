# Modem RF Parameter Manager — Desktop Application

A standalone, Windows-friendly desktop GUI for monitoring and managing wireless
modem RF parameters via HTTP.

---

## Requirements

| Requirement | Version |
|---|---|
| Python | 3.8 or later |
| tkinter | Included with Python (no extra install) |
| Operating System | Windows 10/11, macOS, Linux |

No third-party packages are required — the application uses only Python's
standard library (`tkinter`, `urllib`, `xml.etree.ElementTree`, `json`,
`threading`, `queue`).

---

## Quick Start

```bash
# Clone the repo (if you haven't already)
git clone https://github.com/deilert00/Goald.git
cd Goald/desktop

# Run the application
python modem_manager.py
```

On Windows you can also double-click `modem_manager.py` if Python is
associated with `.py` files, or run it from PowerShell:

```powershell
python .\modem_manager.py
```

---

## Supported API Types

### Huawei HiLink (default)

Most Huawei USB modems (E3372, E3531, …) and home routers (B525, B535, …)
expose the HiLink REST API. The application sends `GET` requests to:

| Data | Endpoint |
|---|---|
| Signal quality | `/api/device/signal` |
| Device info | `/api/device/information` |
| Band lock | `/api/net/net-mode` (POST) |

**Default modem URL:** `http://192.168.8.1`

### Generic JSON

If your modem or gateway exposes an HTTP endpoint that returns a JSON object
with signal fields, select **Generic JSON** from the API drop-down and set the
URL to your modem's base address. The application will fetch
`<base-url>/signal` and attempt to map common field names automatically.

Supported field name variants:

| Parameter | Recognised keys |
|---|---|
| RSSI | `rssi`, `RSSI`, `signal_strength` |
| RSRP | `rsrp`, `RSRP` |
| RSRQ | `rsrq`, `RSRQ` |
| SINR | `sinr`, `SINR`, `snr`, `SNR` |
| Band | `band`, `Band`, `lte_band`, `cell_band` |
| Channel | `earfcn`, `EARFCN`, `channel`, `arfcn` |

---

## Features

| Feature | Description |
|---|---|
| **Live signal monitoring** | Polls the modem at a configurable interval (2 s – 60 s) |
| **Signal quality colouring** | RSRP and SINR values are colour-coded (Excellent / Good / Fair / Poor) |
| **Band & Frequency view** | Shows active band, EARFCN, bandwidth, Cell ID and PCI |
| **Band locking** | Apply an LTE band lock by entering comma-separated band numbers (HiLink only) |
| **History table** | Keeps a scrollable log of all readings during the session |
| **JSON export** | Export the full history to a JSON file |
| **Raw response view** | Shows the last parsed response in JSON format with copy-to-clipboard |
| **Windows DPI awareness** | Calls `SetProcessDpiAwareness(1)` on Windows for crisp rendering |

---

## Signal Quality Reference

### RSRP thresholds

| Range (dBm) | Quality |
|---|---|
| ≥ −80 | Excellent |
| −80 to −90 | Good |
| −90 to −100 | Fair |
| −100 to −110 | Poor |
| < −110 | Very Poor |

### SINR thresholds

| Range (dB) | Quality |
|---|---|
| ≥ 20 | Excellent |
| 13 to 20 | Good |
| 0 to 13 | Fair |
| −3 to 0 | Poor |
| < −3 | Very Poor |

---

## Running the Tests

```bash
cd desktop
python -m unittest tests/test_modem_manager.py -v
```

---

## Extending the Application

To add support for a new modem API:

1. Create a `fetch_<vendor>_signal(base_url: str) -> RFSignal` function in
   `modem_utils.py` following the existing pattern (e.g. `fetch_hilink_signal`).
2. Add a new entry to the `API_MODES` list in `modem_manager.py`.
3. Handle the new mode in `ModemManagerApp._make_fetch_fn()` in `modem_manager.py`.

---

## Packaging as a Windows Executable (optional)

```bash
pip install pyinstaller
pyinstaller --onefile --windowed modem_manager.py
# Output: dist/modem_manager.exe
```

The resulting `modem_manager.exe` is fully self-contained and requires no
Python installation on the target machine.
