"""Entry point for the business-report Telegram bot.

Usage:
    python -m src.main --mode morning            # send morning digest to channel
    python -m src.main --mode evening             # send evening digest
    python -m src.main --mode morning --dry-run   # print to stdout, don't send

Reads Notion via NOTION_TOKEN, sends via TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID,
calls Claude via ANTHROPIC_API_KEY.
"""
from __future__ import annotations

import argparse
import sys
import traceback

from . import telegram
from .analyze import analyze
from .format import build_evening, build_morning
from .metrics import compute
from .notion_api import client, fetch_clients, fetch_leads, fetch_tasks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["morning", "evening"], required=True)
    parser.add_argument("--dry-run", action="store_true", help="print, don't send")
    parser.add_argument(
        "--skip-ai", action="store_true", help="skip the Claude call (use fallback string)"
    )
    args = parser.parse_args()

    print(f"[business-report] mode={args.mode} dry_run={args.dry_run}", file=sys.stderr)

    try:
        notion = client()
        tasks = fetch_tasks(notion)
        clients = fetch_clients(notion)
        leads = fetch_leads(notion)
        print(
            f"[business-report] fetched {len(tasks)} tasks, {len(clients)} clients, "
            f"{len(leads)} leads",
            file=sys.stderr,
        )

        metrics = compute(tasks, clients, leads)

        if args.skip_ai:
            ai = {"headline": "", "how_youre_doing": "", "do_this_next": ""}
        else:
            ai = analyze(metrics, args.mode)

        if args.mode == "morning":
            message = build_morning(metrics, ai)
        else:
            message = build_evening(metrics, ai)

        telegram.send(message, dry_run=args.dry_run)
        return 0

    except Exception as e:
        traceback.print_exc()
        # On real (non-dry) runs we want to ping ourselves about the failure so
        # silent breakage doesn't go unnoticed.
        if not args.dry_run:
            try:
                telegram.send(
                    f"⚠️ business\\-report failed: `{type(e).__name__}` — see Action logs"
                )
            except Exception:
                pass
        return 1


if __name__ == "__main__":
    sys.exit(main())
