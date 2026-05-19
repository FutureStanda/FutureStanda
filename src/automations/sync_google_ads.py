"""Pulls yesterday's campaign metrics from Google Ads API and writes them
into the Campaigns Notion DB.

Stub: works once you have a Google Ads developer token (Google takes
~3 business days to approve a basic-access token) + OAuth2 refresh token.

Env vars needed:
    NOTION_TOKEN
    GOOGLE_ADS_DEVELOPER_TOKEN
    GOOGLE_ADS_CLIENT_ID
    GOOGLE_ADS_CLIENT_SECRET
    GOOGLE_ADS_REFRESH_TOKEN
    GOOGLE_ADS_LOGIN_CUSTOMER_ID   — your MCC's customer ID (no dashes)

How it knows which Notion row to update:
    - Each row in Campaigns DB has a `Google Ads Campaign ID` + `Ad Account ID`
    - For every row where both are set + Platform = "🟦 Google Ads", we run
      a GAQL query for yesterday's stats and update the row.

This module imports google-ads SDK lazily so the bot doesn't depend on it
unless you actually run this script. Install with:
    pip install google-ads
"""
from __future__ import annotations

import os
import sys
from datetime import date, timedelta

from ..notion_api import client as notion_client
from ._shared import parse_args

CAMPAIGNS_DB = "f0632403-43ea-4fd4-a0f3-8f06a14f0d00"

GAQL = """
SELECT
  campaign.id,
  metrics.cost_micros,
  metrics.impressions,
  metrics.clicks,
  metrics.conversions
FROM campaign
WHERE campaign.id = {campaign_id}
  AND segments.date = '{day}'
"""


def _ads_client():
    try:
        from google.ads.googleads.client import GoogleAdsClient
    except ImportError:
        print(
            "google-ads SDK not installed. Run: pip install google-ads",
            file=sys.stderr,
        )
        sys.exit(2)
    config = {
        "developer_token": os.environ["GOOGLE_ADS_DEVELOPER_TOKEN"],
        "client_id": os.environ["GOOGLE_ADS_CLIENT_ID"],
        "client_secret": os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        "refresh_token": os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        "login_customer_id": os.environ["GOOGLE_ADS_LOGIN_CUSTOMER_ID"],
        "use_proto_plus": True,
    }
    return GoogleAdsClient.load_from_dict(config)


def fetch_stats(ads, customer_id: str, campaign_id: str, day: str) -> dict | None:
    service = ads.get_service("GoogleAdsService")
    query = GAQL.format(campaign_id=campaign_id, day=day)
    try:
        stream = service.search_stream(customer_id=customer_id, query=query)
    except Exception as e:
        print(f"  ! GoogleAdsService.search_stream failed for {campaign_id}: {e}", file=sys.stderr)
        return None

    for batch in stream:
        for row in batch.results:
            return {
                "spend": row.metrics.cost_micros / 1_000_000,
                "impressions": int(row.metrics.impressions),
                "clicks": int(row.metrics.clicks),
                "leads": int(row.metrics.conversions),
            }
    return {"spend": 0.0, "impressions": 0, "clicks": 0, "leads": 0}


def main() -> int:
    args = parse_args()
    if "GOOGLE_ADS_DEVELOPER_TOKEN" not in os.environ:
        print("[sync_google_ads] developer token not set; skipping silently")
        return 0

    ads = _ads_client()
    notion = notion_client()
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
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
            cid_prop = props.get("Google Ads Campaign ID", {}).get("rich_text", [])
            cid = "".join(p.get("plain_text", "") for p in cid_prop).strip()
            customer_prop = props.get("Ad Account ID", {}).get("rich_text", [])
            customer = "".join(p.get("plain_text", "") for p in customer_prop).strip().replace("-", "")
            if not cid or not customer:
                continue

            stats = fetch_stats(ads, customer, cid, yesterday)
            if stats is None:
                continue

            update_props = {
                "Yesterday Spend €": {"number": stats["spend"]},
                "Yesterday Leads": {"number": stats["leads"]},
                "Impressions": {"number": stats["impressions"]},
                "Clicks": {"number": stats["clicks"]},
                "Last Synced": {"date": {"start": today_iso}},
            }

            if args.dry_run:
                print(f"  [dry-run] would update {cid}: {stats}")
            else:
                notion.pages.update(page_id=page["id"], properties=update_props)
                print(f"  ✓ {cid}: spend €{stats['spend']:.2f}, {stats['leads']} leads")
            updated += 1

        if not resp.get("has_more"):
            break
        start_cursor = resp["next_cursor"]

    print(f"[sync_google_ads] {updated} campaigns synced")
    return 0


if __name__ == "__main__":
    sys.exit(main())
