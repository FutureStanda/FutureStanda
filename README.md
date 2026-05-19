# FutureStanda Business OS

Twice-daily Telegram reports + layered automations on top of a Notion
agency CRM. Reads tasks, clients, bookings, happiness and promise-fulfilment
from Notion, computes the metrics that actually matter, asks Claude for a
3-sentence "how you're doing + do this next" read, and POSTs to your
Telegram channel.

## What gets sent

**Morning (07:00 IST)**

```
☀️ Morning · Mon 19 May

📋 Tasks  3 done yesterday · 4 due today · 1 overdue
💰 Pipeline  2 bookings this week (+1 vs last) · MRR €3,994
😊 Happiness  7.8/10 avg (4 rated)
🤝 Promise score  72%
🚨 At risk  Azaan

🎯 Top 3 today
1. Send Azaan Loom (Critical · Impact 9)
2. Close 3 open proposals (Critical · Impact 10)
3. Post VA ad (High · Impact 8)

🧠 Read
Pipeline healthy, delivery slipping. Azaan stale 9d again — pattern.
Do this next: Send Azaan's Loom before 11am.
```

**Evening (20:00 IST)** — today's actuals: done vs planned, top win, what
slipped, tomorrow preview.

**Layered automations** — `invoice_chase`, `stage_stuck`, `happiness_pulse`
ping daily; `churn_watcher` runs every few hours and alerts on newly-at-risk
clients; `coach_writer` writes 3-5 fresh tasks into Notion every Monday;
`weekly_recap` ships every Sunday evening.

## One-time setup

### 1. Telegram bot + channel

1. DM `@BotFather` on Telegram → `/newbot` → save the **bot token**.
2. Create a private channel called **Business reports** (any name works).
3. Add your bot to the channel as an **Administrator**, with the *Post
   Messages* permission.
4. **Post any message** in the channel from your own account (this seeds an
   update so the bot can see the channel).
5. Locally: `export TELEGRAM_BOT_TOKEN=…` then `python scripts/get_chat_id.py`.
   It prints something like `chat_id=-1001234567890`. Save that as your
   `TELEGRAM_CHAT_ID`.

### 2. Notion internal integration

1. notion.so → ⚙ Settings → Integrations → **Develop or manage integrations**
   → New internal integration.
2. Copy the secret. This is your `NOTION_TOKEN`.
3. **Share the databases with the integration:** open each one and use
   ··· → Connections → add your integration.
   Required: **Business Tasks**, **Clients**, **Leads + Clients**.

### 3. Anthropic API key

1. console.anthropic.com → API keys → Create.
2. Save as `ANTHROPIC_API_KEY`.

### 4. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions → New repository secret.
Add all four:

| Secret | Value |
| --- | --- |
| `NOTION_TOKEN` | from step 2 |
| `TELEGRAM_BOT_TOKEN` | from step 1 |
| `TELEGRAM_CHAT_ID` | from step 1 |
| `ANTHROPIC_API_KEY` | from step 3 |

### 5. Trigger the first run

Repo → Actions → **Business report** → Run workflow → choose mode →
confirm a message lands in the channel.

After that, cron fires automatically at 06:00 + 19:00 UTC (= 07/20 IST in
summer, 06/19 in winter — accepting the 1-hour winter drift).

## Local development

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in real values
set -a; source .env; set +a

# Dry-run prints to stdout, doesn't hit Telegram.
python -m src.main --mode morning --dry-run
python -m src.main --mode evening --dry-run

# Live run sends to the channel.
python -m src.main --mode morning

# Automations — each takes --dry-run.
python -m src.automations.invoice_chase --dry-run
python -m src.automations.stage_stuck --dry-run
python -m src.automations.happiness_pulse --dry-run
python -m src.automations.churn_watcher --dry-run
python -m src.automations.weekly_recap --dry-run
python -m src.automations.coach_writer --dry-run
```

## Notion schema this bot reads

Three data sources (UUIDs hard-coded in `src/notion_api.py`):

- **Business Tasks** (`1bce1db9-1ca2-81c0-b918-000bd3d7c1f6`) — `Task` (title),
  `Due Time`, `Completed Time`, `Impact (1-10)`, `Imperativeness`, `Source`,
  `Why this matters`, `Status`, `Client` (relation).
- **Clients** (`5a9a8881-f049-4b37-9454-db3968cb9d5a`) — `Business Name`,
  `Status`, `Onboarding Stage`, `Happiness scale`, `MRR €`, `Health`,
  `Days Since Contact`, `Last Contact`, `Churn Risk`, `Promise Fulfilment %`,
  `Tasks` (relation).
- **Leads + Clients** (`32ae1db9-1ca2-81f2-a69d-000b442454ed`) — `Business Name`,
  `Status` (Paid / Sent invoice / Canceled / etc.), `Pipeline Stage`,
  `Amount €`, `Happiness scale`, `Confirmation Date`, `Paid Invoice date`.

If you rename a property, update the matching `_prop(page, "Name")` call in
`src/notion_api.py`.

## Architecture

```
GitHub Actions cron (06/19 UTC)
        │
        ▼
src/main.py --mode {morning|evening}
        │
        ├─ src/notion_api.py    ── pulls Tasks, Clients, Leads
        ├─ src/metrics.py       ── completion %, bookings, happiness, promise
        ├─ src/analyze.py       ── Claude Haiku 4.5 (cached system prompt)
        ├─ src/format.py        ── MarkdownV2 with proper escaping
        └─ src/telegram.py      ── POST sendMessage

Independent automations live under src/automations/* and follow the same
pattern (fetch → filter → format → send), each with its own cron entry.
State (e.g. seen at-risk clients) is JSON in `.state/` committed by CI.
```

## Roadmap

- Migrate the 25+ rows in `Leads + Clients` into the canonical `Clients` DB
  (currently the bot reads both — clean but the separation is a vestige).
- Webhook ingestion: Cal.com → new booking, Stripe → paid invoice,
  WhatsApp → conversation log. Would replace the manual logging steps.
- A `weekly_strategy` automation that reviews objectives vs progress and
  suggests pivots, not just tasks.
