"""Lists active clients with no Happiness scale rated, nudging you to score them.

Run weekly (e.g. Friday) to keep the happiness signal alive.
"""
from __future__ import annotations

import sys

from .. import telegram
from ..format import esc
from ..notion_api import client, fetch_clients
from ._shared import parse_args


def main() -> int:
    args = parse_args()
    clients = fetch_clients(client())

    unrated = [
        c for c in clients
        if c.status in {"Active", "Won"} and c.happiness is None
    ]

    if not unrated:
        print("[happiness_pulse] all active clients rated")
        return 0

    lines = ["*😊 Happiness pulse*", ""]
    lines.append(esc(f"{len(unrated)} active client{'s' if len(unrated) != 1 else ''} unrated:"))
    for c in unrated[:10]:
        lines.append(f"• {esc(c.name)}")
    lines.append("")
    lines.append(esc("Open Clients DB → tap Happiness scale → score 1–10. 30 seconds each."))

    telegram.send("\n".join(lines), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
