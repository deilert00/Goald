"""main_window.py — PySide6 main window for the modem management GUI.

Layout
------
┌─────────────────────────────────────────────────────┐
│  Connection ─────────────────────────────────────── │
│  Host: [192.168.8.1 ___] SID: [____________] [Login]│
│                                                     │
│  Status ──────────────────────────────────────────  │
│  [Refresh]                                          │
│  ┌──────────────────────────────────────────────┐  │
│  │  (status key/value table)                    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  AT Command ──────────────────────────────────────  │
│  Command: [AT__________________________] [Send]     │
│  ┌──────────────────────────────────────────────┐  │
│  │  (response / error output)                   │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
"""

from __future__ import annotations

import logging
from typing import Callable, Optional

from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtWidgets import (
    QApplication,
    QDialog,
    QFormLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMessageBox,
    QPushButton,
    QTableWidget,
    QTableWidgetItem,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from router_client import RouterAPIError, RouterClient
from sid_store import SIDStore
import requests

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Background workers (keeps the GUI responsive during HTTP calls)
# ---------------------------------------------------------------------------


class _Worker(QThread):
    """Generic one-shot worker thread.

    Runs *task* in a background thread and emits either ``result`` or
    ``error`` when done.
    """

    result: Signal = Signal(object)
    error: Signal = Signal(str)

    def __init__(self, task: Callable[[], object]) -> None:
        super().__init__()
        self._task = task

    def run(self) -> None:
        try:
            self.result.emit(self._task())
        except (RouterAPIError, requests.RequestException, OSError) as exc:
            self.error.emit(str(exc))
        except Exception as exc:  # noqa: BLE001 — surface unexpected errors to UI, never swallow
            self.error.emit(f"Unexpected error: {exc}")


# ---------------------------------------------------------------------------
# Main window
# ---------------------------------------------------------------------------


class MainWindow(QMainWindow):
    """Primary application window."""

    _WINDOW_TITLE = "Modem Manager"
    _MIN_WIDTH = 640
    _MIN_HEIGHT = 520

    def __init__(self) -> None:
        super().__init__()
        self._client: Optional[RouterClient] = None
        self._sid_store = SIDStore()
        self._workers: list[_Worker] = []  # keep references alive

        self.setWindowTitle(self._WINDOW_TITLE)
        self.setMinimumSize(self._MIN_WIDTH, self._MIN_HEIGHT)

        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        layout.addWidget(self._build_connection_group())
        layout.addWidget(self._build_status_group())
        layout.addWidget(self._build_at_group())

        self._restore_saved_state()

    # ------------------------------------------------------------------
    # UI construction helpers
    # ------------------------------------------------------------------

    def _build_connection_group(self) -> QGroupBox:
        box = QGroupBox("Connection")
        form = QFormLayout(box)

        self._host_edit = QLineEdit()
        self._host_edit.setPlaceholderText("192.168.8.1")
        self._host_edit.setToolTip("Router IP address or hostname")
        form.addRow("Host:", self._host_edit)

        sid_row = QHBoxLayout()
        self._sid_edit = QLineEdit()
        self._sid_edit.setPlaceholderText("Paste existing SID or leave blank")
        self._sid_edit.setEchoMode(QLineEdit.EchoMode.Password)
        self._sid_edit.setToolTip("Session ID (obtained after login)")
        sid_row.addWidget(self._sid_edit)

        self._login_btn = QPushButton("Login…")
        self._login_btn.setToolTip("Open login dialog to obtain a new SID")
        self._login_btn.clicked.connect(self._on_login)
        sid_row.addWidget(self._login_btn)

        self._apply_btn = QPushButton("Apply SID")
        self._apply_btn.setToolTip("Use the SID entered above without re-logging in")
        self._apply_btn.clicked.connect(self._on_apply_sid)
        sid_row.addWidget(self._apply_btn)

        form.addRow("SID:", sid_row)

        self._status_label = QLabel("Not connected")
        self._status_label.setAlignment(Qt.AlignmentFlag.AlignRight)
        form.addRow("", self._status_label)

        return box

    def _build_status_group(self) -> QGroupBox:
        box = QGroupBox("Device Status")
        vbox = QVBoxLayout(box)

        self._refresh_btn = QPushButton("Refresh Status")
        self._refresh_btn.clicked.connect(self._on_refresh_status)
        vbox.addWidget(self._refresh_btn)

        self._status_table = QTableWidget(0, 2)
        self._status_table.setHorizontalHeaderLabels(["Field", "Value"])
        self._status_table.horizontalHeader().setStretchLastSection(True)
        self._status_table.setEditTriggers(QTableWidget.EditTrigger.NoEditTriggers)
        self._status_table.setAlternatingRowColors(True)
        vbox.addWidget(self._status_table)

        return box

    def _build_at_group(self) -> QGroupBox:
        box = QGroupBox("AT Command")
        vbox = QVBoxLayout(box)

        cmd_row = QHBoxLayout()
        self._at_edit = QLineEdit()
        self._at_edit.setPlaceholderText("AT")
        self._at_edit.setToolTip("Enter an AT command (e.g. AT, AT+CSQ)")
        self._at_edit.returnPressed.connect(self._on_send_at)
        cmd_row.addWidget(self._at_edit)

        self._send_btn = QPushButton("Send")
        self._send_btn.clicked.connect(self._on_send_at)
        cmd_row.addWidget(self._send_btn)

        vbox.addLayout(cmd_row)

        self._at_output = QTextEdit()
        self._at_output.setReadOnly(True)
        self._at_output.setPlaceholderText("Response will appear here…")
        self._at_output.setFixedHeight(120)
        vbox.addWidget(self._at_output)

        return box

    # ------------------------------------------------------------------
    # State helpers
    # ------------------------------------------------------------------

    def _restore_saved_state(self) -> None:
        saved_host = self._sid_store.load_host()
        saved_sid = self._sid_store.load()
        if saved_host:
            self._host_edit.setText(saved_host)
        if saved_sid:
            self._sid_edit.setText(saved_sid)
            self._apply_client(self._host_edit.text() or saved_host or "", saved_sid)

    def _apply_client(self, host: str, sid: str) -> None:
        if not host:
            return
        self._client = RouterClient(host)
        self._client.sid = sid
        self._status_label.setText(f"SID set for {host}")
        logger.debug("Client initialised for host=%s", host)

    # ------------------------------------------------------------------
    # Slot handlers
    # ------------------------------------------------------------------

    def _on_login(self) -> None:
        host = self._host_edit.text().strip()
        if not host:
            QMessageBox.warning(self, "Missing Host", "Please enter the router's IP address or hostname.")
            return

        dialog = _LoginDialog(self)
        if dialog.exec() != dialog.DialogCode.Accepted:
            return

        username, password = dialog.credentials()
        client = RouterClient(host)

        def task() -> str:
            return client.login(username, password)

        worker = _Worker(task)
        worker.result.connect(lambda sid: self._on_login_done(client, host, sid))
        worker.error.connect(self._on_error)
        self._workers.append(worker)
        self._set_busy(True)
        worker.start()

    def _on_login_done(self, client: RouterClient, host: str, sid: str) -> None:
        self._set_busy(False)
        self._client = client
        self._sid_edit.setText(sid)
        self._sid_store.save(sid, host)
        self._status_label.setText(f"Logged in to {host}")
        logger.info("Login successful, SID saved")

    def _on_apply_sid(self) -> None:
        host = self._host_edit.text().strip()
        sid = self._sid_edit.text().strip()
        if not host:
            QMessageBox.warning(self, "Missing Host", "Please enter the router's IP address or hostname.")
            return
        if not sid:
            QMessageBox.warning(self, "Missing SID", "Please enter a Session ID.")
            return
        self._apply_client(host, sid)
        self._sid_store.save(sid, host)

    def _on_refresh_status(self) -> None:
        if not self._client:
            QMessageBox.information(self, "Not Connected", "Set a host and SID first.")
            return

        def task() -> dict[str, str]:
            return self._client.get_status()  # type: ignore[union-attr]

        worker = _Worker(task)
        worker.result.connect(self._populate_status_table)
        worker.error.connect(self._on_error)
        self._workers.append(worker)
        self._set_busy(True)
        worker.start()

    def _populate_status_table(self, data: dict[str, str]) -> None:
        self._set_busy(False)
        self._status_table.setRowCount(0)
        for key, value in data.items():
            row = self._status_table.rowCount()
            self._status_table.insertRow(row)
            self._status_table.setItem(row, 0, QTableWidgetItem(key))
            self._status_table.setItem(row, 1, QTableWidgetItem(value))

    def _on_send_at(self) -> None:
        if not self._client:
            QMessageBox.information(self, "Not Connected", "Set a host and SID first.")
            return

        command = self._at_edit.text().strip() or "AT"

        def task() -> str:
            return self._client.send_at_command(command)  # type: ignore[union-attr]

        worker = _Worker(task)
        worker.result.connect(self._show_at_result)
        worker.error.connect(self._on_at_error)
        self._workers.append(worker)
        self._set_busy(True)
        worker.start()

    def _show_at_result(self, response: str) -> None:
        self._set_busy(False)
        self._at_output.setStyleSheet("")
        self._at_output.setPlainText(response)

    def _on_at_error(self, message: str) -> None:
        self._set_busy(False)
        self._at_output.setStyleSheet("color: red;")
        self._at_output.setPlainText(f"ERROR: {message}")
        logger.error("AT command error: %s", message)

    def _on_error(self, message: str) -> None:
        self._set_busy(False)
        QMessageBox.critical(self, "Error", message)
        self._status_label.setText("Error — check connection")
        logger.error("Router error: %s", message)

    def _set_busy(self, busy: bool) -> None:
        self._login_btn.setEnabled(not busy)
        self._apply_btn.setEnabled(not busy)
        self._refresh_btn.setEnabled(not busy)
        self._send_btn.setEnabled(not busy)
        if busy:
            self._status_label.setText("Working…")


# ---------------------------------------------------------------------------
# Login dialog
# ---------------------------------------------------------------------------


class _LoginDialog(QDialog):
    """Simple username/password dialog."""

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Login to Router")
        self.setModal(True)
        self.setFixedWidth(320)

        form = QFormLayout(self)
        self._user_edit = QLineEdit()
        self._user_edit.setText("admin")
        form.addRow("Username:", self._user_edit)

        self._pass_edit = QLineEdit()
        self._pass_edit.setEchoMode(QLineEdit.EchoMode.Password)
        form.addRow("Password:", self._pass_edit)

        btn_row = QHBoxLayout()
        ok_btn = QPushButton("Login")
        ok_btn.setDefault(True)
        ok_btn.clicked.connect(self.accept)
        cancel_btn = QPushButton("Cancel")
        cancel_btn.clicked.connect(self.reject)
        btn_row.addWidget(ok_btn)
        btn_row.addWidget(cancel_btn)
        form.addRow(btn_row)

    def credentials(self) -> tuple[str, str]:
        return self._user_edit.text(), self._pass_edit.text()
