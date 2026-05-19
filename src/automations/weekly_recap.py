"""Sunday-evening summary: a longer-form weekly view of bookings, MRR, wins,
misses, happiness drift. Calls Claude for a 3-paragraph reflection.
"""
from __future__ import annotations

import sys

from .. import telegram
from ..analyze import analyze
from ..format import esc
from ..metrics import Metrics, compute
from ..notion_api import client, fetch_clients, fetch_leads, fetch_tasks
from ._shared import parse_args


def _format(m: Metrics, ai: dict[str, str]) -> str:
    lines = ["*📊 Weekly recap*", ""]
    delta = f"{m.bookings_delta:+d}" if m.bookings_delta else "0"
    lines.append(
        f"💰 *Bookings*  {esc(m.bookings_this_week)} this week "
        f"\\(last week {esc(m.bookings_last_week)}, Δ {esc(delta)}\\)"
    )
    if m.mrr_total:
        lines.append(f"📈 *MRR*  €{esc(int(m.mrr_total))} from {esc(m.active_count)} active")
    if m.happiness_avg:
        lines.append(f"😊 *Happiness*  {esc(round(m.happiness_avg, 1))}/10 ({esc(m.happiness_n)} rated)")
    if m.promise_score is not None:
        lines.append(f"🤝 *Promise score*  {esc(round(m.promise_score))}%")
    lines.append("")

    if ai.get("how_youre_doing"):
        lines.append(_h("🧠 Read"))
        lines.append(esc(ai["how_youre_doing"]))
    if ai.get("do_this_next"):
        lines.append("")
        lines.append(f"*Next week's #1:* {esc(ai['do_this_next'])}")

    return "\n".join(lines)


def _h(text: str) -> str:
    return f"*{esc(text)}*"


def main() -> int:
    args = parse_args()
    notion = client()
    m = compute(fetch_tasks(notion), fetch_clients(notion), fetch_leads(notion))
    ai = analyze(m, mode="weekly")
    telegram.send(_format(m, ai), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
