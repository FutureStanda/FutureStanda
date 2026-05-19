"""Flags clients stuck in the same Onboarding Stage longer than the expected SLA.

Approximate SLAs from the Clients DB stages:
    🟢 Day 0 Payment       → should move within  1 day
    🟡 Day 1-2 Access      → 2 days
    🔍 Day 3 Audit         → 1 day
    📞 Day 4 Kickoff       → 1 day
    🛠️ Day 5-7 Build       → 3 days
    🚀 Live                → no SLA (steady state)
    📈 Optimising          → no SLA
    ✅ Mature              → no SLA

We approximate "days in stage" via `Days Since Contact` since we don't have an
edit-time for the stage property. If you want exact stage-age tracking later,
add a `Stage Changed Date` date prop and write to it from the bot.
"""
from __future__ import annotations

import sys

from .. import telegram
from ..format import esc
from ..notion_api import client, fetch_clients
from ._shared import parse_args

SLA_DAYS = {
    "🟢 Day 0 Payment": 1,
    "🟡 Day 1-2 Access": 2,
    "🔍 Day 3 Audit": 1,
    "📞 Day 4 Kickoff": 1,
    "🛠️ Day 5-7 Build": 3,
}


def main() -> int:
    args = parse_args()
    clients = fetch_clients(client())
    stuck = []
    for c in clients:
        sla = SLA_DAYS.get(c.onboarding_stage or "")
        if sla is None:
            continue
        days = c.days_since_contact
        if days is not None and days > sla:
            stuck.append((c, days))

    if not stuck:
        print("[stage_stuck] no stuck clients")
        return 0

    stuck.sort(key=lambda x: -x[1])
    lines = ["*🚧 Onboarding stuck*", ""]
    for c, days in stuck[:8]:
        lines.append(
            f"• {esc(c.name)} — {esc(c.onboarding_stage)} · {esc(int(days))}d since contact"
        )
    lines.append("")
    lines.append(esc("Each of these is a Slack/email/Loom away from moving."))

    telegram.send("\n".join(lines), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
