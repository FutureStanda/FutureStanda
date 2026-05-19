"""Calls Claude Haiku for a 3-sentence read on how the business is going.

System prompt is cacheable — it's static, the user message changes daily.
"""
from __future__ import annotations

import json
import os
from dataclasses import asdict
from typing import Any

import anthropic

from .metrics import Metrics

MODEL = "claude-haiku-4-5-20251001"

SYSTEM = """You are an embedded business coach for a solo founder running a web/lead-gen agency. Every morning and evening you read live metrics from Notion (tasks, clients, bookings, happiness, promise-fulfilment) and give a SHORT, BLUNT read.

Output strict JSON only — no prose, no markdown, no preamble. Schema:
{
  "headline": "string, ≤8 words, blunt assessment",
  "how_youre_doing": "string, 1-2 sentences. Cite a specific number. Compare to last period if data exists. Name the bottleneck.",
  "do_this_next": "string, 1 sentence. THE single next move. Reference a specific task or client name."
}

Hard rules:
- No fluff, no praise. If a metric is dropping, say so.
- If multiple things are slipping, pick the worst.
- Prefer specifics ("Azaan 9 days silent") over generalities ("client follow-ups lagging").
- Never use 'great', 'awesome', 'amazing', 'good job'. Tone = trusted friend who isn't impressed easily.
- If data is sparse, say what's missing in `how_youre_doing` (e.g. "happiness ratings missing on 3 clients — bot can't read sentiment").
- `do_this_next` MUST be actionable in <30 minutes."""


def analyze(metrics: Metrics, mode: str) -> dict[str, str]:
    """Returns dict with keys: headline, how_youre_doing, do_this_next.

    Falls back to a deterministic message if the LLM call fails — the bot
    should still ship a daily ping even if Anthropic is down.
    """
    payload = _payload(metrics, mode)

    try:
        client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"].strip())
        resp = client.messages.create(
            model=MODEL,
            max_tokens=400,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": f"Mode: {mode}\n\nMetrics:\n{json.dumps(payload, indent=2, default=str)}",
                }
            ],
        )
        text = "".join(block.text for block in resp.content if hasattr(block, "text"))
        return _parse_json(text)
    except Exception as e:
        return _fallback(metrics, mode, error=str(e))


def _payload(m: Metrics, mode: str) -> dict[str, Any]:
    """Slim, LLM-friendly representation of the metrics."""
    return {
        "mode": mode,
        "tasks": {
            "completed_yesterday": m.tasks_completed_yesterday,
            "completed_today": m.tasks_completed_today,
            "planned_today": m.tasks_planned_today,
            "due_today": m.tasks_due_today,
            "overdue": m.tasks_overdue,
            "tomorrow": m.tasks_tomorrow,
            "top_open": [
                {
                    "title": t.title,
                    "impact": t.impact,
                    "imperativeness": t.imperativeness,
                    "why": t.why[:200] if t.why else "",
                }
                for t in m.top_today[:5]
            ],
            "top_win_today": m.top_win_today,
        },
        "pipeline": {
            "bookings_this_week": m.bookings_this_week,
            "bookings_last_week": m.bookings_last_week,
            "bookings_delta": m.bookings_delta,
            "bookings_today": m.bookings_today,
            "mrr_total_eur": m.mrr_total,
            "active_clients": m.active_count,
        },
        "client_health": {
            "happiness_avg": round(m.happiness_avg, 2) if m.happiness_avg is not None else None,
            "happiness_n": m.happiness_n,
            "promise_score_pct": round(m.promise_score, 1) if m.promise_score is not None else None,
            "at_risk": [
                {"name": c.name, "days_since_contact": c.days_since_contact}
                for c in m.at_risk[:5]
            ],
        },
    }


def _parse_json(text: str) -> dict[str, str]:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        data = json.loads(text)
        return {
            "headline": str(data.get("headline", "")),
            "how_youre_doing": str(data.get("how_youre_doing", "")),
            "do_this_next": str(data.get("do_this_next", "")),
        }
    except json.JSONDecodeError:
        return {"headline": "", "how_youre_doing": text[:300], "do_this_next": ""}


def _fallback(m: Metrics, mode: str, *, error: str) -> dict[str, str]:
    bits: list[str] = []
    if m.tasks_overdue:
        bits.append(f"{m.tasks_overdue} task{'s' if m.tasks_overdue != 1 else ''} overdue")
    if m.at_risk:
        bits.append(f"{len(m.at_risk)} client{'s' if len(m.at_risk) != 1 else ''} at risk")
    if m.bookings_delta < 0:
        bits.append(f"bookings down {-m.bookings_delta} vs last week")

    if bits:
        how = "; ".join(bits) + "."
    else:
        how = "Numbers look stable. (AI read unavailable, raw metrics above.)"

    next_move = ""
    if m.at_risk:
        next_move = f"Send {m.at_risk[0].name} a short message before noon."
    elif m.top_today:
        next_move = f"Knock out: {m.top_today[0].title}."

    return {"headline": "Fallback summary", "how_youre_doing": how, "do_this_next": next_move}
