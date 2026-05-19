"""Thin wrapper around the Notion API that returns plain Python dicts.

Data sources are referenced by ID (collection UUIDs). Three are in play:

    BUSINESS_TASKS  - tasks DB with Impact, Imperativeness, Why this matters, Source
    CLIENTS         - active paying clients with Onboarding Stage, MRR, Health, Happiness
    LEADS           - pre-payment funnel (Leads + Clients DB) with Pipeline Stage, Amount
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Iterator

from notion_client import Client as NotionClient


# Notion data source IDs (stable, hard-coded — these are the "tables" the bot reads).
BUSINESS_TASKS_DS = "1bce1db9-1ca2-81c0-b918-000bd3d7c1f6"
CLIENTS_DS = "5a9a8881-f049-4b37-9454-db3968cb9d5a"
LEADS_DS = "32ae1db9-1ca2-81f2-a69d-000b442454ed"


@dataclass
class Task:
    id: str
    title: str
    impact: float | None
    imperativeness: str | None
    source: str | None
    why: str
    status: str | None
    due: datetime | None
    completed: datetime | None
    client_ids: list[str] = field(default_factory=list)


@dataclass
class ClientRow:
    id: str
    name: str
    status: str | None
    onboarding_stage: str | None
    happiness: float | None
    nps: float | None
    mrr: float | None
    amount: float | None
    days_since_contact: float | None
    last_contact: datetime | None
    next_contact: datetime | None
    churn_risk: str | None
    promise_pct: float | None
    tasks_open: float | None


@dataclass
class Lead:
    id: str
    name: str
    status: str | None
    pipeline_stage: str | None
    amount: float | None
    happiness: float | None
    confirmation_date: datetime | None
    paid_date: datetime | None
    last_contact: datetime | None


def client() -> NotionClient:
    token = os.environ["NOTION_TOKEN"]
    return NotionClient(auth=token)


def _iter_db(notion: NotionClient, data_source_id: str, **query) -> Iterator[dict[str, Any]]:
    """Page through every row of a data source."""
    start_cursor: str | None = None
    while True:
        kwargs: dict[str, Any] = {"data_source_id": data_source_id, "page_size": 100, **query}
        if start_cursor:
            kwargs["start_cursor"] = start_cursor
        resp = notion.data_sources.query(**kwargs)
        yield from resp["results"]
        if not resp.get("has_more"):
            return
        start_cursor = resp["next_cursor"]


def _prop(page: dict, name: str) -> dict | None:
    return page.get("properties", {}).get(name)


def _title_text(prop: dict | None) -> str:
    if not prop:
        return ""
    items = prop.get("title") or prop.get("rich_text") or []
    return "".join(part.get("plain_text", "") for part in items).strip()


def _rich_text(prop: dict | None) -> str:
    if not prop:
        return ""
    items = prop.get("rich_text", [])
    return "".join(part.get("plain_text", "") for part in items).strip()


def _select(prop: dict | None) -> str | None:
    if not prop:
        return None
    sel = prop.get("select")
    return sel["name"] if sel else None


def _number(prop: dict | None) -> float | None:
    if not prop:
        return None
    return prop.get("number")


def _date(prop: dict | None) -> datetime | None:
    if not prop:
        return None
    d = prop.get("date")
    if not d or not d.get("start"):
        return None
    raw = d["start"]
    # Notion returns either YYYY-MM-DD or ISO-8601 with offset.
    try:
        if "T" in raw:
            return datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return datetime.fromisoformat(raw).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _formula_str(prop: dict | None) -> str | None:
    if not prop:
        return None
    f = prop.get("formula", {})
    if f.get("type") == "string":
        return f.get("string")
    if f.get("type") == "number":
        v = f.get("number")
        return None if v is None else str(v)
    return None


def _formula_number(prop: dict | None) -> float | None:
    if not prop:
        return None
    f = prop.get("formula", {})
    return f.get("number") if f.get("type") == "number" else None


def _rollup_number(prop: dict | None) -> float | None:
    if not prop:
        return None
    r = prop.get("rollup", {})
    if r.get("type") == "number":
        return r.get("number")
    return None


def _relation_ids(prop: dict | None) -> list[str]:
    if not prop:
        return []
    return [r["id"] for r in prop.get("relation", [])]


def fetch_tasks(notion: NotionClient) -> list[Task]:
    out: list[Task] = []
    for page in _iter_db(notion, BUSINESS_TASKS_DS):
        out.append(
            Task(
                id=page["id"],
                title=_title_text(_prop(page, "Task")),
                impact=_number(_prop(page, "Impact (1-10)")),
                imperativeness=_select(_prop(page, "Imperativeness")),
                source=_select(_prop(page, "Source")),
                why=_rich_text(_prop(page, "Why this matters")),
                status=_select(_prop(page, "Status")),
                due=_date(_prop(page, "Due Time")),
                completed=_date(_prop(page, "Completed Time")),
                client_ids=_relation_ids(_prop(page, "Client")),
            )
        )
    return out


def fetch_clients(notion: NotionClient) -> list[ClientRow]:
    out: list[ClientRow] = []
    for page in _iter_db(notion, CLIENTS_DS):
        out.append(
            ClientRow(
                id=page["id"],
                name=_title_text(_prop(page, "Business Name")),
                status=_select(_prop(page, "Status")),
                onboarding_stage=_select(_prop(page, "Onboarding Stage")),
                happiness=_number(_prop(page, "Happiness scale")),
                nps=_number(_prop(page, "NPS")),
                mrr=_formula_number(_prop(page, "MRR €")),
                amount=_number(_prop(page, "Amount €")),
                days_since_contact=_formula_number(_prop(page, "Days Since Contact")),
                last_contact=_date(_prop(page, "Last Contact")),
                next_contact=_date(_prop(page, "Next Contact")),
                churn_risk=_formula_str(_prop(page, "Churn Risk")),
                promise_pct=_rollup_number(_prop(page, "Promise Fulfilment %")),
                tasks_open=_rollup_number(_prop(page, "Tasks Open")),
            )
        )
    return out


def fetch_leads(notion: NotionClient) -> list[Lead]:
    out: list[Lead] = []
    for page in _iter_db(notion, LEADS_DS):
        out.append(
            Lead(
                id=page["id"],
                name=_title_text(_prop(page, "Business Name")),
                status=_select(_prop(page, "Status")),
                pipeline_stage=_select(_prop(page, "Pipeline Stage")),
                amount=_number(_prop(page, "Amount €")),
                happiness=_number(_prop(page, "Happiness scale")),
                confirmation_date=_date(_prop(page, "Confirmation Date")),
                paid_date=_date(_prop(page, "Paid Invoice date")),
                last_contact=_date(_prop(page, "Last Contact")),
            )
        )
    return out


def create_coach_task(
    notion: NotionClient,
    title: str,
    why: str,
    impact: int,
    imperativeness: str,
    due_iso: str,
    client_id: str | None = None,
) -> str:
    """Write a new task into Business Tasks tagged 🧠 Coach. Returns the page ID."""
    props: dict[str, Any] = {
        "Task": {"title": [{"text": {"content": title}}]},
        "Source": {"select": {"name": "🧠 Coach"}},
        "Why this matters": {"rich_text": [{"text": {"content": why}}]},
        "Impact (1-10)": {"number": impact},
        "Imperativeness": {"select": {"name": imperativeness}},
        "Due Time": {"date": {"start": due_iso}},
        "Status": {"select": {"name": "⚪ Not Started"}},
    }
    if client_id:
        props["Client"] = {"relation": [{"id": client_id}]}
    page = notion.pages.create(
        parent={"data_source_id": BUSINESS_TASKS_DS},
        properties=props,
    )
    return page["id"]
