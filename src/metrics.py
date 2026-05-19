"""Pure functions that turn fetched Notion rows into computed business metrics.

No I/O lives in here — easy to unit-test by feeding in synthetic Task/Client lists.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from .notion_api import ClientRow, Lead, Task

_TZ = ZoneInfo("Europe/Dublin")


@dataclass
class Metrics:
    # Task throughput
    tasks_completed_yesterday: int = 0
    tasks_completed_today: int = 0
    tasks_planned_today: int = 0
    tasks_due_today: int = 0
    tasks_tomorrow: int = 0
    tasks_overdue: int = 0
    top_today: list[Task] = field(default_factory=list)
    top_win_today: str = ""

    # Pipeline / bookings
    bookings_this_week: int = 0
    bookings_last_week: int = 0
    bookings_delta: int = 0
    bookings_today: int = 0
    mrr_total: float | None = None

    # Client health
    happiness_avg: float | None = None
    happiness_n: int = 0
    promise_score: float | None = None
    at_risk: list[ClientRow] = field(default_factory=list)
    active_count: int = 0


def _local(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(_TZ)


def _is_same_day(a: datetime | None, b: datetime) -> bool:
    a = _local(a)
    return a is not None and a.date() == b.date()


def _in_week(dt: datetime | None, week_start: datetime) -> bool:
    """True if dt is within [week_start, week_start + 7d)."""
    dt = _local(dt)
    if dt is None:
        return False
    return week_start <= dt < week_start + timedelta(days=7)


def _imperativeness_rank(t: Task) -> tuple[int, float]:
    """Sort key: lower is higher priority. Critical → Important → Quick Task → null."""
    order = {"Criticial": 0, "Critical": 0, "High Importance": 1, "Important": 2, "Quick Task": 3}
    return (order.get(t.imperativeness or "", 99), -(t.impact or 0))


def compute(
    tasks: list[Task], clients: list[ClientRow], leads: list[Lead], now: datetime | None = None
) -> Metrics:
    now = now or datetime.now(_TZ)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    tomorrow_start = today_start + timedelta(days=1)
    day_after = tomorrow_start + timedelta(days=1)
    this_week_start = today_start - timedelta(days=today_start.weekday())  # Monday
    last_week_start = this_week_start - timedelta(days=7)

    m = Metrics()

    # --- Tasks ---
    completed_today_tasks: list[Task] = []
    for t in tasks:
        if _is_same_day(t.completed, today_start):
            m.tasks_completed_today += 1
            completed_today_tasks.append(t)
        if _is_same_day(t.completed, yesterday_start):
            m.tasks_completed_yesterday += 1
        if _is_same_day(t.due, today_start):
            m.tasks_due_today += 1
        if _is_same_day(t.due, tomorrow_start):
            m.tasks_tomorrow += 1
        if t.completed is None and t.due is not None and _local(t.due) < today_start:
            m.tasks_overdue += 1

    m.tasks_planned_today = m.tasks_due_today + m.tasks_completed_today

    open_today = [
        t for t in tasks
        if t.completed is None and _is_same_day(t.due, today_start)
    ]
    open_today.sort(key=_imperativeness_rank)
    m.top_today = open_today[:5]

    if completed_today_tasks:
        completed_today_tasks.sort(key=lambda t: -(t.impact or 0))
        m.top_win_today = completed_today_tasks[0].title

    # --- Pipeline (leads + clients) ---
    # A booking = a Lead transitioning to a paid/won state this week, OR a new Client created this week.
    paying_lead_status = {"Paid", "Client", "Sent invoice ", "Sent invoice"}
    for ld in leads:
        relevant_date = ld.paid_date or ld.confirmation_date
        if ld.status in paying_lead_status:
            if _in_week(relevant_date, this_week_start):
                m.bookings_this_week += 1
            if _in_week(relevant_date, last_week_start):
                m.bookings_last_week += 1
            if _is_same_day(relevant_date, today_start):
                m.bookings_today += 1

    m.bookings_delta = m.bookings_this_week - m.bookings_last_week

    # MRR sum across active/won clients
    mrr_values = [c.mrr for c in clients if c.status in {"Active", "Won"} and c.mrr]
    if mrr_values:
        m.mrr_total = float(sum(mrr_values))

    # --- Client health ---
    active_clients = [c for c in clients if c.status in {"Active", "Won"}]
    m.active_count = len(active_clients)

    # Happiness pulls from BOTH databases — Clients DB happiness is the new field,
    # Leads + Clients DB has historical happiness values too.
    happiness_vals: list[float] = []
    for c in active_clients:
        if c.happiness is not None:
            happiness_vals.append(c.happiness)
    for ld in leads:
        # Only count happiness for actual paying clients in the legacy DB.
        if ld.status in paying_lead_status and ld.happiness is not None:
            happiness_vals.append(ld.happiness)
    if happiness_vals:
        m.happiness_avg = sum(happiness_vals) / len(happiness_vals)
        m.happiness_n = len(happiness_vals)

    promise_vals = [c.promise_pct for c in active_clients if c.promise_pct is not None]
    if promise_vals:
        # Notion percent_not_empty rollups come back as 0–1 floats. Normalise to 0–100.
        norm = [v * 100 if v <= 1 else v for v in promise_vals]
        m.promise_score = sum(norm) / len(norm)

    m.at_risk = [
        c for c in clients
        if c.churn_risk and c.churn_risk.startswith("🔴")
        and c.status in {"Active", "Won", "Paused"}
    ]
    m.at_risk.sort(key=lambda c: -(c.days_since_contact or 0))

    return m
