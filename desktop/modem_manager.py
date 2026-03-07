#!/usr/bin/env python3
"""
Modem RF Parameter Manager
===========================
A standalone desktop GUI application for monitoring and managing
wireless modem RF parameters via HTTP.

Supports:
  - Huawei HiLink API (most USB and home LTE modems)
  - Generic JSON REST API

Requirements: Python 3.8+ with tkinter (included with Python on Windows)
Usage:        python modem_manager.py
"""

import json
import queue
import threading
import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
from typing import Dict, List, Optional, Tuple

from modem_utils import (
    APP_VERSION,
    DeviceInfo,
    PollingThread,
    RFSignal,
    RSRP_LEVELS,
    SINR_LEVELS,
    fetch_hilink_device_info,
    fetch_hilink_signal,
    fetch_json_signal,
    quality_label,
    set_hilink_band_lock,
)

# ---------------------------------------------------------------------------
# Application constants
# ---------------------------------------------------------------------------

APP_TITLE = f"Modem RF Parameter Manager v{APP_VERSION}"

REFRESH_INTERVALS = {"2 s": 2, "5 s": 5, "10 s": 10, "30 s": 30, "60 s": 60}

API_MODES = ["Huawei HiLink (XML)", "Generic JSON"]


# ---------------------------------------------------------------------------
# Main application window
# ---------------------------------------------------------------------------


class ModemManagerApp(tk.Tk):
    """
    Standalone desktop application for monitoring and managing
    wireless modem RF parameters.
    """

    def __init__(self) -> None:
        super().__init__()
        self.title(APP_TITLE)
        self.minsize(820, 580)
        self.geometry("960x660")

        # Try to enable Windows DPI awareness for crisp rendering
        try:
            from ctypes import windll  # type: ignore[import]
            windll.shcore.SetProcessDpiAwareness(1)
        except (AttributeError, OSError):
            pass

        self._setup_style()
        self._build_ui()

        # State
        self._poll_thread: Optional[PollingThread] = None
        self._result_queue: queue.Queue = queue.Queue()
        self._connected = False
        self._last_signal: Optional[RFSignal] = None
        self._history: List[RFSignal] = []

        # Start the result-processing loop
        self._process_queue()

    # ------------------------------------------------------------------
    # Style
    # ------------------------------------------------------------------

    def _setup_style(self) -> None:
        style = ttk.Style(self)
        # Prefer native-looking themes; 'vista' on Windows, 'clam' elsewhere
        preferred = ["vista", "winnative", "clam", "alt", "default"]
        for theme in preferred:
            if theme in style.theme_names():
                style.theme_use(theme)
                break

        style.configure("Header.TLabel", font=("Segoe UI", 11, "bold"))
        style.configure("Value.TLabel", font=("Consolas", 12))
        style.configure("Good.Value.TLabel", font=("Consolas", 12), foreground="#27ae60")
        style.configure("Fair.Value.TLabel", font=("Consolas", 12), foreground="#f39c12")
        style.configure("Poor.Value.TLabel", font=("Consolas", 12), foreground="#e74c3c")
        style.configure("Status.TLabel", font=("Segoe UI", 9))

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self) -> None:
        self._build_toolbar()
        self._build_notebook()
        self._build_statusbar()

    def _build_toolbar(self) -> None:
        toolbar = ttk.Frame(self, padding=(8, 6))
        toolbar.pack(fill=tk.X, side=tk.TOP)

        ttk.Label(toolbar, text="Modem URL:").pack(side=tk.LEFT, padx=(0, 4))

        self._url_var = tk.StringVar(value="http://192.168.8.1")
        url_entry = ttk.Entry(toolbar, textvariable=self._url_var, width=32)
        url_entry.pack(side=tk.LEFT, padx=(0, 8))
        url_entry.bind("<Return>", lambda _e: self._toggle_connection())

        ttk.Label(toolbar, text="API:").pack(side=tk.LEFT, padx=(0, 4))
        self._api_mode_var = tk.StringVar(value=API_MODES[0])
        api_combo = ttk.Combobox(
            toolbar,
            textvariable=self._api_mode_var,
            values=API_MODES,
            state="readonly",
            width=22,
        )
        api_combo.pack(side=tk.LEFT, padx=(0, 8))

        ttk.Label(toolbar, text="Refresh:").pack(side=tk.LEFT, padx=(0, 4))
        self._refresh_var = tk.StringVar(value="5 s")
        refresh_combo = ttk.Combobox(
            toolbar,
            textvariable=self._refresh_var,
            values=list(REFRESH_INTERVALS.keys()),
            state="readonly",
            width=7,
        )
        refresh_combo.pack(side=tk.LEFT, padx=(0, 12))

        self._connect_btn = ttk.Button(
            toolbar,
            text="Connect",
            command=self._toggle_connection,
            width=12,
        )
        self._connect_btn.pack(side=tk.LEFT, padx=(0, 4))

        self._refresh_now_btn = ttk.Button(
            toolbar,
            text="Refresh Now",
            command=self._refresh_now,
            state=tk.DISABLED,
            width=12,
        )
        self._refresh_now_btn.pack(side=tk.LEFT)

    def _build_notebook(self) -> None:
        self._nb = ttk.Notebook(self)
        self._nb.pack(fill=tk.BOTH, expand=True, padx=8, pady=(4, 0))

        self._tab_overview = ttk.Frame(self._nb, padding=12)
        self._tab_signal = ttk.Frame(self._nb, padding=12)
        self._tab_band = ttk.Frame(self._nb, padding=12)
        self._tab_history = ttk.Frame(self._nb, padding=12)
        self._tab_raw = ttk.Frame(self._nb, padding=12)

        self._nb.add(self._tab_overview, text=" Overview ")
        self._nb.add(self._tab_signal, text=" Signal Quality ")
        self._nb.add(self._tab_band, text=" Band & Frequency ")
        self._nb.add(self._tab_history, text=" History ")
        self._nb.add(self._tab_raw, text=" Raw Response ")

        self._build_overview_tab()
        self._build_signal_tab()
        self._build_band_tab()
        self._build_history_tab()
        self._build_raw_tab()

    def _build_statusbar(self) -> None:
        bar = ttk.Frame(self, relief=tk.SUNKEN)
        bar.pack(fill=tk.X, side=tk.BOTTOM)

        self._status_var = tk.StringVar(value="Not connected.")
        ttk.Label(bar, textvariable=self._status_var, style="Status.TLabel", padding=(8, 3)).pack(
            side=tk.LEFT
        )

        self._ts_var = tk.StringVar(value="")
        ttk.Label(bar, textvariable=self._ts_var, style="Status.TLabel", padding=(8, 3)).pack(
            side=tk.RIGHT
        )

    # ------------------------------------------------------------------
    # Overview tab
    # ------------------------------------------------------------------

    def _build_overview_tab(self) -> None:
        tab = self._tab_overview

        dev_lf = ttk.LabelFrame(tab, text="Device Information", padding=10)
        dev_lf.pack(fill=tk.X, pady=(0, 10))

        self._dev_labels: Dict[str, tk.StringVar] = {}
        dev_fields = [
            ("Device", "device_name"),
            ("Firmware", "software_version"),
            ("IMEI", "imei"),
            ("WAN IP", "wan_ip"),
        ]
        for row_idx, (label_text, field_key) in enumerate(dev_fields):
            ttk.Label(dev_lf, text=label_text + ":", width=12, anchor=tk.E).grid(
                row=row_idx, column=0, sticky=tk.E, padx=(0, 6), pady=2
            )
            var = tk.StringVar(value="—")
            self._dev_labels[field_key] = var
            ttk.Label(dev_lf, textvariable=var, style="Value.TLabel").grid(
                row=row_idx, column=1, sticky=tk.W, pady=2
            )

        sig_lf = ttk.LabelFrame(tab, text="Signal Summary", padding=10)
        sig_lf.pack(fill=tk.X)

        self._summary_vars: Dict[str, Tuple[tk.StringVar, tk.StringVar]] = {}
        summary_fields = [
            ("RSRP", "rsrp"),
            ("SINR", "sinr"),
            ("Band", "band"),
            ("Mode", "mode"),
        ]
        for col_idx, (label_text, key) in enumerate(summary_fields):
            frame = ttk.Frame(sig_lf)
            frame.grid(row=0, column=col_idx, padx=16, pady=4, sticky=tk.N)
            ttk.Label(frame, text=label_text, style="Header.TLabel").pack()
            val_var = tk.StringVar(value="—")
            qual_var = tk.StringVar(value="")
            ttk.Label(frame, textvariable=val_var, font=("Consolas", 20, "bold")).pack()
            ttk.Label(frame, textvariable=qual_var, foreground="#7f8c8d").pack()
            self._summary_vars[key] = (val_var, qual_var)

    # ------------------------------------------------------------------
    # Signal Quality tab
    # ------------------------------------------------------------------

    def _build_signal_tab(self) -> None:
        tab = self._tab_signal
        self._sig_vars: Dict[str, Tuple[tk.StringVar, tk.StringVar]] = {}

        fields = [
            ("RSSI (dBm)", "rssi", "Received Signal Strength — total power including noise"),
            ("RSRP (dBm)", "rsrp", "Reference Signal Received Power — signal quality indicator"),
            ("RSRQ (dB)", "rsrq", "Reference Signal Received Quality — channel quality"),
            ("SINR (dB)", "sinr", "Signal to Interference + Noise Ratio — link quality"),
        ]
        for row, (label_text, key, tooltip) in enumerate(fields):
            ttk.Label(tab, text=label_text, width=14, anchor=tk.E).grid(
                row=row, column=0, sticky=tk.E, padx=(0, 10), pady=8
            )
            val_var = tk.StringVar(value="—")
            qual_var = tk.StringVar(value="")
            val_lbl = ttk.Label(tab, textvariable=val_var, style="Value.TLabel", width=14)
            val_lbl.grid(row=row, column=1, sticky=tk.W, pady=8)
            qual_lbl = ttk.Label(tab, textvariable=qual_var, width=12)
            qual_lbl.grid(row=row, column=2, sticky=tk.W, pady=8)
            ttk.Label(tab, text=tooltip, foreground="#7f8c8d").grid(
                row=row, column=3, sticky=tk.W, padx=16, pady=8
            )
            self._sig_vars[key] = (val_var, qual_var)

    # ------------------------------------------------------------------
    # Band & Frequency tab
    # ------------------------------------------------------------------

    def _build_band_tab(self) -> None:
        tab = self._tab_band

        info_lf = ttk.LabelFrame(tab, text="Current Band & Frequency", padding=10)
        info_lf.pack(fill=tk.X, pady=(0, 12))

        self._band_vars: Dict[str, tk.StringVar] = {}
        band_fields = [
            ("Band", "band"),
            ("Channel (EARFCN)", "channel"),
            ("Bandwidth", "bandwidth"),
            ("Cell ID", "cell_id"),
            ("PCI", "pci"),
        ]
        for row_idx, (label_text, key) in enumerate(band_fields):
            ttk.Label(info_lf, text=label_text + ":", width=18, anchor=tk.E).grid(
                row=row_idx, column=0, sticky=tk.E, padx=(0, 8), pady=3
            )
            var = tk.StringVar(value="—")
            self._band_vars[key] = var
            ttk.Label(info_lf, textvariable=var, style="Value.TLabel").grid(
                row=row_idx, column=1, sticky=tk.W, pady=3
            )

        lock_lf = ttk.LabelFrame(tab, text="Band Lock (Huawei HiLink only)", padding=10)
        lock_lf.pack(fill=tk.X)

        ttk.Label(lock_lf, text="Bands to lock (comma-separated, e.g. 3,7,20):").pack(
            anchor=tk.W
        )
        self._band_lock_var = tk.StringVar()
        band_lock_entry = ttk.Entry(lock_lf, textvariable=self._band_lock_var, width=32)
        band_lock_entry.pack(anchor=tk.W, pady=(4, 8))

        ttk.Button(
            lock_lf,
            text="Apply Band Lock",
            command=self._apply_band_lock,
        ).pack(anchor=tk.W)

        ttk.Label(
            lock_lf,
            text="\u26a0  Applying a band lock will disconnect and reconnect the modem.",
            foreground="#c0392b",
        ).pack(anchor=tk.W, pady=(8, 0))

    # ------------------------------------------------------------------
    # History tab
    # ------------------------------------------------------------------

    def _build_history_tab(self) -> None:
        tab = self._tab_history

        cols = ("timestamp", "rsrp", "sinr", "band", "mode")
        self._hist_tree = ttk.Treeview(tab, columns=cols, show="headings", height=16)
        headings = {
            "timestamp": ("Timestamp", 160),
            "rsrp": ("RSRP (dBm)", 100),
            "sinr": ("SINR (dB)", 100),
            "band": ("Band", 80),
            "mode": ("Mode", 80),
        }
        for col, (heading, width) in headings.items():
            self._hist_tree.heading(col, text=heading)
            self._hist_tree.column(col, width=width, anchor=tk.CENTER)

        scrollbar = ttk.Scrollbar(tab, orient=tk.VERTICAL, command=self._hist_tree.yview)
        self._hist_tree.configure(yscrollcommand=scrollbar.set)
        self._hist_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        btn_frame = ttk.Frame(tab)
        btn_frame.pack(side=tk.BOTTOM, fill=tk.X, pady=(6, 0))
        ttk.Button(btn_frame, text="Clear History", command=self._clear_history).pack(side=tk.LEFT)
        ttk.Button(
            btn_frame, text="Export JSON\u2026", command=self._export_history_json
        ).pack(side=tk.LEFT, padx=6)

    # ------------------------------------------------------------------
    # Raw response tab
    # ------------------------------------------------------------------

    def _build_raw_tab(self) -> None:
        tab = self._tab_raw

        self._raw_text = scrolledtext.ScrolledText(
            tab,
            wrap=tk.NONE,
            font=("Consolas", 9),
            state=tk.DISABLED,
        )
        self._raw_text.pack(fill=tk.BOTH, expand=True)

        ttk.Button(tab, text="Copy to Clipboard", command=self._copy_raw).pack(
            anchor=tk.E, pady=(4, 0)
        )

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    def _toggle_connection(self) -> None:
        if self._connected:
            self._disconnect()
        else:
            self._connect()

    def _make_fetch_fn(self, base_url: str, api_mode: str):  # type: ignore[return]
        """Return a zero-argument callable that fetches signal data from the modem."""
        if api_mode == API_MODES[0]:  # HiLink

            def _fetch_hilink() -> RFSignal:
                return fetch_hilink_signal(base_url)

            return _fetch_hilink
        else:
            endpoint = base_url.rstrip("/") + "/signal"

            def _fetch_json() -> RFSignal:
                return fetch_json_signal(endpoint)

            return _fetch_json

    def _connect(self) -> None:
        base_url = self._url_var.get().strip()
        if not base_url:
            messagebox.showerror("Error", "Please enter a modem URL.")
            return

        if not base_url.startswith(("http://", "https://")):
            base_url = "http://" + base_url
            self._url_var.set(base_url)

        api_mode = self._api_mode_var.get()
        interval = REFRESH_INTERVALS.get(self._refresh_var.get(), 5)
        fetch_fn = self._make_fetch_fn(base_url, api_mode)

        self._fetch_device_info_async(base_url, api_mode)

        self._poll_thread = PollingThread(
            result_queue=self._result_queue,
            fetch_fn=fetch_fn,
            interval_s=interval,
        )
        self._poll_thread.start()
        self._connected = True
        self._connect_btn.configure(text="Disconnect")
        self._refresh_now_btn.configure(state=tk.NORMAL)
        self._status_var.set(f"Connecting to {base_url} \u2026")

    def _disconnect(self) -> None:
        if self._poll_thread:
            self._poll_thread.stop()
            self._poll_thread = None
        self._connected = False
        self._connect_btn.configure(text="Connect")
        self._refresh_now_btn.configure(state=tk.DISABLED)
        self._status_var.set("Disconnected.")
        self._ts_var.set("")

    def _refresh_now(self) -> None:
        """Trigger an immediate fetch outside the scheduled interval."""
        if self._poll_thread is None:
            return
        base_url = self._url_var.get().strip()
        api_mode = self._api_mode_var.get()
        fetch_fn = self._make_fetch_fn(base_url, api_mode)

        def _run() -> None:
            try:
                result = fetch_fn()
                self._result_queue.put(("ok", result))
            except (OSError, ValueError) as exc:
                self._result_queue.put(("error", str(exc)))

        threading.Thread(target=_run, daemon=True).start()

    def _fetch_device_info_async(self, base_url: str, api_mode: str) -> None:
        def _run() -> None:
            try:
                if api_mode == API_MODES[0]:
                    info = fetch_hilink_device_info(base_url)
                    self._result_queue.put(("device_info", info))
            except (OSError, ValueError):
                pass  # Device info is optional — silently ignore on any network/parse error

        threading.Thread(target=_run, daemon=True).start()

    # ------------------------------------------------------------------
    # Result queue processing (called from main thread every 200 ms)
    # ------------------------------------------------------------------

    def _process_queue(self) -> None:
        try:
            while True:
                event, payload = self._result_queue.get_nowait()
                if event == "ok":
                    self._update_signal(payload)
                elif event == "error":
                    self._status_var.set(f"Error: {payload}")
                elif event == "device_info":
                    self._update_device_info(payload)
        except queue.Empty:
            pass
        self.after(200, self._process_queue)

    # ------------------------------------------------------------------
    # UI update helpers
    # ------------------------------------------------------------------

    def _update_signal(self, signal: RFSignal) -> None:
        self._last_signal = signal
        self._history.append(signal)

        self._status_var.set("Connected \u2014 receiving data.")
        self._ts_var.set(f"Last update: {signal.timestamp or '\u2014'}")

        # Overview summary
        for key, (val_var, qual_var) in self._summary_vars.items():
            raw_val = getattr(signal, key, None) or "\u2014"
            val_var.set(raw_val)
            if key == "rsrp":
                label, _colour = quality_label(raw_val, RSRP_LEVELS)
                qual_var.set(label)
            elif key == "sinr":
                label, _colour = quality_label(raw_val, SINR_LEVELS)
                qual_var.set(label)
            else:
                qual_var.set("")

        # Signal quality tab
        for key, (val_var, qual_var) in self._sig_vars.items():
            raw_val = getattr(signal, key, None) or "\u2014"
            val_var.set(raw_val)
            if key == "rsrp":
                label, _ = quality_label(raw_val, RSRP_LEVELS)
                qual_var.set(label)
            elif key == "sinr":
                label, _ = quality_label(raw_val, SINR_LEVELS)
                qual_var.set(label)

        # Band & frequency tab
        for key, var in self._band_vars.items():
            var.set(getattr(signal, key, None) or "\u2014")

        # History tab
        self._hist_tree.insert(
            "",
            tk.END,
            values=(
                signal.timestamp or "",
                signal.rsrp or "\u2014",
                signal.sinr or "\u2014",
                signal.band or "\u2014",
                signal.mode or "\u2014",
            ),
        )
        children = self._hist_tree.get_children()
        if children:
            self._hist_tree.see(children[-1])

        # Raw tab
        raw_content = json.dumps(signal.as_dict(), indent=2)
        self._raw_text.configure(state=tk.NORMAL)
        self._raw_text.delete("1.0", tk.END)
        self._raw_text.insert(tk.END, raw_content)
        self._raw_text.configure(state=tk.DISABLED)

    def _update_device_info(self, info: DeviceInfo) -> None:
        for key, var in self._dev_labels.items():
            var.set(getattr(info, key, None) or "\u2014")

    # ------------------------------------------------------------------
    # Band lock
    # ------------------------------------------------------------------

    def _apply_band_lock(self) -> None:
        raw = self._band_lock_var.get().strip()
        if not raw:
            messagebox.showerror("Band Lock", "Enter at least one band number.")
            return
        bands = [b.strip() for b in raw.split(",") if b.strip()]
        base_url = self._url_var.get().strip()

        if not messagebox.askyesno(
            "Confirm Band Lock",
            f"Apply band lock to bands {bands} on {base_url}?\n\n"
            "This will cause a brief modem reconnect.",
        ):
            return

        def _run() -> None:
            try:
                set_hilink_band_lock(base_url, bands)
                self._result_queue.put(("ok_msg", f"Band lock applied: {bands}"))
            except (OSError, ValueError) as exc:
                self._result_queue.put(("error", f"Band lock failed: {exc}"))

        threading.Thread(target=_run, daemon=True).start()

    # ------------------------------------------------------------------
    # History tab actions
    # ------------------------------------------------------------------

    def _clear_history(self) -> None:
        for item in self._hist_tree.get_children():
            self._hist_tree.delete(item)
        self._history.clear()

    def _export_history_json(self) -> None:
        if not self._history:
            messagebox.showinfo("Export", "No history to export.")
            return
        from tkinter import filedialog

        path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")],
            initialfile="rf_history.json",
        )
        if not path:
            return
        data = [s.as_dict() for s in self._history]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=2)
        messagebox.showinfo("Export", f"Exported {len(data)} record(s) to:\n{path}")

    # ------------------------------------------------------------------
    # Raw tab actions
    # ------------------------------------------------------------------

    def _copy_raw(self) -> None:
        content = self._raw_text.get("1.0", tk.END)
        self.clipboard_clear()
        self.clipboard_append(content)
        self._status_var.set("Raw content copied to clipboard.")

    # ------------------------------------------------------------------
    # Window close
    # ------------------------------------------------------------------

    def destroy(self) -> None:
        self._disconnect()
        super().destroy()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    app = ModemManagerApp()
    app.mainloop()


if __name__ == "__main__":
    main()
