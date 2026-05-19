"""Flags newly-at-risk clients. State-aware: only alerts when a client crosses
into 🔴 High churn risk for the first time (vs the previous run).

State stored in .state/churn_seen.json (committed back by the workflow so the
next run sees it).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from .. import telegram
from ..format import esc
from ..notion_api import client, fetch_clients
from ._shared import parse_args

STATE_FILE = Path(".state/churn_seen.json")


def _load_state() -> set[str]:
    if not STATE_FILE.exists():
        return set()
    try:
        return set(json.loads(STATE_FILE.read_text()))
    except json.JSONDecodeError:
        return set()


def _save_state(ids: set[str]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(sorted(ids), indent=2))


def main() -> int:
    args = parse_args()
    seen = _load_state()
    clients = fetch_clients(client())

    at_risk = [
        c for c in clients
        if c.churn_risk and c.churn_risk.startswith("🔴")
        and c.status in {"Active", "Won", "Paused"}
    ]

    new_at_risk = [c for c in at_risk if c.id not in seen]

    if new_at_risk:
        lines = ["*🚨 New churn risks*", ""]
        for c in new_at_risk:
            days = int(c.days_since_contact) if c.days_since_contact else "?"
            lines.append(f"• {esc(c.name)} — {esc(days)}d silent · MRR €{esc(int(c.mrr or 0))}")
        lines.append("")
        lines.append(esc("Send a Loom or pick up the phone. Today."))
        telegram.send("\n".join(lines), dry_run=args.dry_run)
    else:
        print("[churn_watcher] no new at-risk clients")

    if not args.dry_run:
        _save_state({c.id for c in at_risk})

    return 0


if __name__ == "__main__":
    sys.exit(main())
