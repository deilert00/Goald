"""main.py — Entry point for the Modem Manager GUI application.

Run with::

    python main.py

or, after packaging (see README.md)::

    ModemManager.exe
"""

from __future__ import annotations

import logging
import sys

from PySide6.QtWidgets import QApplication

from main_window import MainWindow


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def main() -> None:
    _configure_logging()
    app = QApplication(sys.argv)
    app.setApplicationName("Modem Manager")
    app.setApplicationVersion("0.1.0")

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
