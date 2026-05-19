"""One-shot helper: prints the chat_id of any chat your bot is in.

How to use:
    1. Create your bot via @BotFather, set TELEGRAM_BOT_TOKEN in .env.
    2. Add the bot as ADMIN to the Business reports channel (post-messages perm).
    3. Post ANY message in the channel (the bot needs an update to read).
    4. Run: python scripts/get_chat_id.py
    5. Copy the chat_id (negative number starting with -100…) into TELEGRAM_CHAT_ID.
"""
from __future__ import annotations

import os
import sys

import requests


def main() -> int:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        print("ERROR: TELEGRAM_BOT_TOKEN not set", file=sys.stderr)
        return 1

    resp = requests.get(f"https://api.telegram.org/bot{token}/getUpdates", timeout=15)
    data = resp.json()

    if not data.get("ok"):
        print(f"ERROR: {data}", file=sys.stderr)
        return 1

    updates = data.get("result", [])
    if not updates:
        print(
            "No updates yet. Post a message in the channel (or send /start to the bot in DM), "
            "then re-run this script.",
            file=sys.stderr,
        )
        return 1

    seen: set[tuple[int, str, str]] = set()
    for upd in updates:
        # Channel posts come under 'channel_post', DMs under 'message'.
        for key in ("channel_post", "message", "edited_channel_post", "edited_message"):
            msg = upd.get(key)
            if not msg:
                continue
            chat = msg.get("chat", {})
            cid = chat.get("id")
            ctitle = chat.get("title") or chat.get("username") or ""
            ctype = chat.get("type", "")
            if cid is None or (cid, ctitle, ctype) in seen:
                continue
            seen.add((cid, ctitle, ctype))
            print(f"chat_id={cid}    type={ctype:<10}  title={ctitle}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
