"""Pings the channel about Leads where status='Sent invoice' and 7+ days have
passed without a Paid Invoice date. Run daily.
"""
from __future__ import annotations

import sys
from datetime import timedelta

from .. import telegram
from ..format import esc
from ..notion_api import client, fetch_leads
from ._shared import now, parse_args


def main() -> int:
    args = parse_args()
    leads = fetch_leads(client())
    n = now()
    stale = []
    for ld in leads:
        if ld.status not in {"Sent invoice ", "Sent invoice"}:
            continue
        if ld.paid_date:
            continue
        ref = ld.confirmation_date or ld.last_contact
        if not ref:
            continue
        days = (n.date() - ref.date()).days
        if days >= 7:
            stale.append((ld, days))

    if not stale:
        print("[invoice_chase] no stale invoices")
        return 0

    stale.sort(key=lambda x: -x[1])

    lines = ["*💸 Invoice chase*", ""]
    for ld, days in stale[:10]:
        amount = f"€{ld.amount:,.0f}" if ld.amount else "—"
        lines.append(f"• {esc(ld.name)} — {esc(amount)} · {esc(days)}d unpaid")
    lines.append("")
    lines.append(esc("Pick one. Send the 'closing my book Monday' SMS now."))

    telegram.send("\n".join(lines), dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    sys.exit(main())
