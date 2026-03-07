"""tests/test_sid_store.py — Unit tests for SIDStore.

Run with::

    cd modem_gui
    python -m pytest tests/ -v
"""

from __future__ import annotations

import sys
import os
import tempfile
import unittest
from pathlib import Path

# Ensure the modem_gui package is importable when running from repo root.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sid_store import SIDStore


class TestSIDStore(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self._store_path = Path(self._tmp.name) / "test_sid.json"
        self.store = SIDStore(path=self._store_path)

    def tearDown(self) -> None:
        self._tmp.cleanup()

    # ------------------------------------------------------------------
    # save / load
    # ------------------------------------------------------------------

    def test_save_and_load_sid(self) -> None:
        self.store.save("abc123")
        self.assertEqual(self.store.load(), "abc123")

    def test_save_and_load_host(self) -> None:
        self.store.save("sid_val", host="192.168.8.1")
        self.assertEqual(self.store.load_host(), "192.168.8.1")

    def test_load_returns_none_when_not_saved(self) -> None:
        self.assertIsNone(self.store.load())

    def test_load_host_returns_none_when_not_saved(self) -> None:
        self.assertIsNone(self.store.load_host())

    def test_save_overwrites_previous(self) -> None:
        self.store.save("first_sid")
        self.store.save("second_sid")
        self.assertEqual(self.store.load(), "second_sid")

    # ------------------------------------------------------------------
    # clear
    # ------------------------------------------------------------------

    def test_clear_removes_sid(self) -> None:
        self.store.save("to_delete")
        self.store.clear()
        self.assertIsNone(self.store.load())

    def test_clear_is_safe_when_nothing_saved(self) -> None:
        self.store.clear()  # must not raise

    # ------------------------------------------------------------------
    # robustness
    # ------------------------------------------------------------------

    def test_load_returns_none_on_corrupt_file(self) -> None:
        self._store_path.parent.mkdir(parents=True, exist_ok=True)
        self._store_path.write_text("not valid json", encoding="utf-8")
        self.assertIsNone(self.store.load())

    def test_load_returns_none_on_wrong_json_type(self) -> None:
        self._store_path.parent.mkdir(parents=True, exist_ok=True)
        self._store_path.write_text("[1, 2, 3]", encoding="utf-8")
        self.assertIsNone(self.store.load())

    def test_save_creates_parent_directories(self) -> None:
        deep_path = Path(self._tmp.name) / "a" / "b" / "c" / "sid.json"
        store = SIDStore(path=deep_path)
        store.save("deep_sid")
        self.assertEqual(store.load(), "deep_sid")

    def test_sid_not_exposed_as_host(self) -> None:
        self.store.save("my_sid", host="router.local")
        # load() must return the SID, not the host
        self.assertEqual(self.store.load(), "my_sid")
        # load_host() must return the host, not the SID
        self.assertEqual(self.store.load_host(), "router.local")


if __name__ == "__main__":
    unittest.main()
