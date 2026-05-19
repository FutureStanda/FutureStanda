# FutureStanda Receptionist Worker

Cloudflare Worker that runs the AI Lead Receptionist + Lead-form relay.

## What it does

- `POST /leads` — landing-page form intake. Creates a Notion lead row,
  fires a proactive SMS to the lead opening the conversation, and pings
  Azaan via Telegram.
- `POST /sms` — Twilio inbound SMS webhook. Looks up the lead in Notion,
  runs the Claude-driven agent, replies via TwiML.
- `POST /whatsapp` — same as SMS but for WhatsApp.
- `POST /voice` — Vapi.ai end-of-call webhook. Stores the transcript +
  structured-data summary in Notion, pings Azaan if qualified.
- `POST /health` — for uptime monitoring.

## Architecture

```
landing page form
       │
       ▼
POST /leads ──► Notion lead row ──► first SMS to lead ──► Telegram alert
                                  ▲                       ▲
                                  │                       │
                  ┌───────────────┼───────────────────────┘
                  │
SMS / WhatsApp / Voice (Vapi) inbound webhook
                  │
                  ▼
        runAgent (Claude Haiku)
            (channel-agnostic — same brain, same Notion state)
                  │
                  ▼
        TwiML reply (or update Notion + Telegram for voice)
```

## Deploy

```bash
cd worker
npm install
npx wrangler login           # one-time
npx wrangler deploy
```

After deploy, set secrets:

```bash
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_NUMBER          # +353871234567
npx wrangler secret put TWILIO_WHATSAPP_NUMBER # leave blank if WA not ready
```

Worker URL will be something like `https://futurestanda-receptionist.YOUR-SUBDOMAIN.workers.dev`.

## Wire up Twilio

1. Console → **Phone Numbers** → your Irish number → **Messaging** → "A MESSAGE COMES IN":
   - Webhook: `https://futurestanda-receptionist.YOUR-SUBDOMAIN.workers.dev/sms`
   - Method: POST
2. **Voice** section → "A CALL COMES IN":
   - Either forward to Azaan's mobile (no AI yet)
   - Or point to Vapi's inbound webhook (see Vapi setup below)

## Wire up WhatsApp (sandbox first, production later)

1. Twilio Console → **Messaging** → **Try it out** → **WhatsApp** sandbox
2. Set the sandbox webhook to:
   `https://futurestanda-receptionist.YOUR-SUBDOMAIN.workers.dev/whatsapp`
3. Send `join <your-sandbox-keyword>` from your phone to test
4. When Meta approves the production sender (1–2 weeks), repeat with the live number

## Wire up Vapi (voice AI)

1. vapi.ai → Dashboard → **Assistants** → New
2. Model: Claude Haiku 4.5 (or GPT-4o, whichever Vapi supports — quality is the priority over cost on voice)
3. System prompt: paste from `worker/src/agent.js` (`SYSTEM_PROMPT_TEMPLATE` with `{business_name}=Deluxe Builders`, etc.)
4. Voice: pick a friendly Irish/British voice
5. **Server URL** (for end-of-call webhooks):
   `https://futurestanda-receptionist.YOUR-SUBDOMAIN.workers.dev/voice`
6. **End-of-call report** → enable; set **Structured Data Schema** to:
   ```json
   {
     "type": "object",
     "properties": {
       "qualified_score": { "type": "integer", "minimum": 0, "maximum": 100 },
       "pipeline_stage": { "type": "string" },
       "postcode": { "type": "string" },
       "project_type": { "type": "string" },
       "timeline": { "type": "string" },
       "budget_signal": { "type": "string" },
       "needs_human": { "type": "boolean" }
     }
   }
   ```
7. Buy a Vapi phone number (or import a Twilio number). Forward Azaan's
   missed-calls to it.

## Test locally

```bash
npx wrangler dev
# In another terminal — fake a Twilio inbound SMS:
curl -X POST http://localhost:8787/sms \
  -d "From=+353871234567" \
  -d "To=+353877654321" \
  -d "Body=Hi, need a quote for a kitchen extension in D14"
```

## Cost ballpark (per 100 conversations of ~6 turns)

| Component | Cost |
| --- | --- |
| Cloudflare Worker | ~free (100K req/day free tier) |
| Claude Haiku (600 input + 200 output × 6 turns × 100) | ~€0.30 |
| Twilio SMS inbound (free) + outbound (€0.04 × 6 × 100) | ~€24 |
| Twilio number rental | ~€1/mo |
| Vapi voice (~3 min/call × €0.10 × 50 calls) | ~€15 |

So roughly €40/mo for 100 SMS conversations + 50 voice calls. Justified
at any close rate above 1% on €5K+ jobs.
