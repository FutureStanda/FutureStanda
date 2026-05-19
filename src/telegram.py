"""Minimal Telegram Bot API wrapper — just sendMessage with MarkdownV2."""
from __future__ import annotations

import os

import requests


def send(text: str, *, dry_run: bool = False) -> None:
    if dry_run:
        print("=" * 60)
        print(text)
        print("=" * 60)
        return

    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    resp = requests.post(
        url,
        json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "MarkdownV2",
            "disable_web_page_preview": True,
        },
        timeout=30,
    )
    if not resp.ok:
        # Telegram returns a useful description in the body — surface it.
        raise RuntimeError(f"Telegram send failed: {resp.status_code} {resp.text}")
