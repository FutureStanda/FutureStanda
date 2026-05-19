"""Helpers shared across automations."""
from __future__ import annotations

import argparse
from datetime import datetime
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Dublin")


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


def now() -> datetime:
    return datetime.now(TZ)
