"""Pulls yesterday's campaign metrics from Meta Marketing API and writes them
into the Campaigns Notion DB.

How it knows which Notion row to update:
    - Each row in Campaigns DB has a `Meta Campaign ID` field
    - For every row where that's set + Platform = "📘 Meta Ads", we pull
      yesterday's insights and update Yesterday Spend €, Yesterday Leads,
      Impressions, Clicks, Last Synced

Env vars needed:
    NOTION_TOKEN
    META_ADS_TOKEN       — long-lived system user access token (Business Manager)

Run: python -m src.automations.sync_meta_ads [--dry-run]
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, timedelta

import requests

from ..notion_api import client as notion_client
from ._shared import parse_args

META_API_VERSION = "v19.0"
META_BASE = f"https://graph.facebook.com/{META_API_VERSION}"

CAMPAIGNS_DB = "f0632403-43ea-4fd4-a0f3-8f06a14f0d00"


def fetch_insights(token: str, campaign_id: str, since: str, until: str) -> dict | None:
    """Returns {spend, impressions, clicks, leads} for a single campaign across a date window."""
    url = f"{META_BASE}/{campaign_id}/insights"
    params = {
        "access_token": token,
        "fields": "spend,impressions,clicks,actions",
        "time_range": json.dumps({"since": since, "until": until}),
        "level": "campaign",
    }
    resp = requests.get(url, params=params, timeout=30)
    if not resp.ok:
        print(f"  ! Meta API {resp.status_code}: {resp.text[:200]}", file=sys.stderr)
        return None

    rows = resp.json().get("data", [])
    if not rows:
        return {"spend": 0.0, "impressions": 0, "clicks": 0, "leads": 0}

    row = rows[0]
    leads = 0
    for action in row.get("actions", []):
        kind = action.get("action_type", "")
        if kind in {"lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"}:
            leads += int(float(action.get("value", 0)))

    return {
        "spend": float(row.get("spend", 0)),
        "impressions": int(row.get("impressions", 0)),
        "clicks": int(row.get("clicks", 0)),
        "leads": leads,
    }


def main() -> int:
    args = parse_args()
    token = os.environ.get("META_ADS_TOKEN")
    if not token:
        print("[sync_meta_ads] META_ADS_TOKEN not set; skipping silently")
        return 0

    notion = notion_client()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    today_iso = date.today().isoformat()

    start_cursor = None
    updated = 0
    while True:
        resp = notion.databases.query(
            database_id=CAMPAIGNS_DB,
            page_size=100,
            start_cursor=start_cursor,
        )
        for page in resp["results"]:
            props = page["properties"]
            meta_id_prop = props.get("Meta Campaign ID", {}).get("rich_text", [])
            meta_id = "".join(p.get("plain_text", "") for p in meta_id_prop).strip()
            if not meta_id:
                continue

            insights = fetch_insights(token, meta_id, yesterday, yesterday)
            if insights is None:
                continue

            update_props = {
                "Yesterday Spend €": {"number": insights["spend"]},
                "Yesterday Leads": {"number": insights["leads"]},
                "Impressions": {"number": insights["impressions"]},
                "Clicks": {"number": insights["clicks"]},
                "Last Synced": {"date": {"start": today_iso}},
            }

            if args.dry_run:
                print(f"  [dry-run] would update {meta_id}: {insights}")
            else:
                notion.pages.update(page_id=page["id"], properties=update_props)
                print(f"  ✓ {meta_id}: spend €{insights['spend']:.2f}, {insights['leads']} leads")
            updated += 1

        if not resp.get("has_more"):
            break
        start_cursor = resp["next_cursor"]

    print(f"[sync_meta_ads] {updated} campaigns synced")
    return 0


if __name__ == "__main__":
    sys.exit(main())
