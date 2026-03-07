# Modem Manager GUI

A lightweight standalone desktop application for managing a wireless modem or
LTE/5G router via its HTTP API.  Built with Python 3.10+ and PySide6.

---

## Features

- Connect to any router that exposes an XML-over-HTTP REST API (e.g. Huawei
  HiLink series, Brovi, Alcatel, ZTE, and most unlocked USB dongles).
- Log in to obtain a Session ID (SID) and persist it locally for future runs.
- View real-time device status (connection state, signal, IP address, etc.).
- Send raw AT commands and inspect responses — useful for diagnostics and
  validating that your SID is still active (send `AT`, expect `OK`).

---

## Project Structure

```
modem_gui/
├── main.py            # Entry point — run this to launch the app
├── main_window.py     # PySide6 main window and UI logic
├── router_client.py   # HTTP API client (login, status, AT commands)
├── sid_store.py       # Persistent SID storage (~/.modem_gui/sid.json)
├── requirements.txt   # Python dependencies
└── tests/
    ├── test_router_client.py
    └── test_sid_store.py
```

---

## Prerequisites

| Requirement | Minimum version |
|---|---|
| Python | 3.10 |
| pip | 23.x |

---

## Setup

### 1. Create and activate a virtual environment

**Windows (PowerShell)**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the application

```bash
python main.py
```

---

## Usage

1. **Enter Host** — type the router's IP address (usually `192.168.8.1`).
2. **Login** — click *Login…* and enter the router admin username and password.
   The SID is saved automatically for future sessions.
3. **Apply SID** — if you already have a SID, paste it in the *SID* field and
   click *Apply SID* (useful when you share a SID from another tool).
4. **Refresh Status** — click *Refresh Status* to populate the device status
   table.
5. **AT Commands** — type a command (e.g. `AT`, `AT+CSQ`, `ATI`) in the
   *AT Command* field and click *Send* (or press Enter).  A response of `OK`
   for the bare `AT` command confirms the SID is valid.

---

## Running Tests

Tests do **not** require PySide6 or a real router — they mock all HTTP calls.

```bash
# from the modem_gui/ directory
python -m pytest tests/ -v
```

---

## Packaging for Windows

### Option A — PyInstaller (single-file `.exe`)

```powershell
pip install pyinstaller
pyinstaller --onefile --windowed --name ModemManager main.py
```

The executable will appear in `dist\ModemManager.exe`.

> **Tip:** Add `--icon your_icon.ico` to set a custom window icon.

### Option B — cx_Freeze (MSI installer)

```powershell
pip install cx_Freeze
```

Create `setup_cx.py`:

```python
from cx_Freeze import setup, Executable

setup(
    name="ModemManager",
    version="0.1.0",
    executables=[Executable("main.py", base="Win32GUI", target_name="ModemManager.exe")],
)
```

```powershell
python setup_cx.py bdist_msi
```

The installer will appear in the `dist\` folder.

---

## Configuration & Data Storage

The SID and last-used host are stored in:

| Platform | Path |
|---|---|
| Windows | `%USERPROFILE%\.modem_gui\sid.json` |
| macOS / Linux | `~/.modem_gui/sid.json` |

The file is created automatically on first save.  On POSIX systems the file
permissions are set to `0600` (owner read/write only).  The file contains
**only the SID**, not your password.

To reset the stored session, delete the file or call *Login…* to obtain a new
SID.

---

## Troubleshooting

### "Not authorised" / API error 125003

Your SID has expired.  Click *Login…* to obtain a fresh one.

### No response from router

- Confirm the IP address is correct (try opening `http://192.168.8.1` in a
  browser).
- Ensure the application and router are on the same network.
- Check that the router's HTTP API is enabled in its settings.

### AT command returns empty string

Some routers restrict AT command access by firmware version.  Try `AT+CSQ` or
`ATI` as alternatives to verify connectivity.

---

## Git Clone Authentication Troubleshooting

If you receive authentication errors when cloning this repository (`git clone`
hangs or returns `403 Forbidden` / `remote: Repository not found`), use one of
the two recommended methods below.

### Option 1 — Personal Access Token (PAT) via HTTPS

1. Go to **GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens** (or classic tokens).
2. Create a token with at least **repo → Contents: Read** scope.
3. Clone using your PAT in place of the password:

```bash
git clone https://<your-username>:<YOUR_PAT>@github.com/deilert00/Goald.git
```

Or configure the credential helper once so you are not prompted repeatedly:

```bash
git config --global credential.helper store
git clone https://github.com/deilert00/Goald.git
# Enter your GitHub username and PAT when prompted — they are saved locally.
```

> ⚠️ Store PATs in a password manager, not in plain text files or shell history.

### Option 2 — SSH key

1. Generate an SSH key pair (skip if you already have one):

```bash
ssh-keygen -t ed25519 -C "your@email.com"
```

2. Add the public key to GitHub: **Settings → SSH and GPG keys → New SSH key**
   (paste the contents of `~/.ssh/id_ed25519.pub`).

3. Clone via SSH:

```bash
git clone git@github.com:deilert00/Goald.git
```

4. Test your connection:

```bash
ssh -T git@github.com
# Expected: Hi <username>! You've successfully authenticated…
```

SSH is the recommended method for developer workstations because it avoids
token rotation and works seamlessly with `git push`.
