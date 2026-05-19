"""Telegram MarkdownV2 message builder.

MarkdownV2 requires escaping these characters outside of formatting:
    _ * [ ] ( ) ~ ` > # + - = | { } . !

Inside a `code` block only ` and \\ need escaping; inside a *bold* block only
* and \\. We restrict use of bold (*...*) and code (`...`), so the global
escaper covers everything else. See:
https://core.telegram.org/bots/api#markdownv2-style
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from .metrics import Metrics

_TZ = ZoneInfo("Europe/Dublin")
_ESCAPE = re.compile(r"([_*\[\]()~`>#+\-=|{}.!\\])")


def esc(text: str | None) -> str:
    """Escape MarkdownV2 reserved characters in plain text."""
    if text is None:
        return ""
    return _ESCAPE.sub(r"\\\1", str(text))


def _bold(text: str) -> str:
    return f"*{esc(text)}*"


def _heading(text: str) -> str:
    return f"*{esc(text)}*"


def _fmt_money(v: float | None) -> str:
    if v is None:
        return "—"
    return f"€{v:,.0f}".replace(",", ",")


def _fmt_delta(v: float | None) -> str:
    if v is None or v == 0:
        return "—"
    sign = "+" if v > 0 else ""
    return f"{sign}{v:,.0f}".replace(",", ",")


def _fmt_pct(v: float | None) -> str:
    if v is None:
        return "—"
    return f"{v:.0f}%"


def _fmt_score(v: float | None, denom: int = 10) -> str:
    if v is None:
        return "—"
    return f"{v:.1f}/{denom}"


def build_morning(m: Metrics, ai: dict[str, str], now: datetime | None = None) -> str:
    now = now or datetime.now(_TZ)
    header = now.strftime("%a %-d %b")
    lines: list[str] = []
    lines.append(_heading(f"☀️ Morning · {header}"))
    lines.append("")

    # Tasks line
    done_y = m.tasks_completed_yesterday
    due_t = m.tasks_due_today
    overdue = m.tasks_overdue
    lines.append(
        f"📋 *Tasks*  {esc(done_y)} done yesterday · {esc(due_t)} due today · {esc(overdue)} overdue"
    )

    # Pipeline
    lines.append(
        f"💰 *Pipeline*  "
        f"{esc(m.bookings_this_week)} bookings this week "
        f"\\({esc(_fmt_delta(m.bookings_delta))} vs last\\) · "
        f"MRR {esc(_fmt_money(m.mrr_total))}"
    )

    # Happiness
    lines.append(
        f"😊 *Happiness*  {esc(_fmt_score(m.happiness_avg))} avg "
        f"\\({esc(m.happiness_n)} rated\\)"
    )

    # Promise score
    lines.append(
        f"🤝 *Promise score*  {esc(_fmt_pct(m.promise_score))}"
    )

    # At-risk callouts
    if m.at_risk:
        names = ", ".join(c.name for c in m.at_risk[:3])
        lines.append(f"🚨 *At risk*  {esc(names)}")

    lines.append("")

    # Top 3 today
    if m.top_today:
        lines.append(_heading("🎯 Top 3 today"))
        for i, t in enumerate(m.top_today[:3], start=1):
            imp = (t.imperativeness or "—").replace("Criticial", "Critical")
            impact = f"Impact {int(t.impact)}" if t.impact else "—"
            lines.append(f"{i}\\. {esc(t.title)} \\({esc(imp)} · {esc(impact)}\\)")
        lines.append("")

    # AI read
    if ai.get("how_youre_doing") or ai.get("do_this_next"):
        lines.append(_heading("🧠 Read"))
        if ai.get("how_youre_doing"):
            lines.append(esc(ai["how_youre_doing"]))
        if ai.get("do_this_next"):
            lines.append(f"*Do this next:* {esc(ai['do_this_next'])}")

    return "\n".join(lines)


def build_evening(m: Metrics, ai: dict[str, str], now: datetime | None = None) -> str:
    now = now or datetime.now(_TZ)
    header = now.strftime("%a %-d %b")
    lines: list[str] = []
    lines.append(_heading(f"🌙 Evening · {header}"))
    lines.append("")

    done_t = m.tasks_completed_today
    planned_t = m.tasks_planned_today
    pct = _fmt_pct(100 * done_t / planned_t if planned_t else 0)
    lines.append(f"📋 *Today*  {esc(done_t)}/{esc(planned_t)} done \\({esc(pct)}\\)")

    if m.tasks_overdue:
        lines.append(f"⚠️ *Overdue*  {esc(m.tasks_overdue)} still open")

    if m.top_win_today:
        lines.append(f"🏆 *Top win*  {esc(m.top_win_today)}")

    if m.tasks_tomorrow:
        lines.append(f"📅 *Tomorrow*  {esc(m.tasks_tomorrow)} scheduled")

    if m.bookings_today:
        lines.append(f"✨ *New bookings today*  {esc(m.bookings_today)}")

    if m.at_risk:
        names = ", ".join(c.name for c in m.at_risk[:3])
        lines.append(f"🚨 *Still at risk*  {esc(names)}")

    lines.append("")

    if ai.get("how_youre_doing") or ai.get("do_this_next"):
        lines.append(_heading("🧠 Read"))
        if ai.get("how_youre_doing"):
            lines.append(esc(ai["how_youre_doing"]))
        if ai.get("do_this_next"):
            lines.append(f"*Tomorrow's first move:* {esc(ai['do_this_next'])}")

    return "\n".join(lines)
