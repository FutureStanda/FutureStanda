/**
 * Channel-agnostic AI receptionist.
 *
 * Inputs: a Lead's existing state (conversation log + bot state + client config)
 *         + the new inbound message
 * Output: { reply, qualifiedScore, botState, needsHuman, pipelineStage }
 *
 * Same brain, three channel adapters (SMS / WhatsApp / Voice) call this.
 */

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

/**
 * Per-client config. Each client (Azaan / future) gets their own block.
 * Lookup key = the channel-identifying property (Twilio number that received
 * the SMS, Vapi assistant ID for voice, etc.).
 */
export const CLIENTS = {
  // Default — Azaan @ Deluxe Builders
  default: {
    business_name: "Deluxe Builders",
    contact_name: "Azaan",
    service_summary:
      "Fixed-price Dublin house extensions (single-storey, two-storey, kitchen, attic, side return). 48-hour quote turnaround. Written warranty. Weekly photo updates from build start to handover.",
    qualifying_questions: [
      "What postcode is the property in?",
      "What type of extension (kitchen, side return, two-storey, etc.)?",
      "Roughly what size in m² do you have in mind, or how many extra rooms?",
      "When are you hoping to start — within 3 months, 6 months, longer?",
      "Have you got planning permission in place, or do you need help with that?",
    ],
    out_of_scope: [
      "We don't do new builds from scratch — only extensions and full renovations.",
      "We don't quote sight-unseen — Azaan needs to do a quick site visit to give a fixed price.",
      "We work Dublin and the M50 belt — outside that, depends on the job.",
    ],
    booking_link: "https://cal.com/deluxe-builders/site-visit",
    handoff_message:
      "Brilliant — I've got everything I need. Azaan will phone you within 2 working hours to lock in a site visit. You'll get a fixed-price quote within 48 hours of that visit.",
  },
};

/**
 * Get the client config that matches an inbound message.
 * For now: single-tenant — always return Azaan/Deluxe. When we onboard
 * client #2, we'll key off the Twilio `To` number / Vapi assistant ID.
 */
export function resolveClient(_inbound) {
  return CLIENTS.default;
}

const SYSTEM_PROMPT_TEMPLATE = `You are the AI receptionist for {business_name}. The owner is {contact_name}. Your job: instantly engage every inbound lead, qualify them in 4–6 short messages, then hand off to {contact_name} for the actual quote.

WHO YOU REPRESENT
{business_name} — {service_summary}

YOUR JOB IN ORDER
1. Warm acknowledgement (1 sentence — sound like a real person, not a corporate bot).
2. Gather these qualifying details — ask ONE question per message, never a wall:
{qualifying_questions}
3. If they're a fit (postcode in service area, realistic timeline, scope we serve), hand off:
"{handoff_message}"
4. If out of scope, politely explain why and offer a referral if possible:
{out_of_scope}

TONE
- Warm, blunt, Irish-builder-friendly. No corporate-speak. No "absolutely!". No emojis.
- Short messages — 1-2 sentences max. SMS-length.
- Use the lead's name once you have it. Use {contact_name}'s name once.
- Never make up information. If you don't know something, say "I'll get {contact_name} to confirm that on the call."

OUTPUT FORMAT
You MUST output strict JSON only, no prose, no markdown:
{
  "reply": "the SMS to send back, plain text, <= 320 chars",
  "qualified_score": <integer 0-100>,
  "needs_human": <boolean>,
  "pipeline_stage": "🥶 Cold" | "☎️ Contacted" | "👋 Qualified" | "📝 Proposal" | "😢 Lost",
  "state_update": { ... } // partial merge into bot_state JSON, capture anything useful (postcode, service, timeline, size, budget_signal)
}

SCORING GUIDE
- 0–30: tire-kicker / wrong area / unrealistic timeline
- 31–60: real but missing info, keep gathering
- 61–85: fit, ready to hand off to {contact_name}
- 86–100: hot — start within a month, planning in place, budget signals
Set "needs_human": true once score >= 61 OR if the lead is asking complex questions you can't answer.

PIPELINE STAGE
- Move to "☎️ Contacted" on first reply
- Move to "👋 Qualified" once score >= 61
- Move to "😢 Lost" only if they explicitly back out

NEVER quote a price. Always say "Azaan will give you a fixed-price quote within 48h of seeing the property."`;

function buildSystemPrompt(client) {
  return SYSTEM_PROMPT_TEMPLATE
    .replaceAll("{business_name}", client.business_name)
    .replaceAll("{contact_name}", client.contact_name)
    .replaceAll("{service_summary}", client.service_summary)
    .replaceAll("{qualifying_questions}", client.qualifying_questions.map((q, i) => `   ${i + 1}. ${q}`).join("\n"))
    .replaceAll("{handoff_message}", client.handoff_message)
    .replaceAll("{out_of_scope}", client.out_of_scope.map((s) => `   - ${s}`).join("\n"));
}

/**
 * Call Claude to decide what to say next.
 */
export async function runAgent(env, { client, conversationLog, botState, inboundMessage }) {
  const system = buildSystemPrompt(client);

  const userPrompt = [
    "Conversation so far:",
    conversationLog || "(no history yet — this is the first turn)",
    "",
    "Bot state (what's been captured):",
    JSON.stringify(botState || {}, null, 2),
    "",
    "New inbound message from lead:",
    inboundMessage,
    "",
    "Now: produce the JSON described in your system prompt.",
  ].join("\n");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY.trim(),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Claude API error:", resp.status, err);
    return fallbackResponse(inboundMessage);
  }

  const data = await resp.json();
  const text = (data.content || []).map((b) => b.text || "").join("").trim();
  return parseAgentOutput(text);
}

function parseAgentOutput(text) {
  // Strip markdown fences if Claude added them.
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  try {
    const parsed = JSON.parse(t);
    return {
      reply: String(parsed.reply || "").slice(0, 480),
      qualifiedScore: Number.isFinite(parsed.qualified_score) ? parsed.qualified_score : null,
      needsHuman: !!parsed.needs_human,
      pipelineStage: parsed.pipeline_stage || null,
      stateUpdate: parsed.state_update || {},
    };
  } catch (e) {
    console.error("Could not parse agent JSON:", t.slice(0, 200));
    return fallbackResponse("");
  }
}

function fallbackResponse(_inbound) {
  return {
    reply: "Cheers for the message — Azaan will phone you back within a couple of hours.",
    qualifiedScore: null,
    needsHuman: true,
    pipelineStage: "☎️ Contacted",
    stateUpdate: {},
  };
}
