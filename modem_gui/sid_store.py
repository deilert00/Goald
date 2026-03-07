"""sid_store.py — Persistent storage for the router Session ID (SID).

The SID is saved to a small JSON file in the user's home directory so that
it survives application restarts.  The store deliberately contains only the
SID (not the password) to minimise the risk of credential exposure.

Typical usage::

    store = SIDStore()
    store.save("abc123def456")
    print(store.load())   # "abc123def456"
    store.clear()
    print(store.load())   # None
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Default storage location: ~/.modem_gui/sid.json
_DEFAULT_STORE_DIR = Path.home() / ".modem_gui"
_DEFAULT_STORE_FILE = _DEFAULT_STORE_DIR / "sid.json"

_KEY_SID = "sid"
_KEY_HOST = "host"


class SIDStore:
    """Read/write the session ID and last-used host to a local JSON file.

    Args:
        path: Override the default storage path (useful for testing).
    """

    def __init__(self, path: Optional[Path] = None) -> None:
        self._path = path or _DEFAULT_STORE_FILE

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save(self, sid: str, host: str = "") -> None:
        """Persist *sid* (and optionally *host*) to disk.

        Creates parent directories if they do not exist.

        Args:
            sid: The session ID string returned by the router.
            host: Router hostname/IP to remember alongside the SID.
        """
        self._path.parent.mkdir(parents=True, exist_ok=True)
        data: dict[str, str] = {_KEY_SID: sid}
        if host:
            data[_KEY_HOST] = host
        try:
            self._path.write_text(json.dumps(data), encoding="utf-8")
            # Restrict file permissions on POSIX systems (owner read/write only)
            if os.name == "posix":
                os.chmod(self._path, 0o600)
        except OSError as exc:
            logger.warning("Could not write SID store at %s: %s", self._path, exc)

    def load(self) -> Optional[str]:
        """Return the stored SID, or *None* if nothing is saved."""
        data = self._read()
        return data.get(_KEY_SID) or None  # treat empty-string SID as absent

    def load_host(self) -> Optional[str]:
        """Return the stored host, or *None* if nothing is saved."""
        data = self._read()
        return data.get(_KEY_HOST) or None  # treat empty-string host as absent

    def clear(self) -> None:
        """Delete the stored SID and host."""
        try:
            self._path.unlink(missing_ok=True)
        except OSError as exc:
            logger.warning("Could not clear SID store at %s: %s", self._path, exc)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _read(self) -> dict[str, str]:
        try:
            text = self._path.read_text(encoding="utf-8")
            data = json.loads(text)
            if isinstance(data, dict):
                return {str(k): str(v) for k, v in data.items()}
        except FileNotFoundError:
            pass
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("Could not read SID store at %s: %s", self._path, exc)
        return {}
