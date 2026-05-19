"""Once a week (Monday early-morning), Claude reads live state and writes
3-5 new tasks into Business Tasks tagged 🧠 Coach with `Why this matters`
filled. Implements the design page `🧰 Coach-Suggested Tasks — Auto-create
from Report` natively (no Make.com).

Idempotency: stores the date of the last successful run in
.state/coach_last_run.json so a re-run on the same day is a no-op.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

import anthropic

from .. import telegram
from ..analyze import _payload  # reuse the metrics serialization
from ..format import esc
from ..metrics import compute
from ..notion_api import client, create_coach_task, fetch_clients, fetch_leads, fetch_tasks
from ._shared import parse_args

MODEL = "claude-sonnet-4-6"  # Sonnet for higher-stakes task drafting

STATE_FILE = Path(".state/coach_last_run.json")

SYSTEM = """You are an embedded business coach for a solo founder running a web/lead-gen agency. You read live business state from Notion and write 3-5 prioritised tasks that will move the needle THIS WEEK.

Output strict JSON only — no prose, no markdown:
{
  "tasks": [
    {
      "title": "specific verb + object, ≤80 chars",
      "why": "1-2 sentences citing the metric or client name that justifies this task",
      "impact": <integer 1-10>,
      "imperativeness": "Criticial" | "High Importance" | "Important" | "Quick Task",
      "due_when": "today AM" | "today PM" | "tomorrow" | "this week",
      "client_name": <string|null>  // exact name from at_risk list if applicable
    }
  ]
}

Rules:
- No task longer than 2 hours of work.
- No vague tasks ("work on marketing"). Verb + object only.
- Max 5 tasks. Pick the highest-leverage moves only.
- Each task MUST tie to a number or named entity from the metrics.
- If a client is at risk, at least one task should target them by name.
- imperativeness 'Criticial' (note Notion's typo) for things that have visible pain TODAY."""


def _due_iso(due_when: str) -> str:
    today = date.today()
    if due_when == "today AM":
        d = today
        return f"{d.isoformat()}T11:00:00"
    if due_when == "today PM":
        d = today
        return f"{d.isoformat()}T16:00:00"
    if due_when == "tomorrow":
        d = today + timedelta(days=1)
        return f"{d.isoformat()}T10:00:00"
    # this week → upcoming Friday
    days_ahead = (4 - today.weekday()) % 7 or 7
    d = today + timedelta(days=days_ahead)
    return f"{d.isoformat()}T17:00:00"


def _already_ran_today() -> bool:
    if not STATE_FILE.exists():
        return False
    try:
        data = json.loads(STATE_FILE.read_text())
        return data.get("last_run") == date.today().isoformat()
    except (json.JSONDecodeError, OSError):
        return False


def _mark_ran() -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps({"last_run": date.today().isoformat()}))


def main() -> int:
    args = parse_args()

    if _already_ran_today() and not args.dry_run:
        print("[coach_writer] already ran today, skipping")
        return 0

    notion = client()
    metrics = compute(fetch_tasks(notion), fetch_clients(notion), fetch_leads(notion))
    payload = _payload(metrics, "coach")

    anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    resp = anthropic_client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=SYSTEM,
        messages=[
            {
                "role": "user",
                "content": (
                    "Read this state and write 3-5 prioritised tasks.\n\n"
                    + json.dumps(payload, indent=2, default=str)
                ),
            }
        ],
    )
    text = "".join(b.text for b in resp.content if hasattr(b, "text")).strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    suggestions = json.loads(text).get("tasks", [])

    # Build a name → id map for client linking.
    clients_by_name = {c.name.lower(): c.id for c in fetch_clients(notion)}

    created_titles: list[str] = []
    for task in suggestions[:5]:
        title = task.get("title", "").strip()
        if not title:
            continue
        client_id = None
        cname = task.get("client_name")
        if cname:
            client_id = clients_by_name.get(cname.lower())

        if not args.dry_run:
            create_coach_task(
                notion=notion,
                title=title,
                why=task.get("why", ""),
                impact=int(task.get("impact", 5)),
                imperativeness=task.get("imperativeness", "Important"),
                due_iso=_due_iso(task.get("due_when", "today PM")),
                client_id=client_id,
            )
        created_titles.append(title)

    if not args.dry_run:
        _mark_ran()

    lines = ["*🧠 Coach dropped tasks*", ""]
    for t in created_titles:
        lines.append(f"• {esc(t)}")
    lines.append("")
    lines.append(esc("Open Business Tasks → 🔥 Critical Today."))
    telegram.send("\n".join(lines), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
