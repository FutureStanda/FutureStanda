/**
 * Twilio SMS channel adapter.
 *
 * Inbound webhook (Twilio → us, POST /sms):
 *   Twilio sends application/x-www-form-urlencoded with From, To, Body, MessageSid
 *   We reply with TwiML <Response><Message>…</Message></Response> for an instant
 *   send-back (no second API call needed).
 *
 * Outbound (proactive — first message to a brand-new lead from web form):
 *   POST to Twilio's Messages API with basic auth.
 */

import { findLeadByPhone, createLead, getConversationLog, getBotState, updateLeadAfterTurn } from "../notion.js";
import { runAgent, resolveClient } from "../agent.js";
import { telegramAlert } from "../telegram.js";

const TIMESTAMP = () => new Date().toISOString().replace("T", " ").slice(0, 16);

/**
 * Send an SMS via the Twilio REST API. Used for proactive first messages
 * (web-form lead → bot opens conversation).
 */
export async function sendSms(env, { to, body }) {
  const auth = "Basic " + btoa(`${env.TWILIO_ACCOUNT_SID.trim()}:${env.TWILIO_AUTH_TOKEN.trim()}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID.trim()}/Messages.json`;
  const form = new URLSearchParams();
  form.set("From", env.TWILIO_NUMBER.trim());
  form.set("To", to);
  form.set("Body", body);
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error("Twilio send failed:", resp.status, err);
    throw new Error(`Twilio ${resp.status}`);
  }
  return resp.json();
}

/**
 * Inbound SMS webhook handler.
 * Twilio retries if we take > 15s, so we MUST return TwiML fast.
 */
export async function handleInboundSms(request, env, ctx) {
  const form = await request.formData();
  const from = form.get("From");
  const body = (form.get("Body") || "").toString().trim();

  if (!from || !body) return twiml(""); // nothing to do

  // Find or create the lead row.
  let lead = await findLeadByPhone(env, from);
  if (!lead) {
    lead = await createLead(env, { phone: from, channel: "📱 SMS", name: null });
  }

  // Pull existing state.
  const log = getConversationLog(lead);
  const botState = getBotState(lead);
  const client = resolveClient({ to: form.get("To"), from });

  // Run the agent.
  const agentResult = await runAgent(env, {
    client,
    conversationLog: log,
    botState,
    inboundMessage: body,
  });

  const newLines = [
    log,
    `[${TIMESTAMP()}] LEAD: ${body}`,
    `[${TIMESTAMP()}] BOT: ${agentResult.reply}`,
  ].filter(Boolean).join("\n");

  // Persist (don't await for the response itself — but Workers exit before promises
  // resolve unless we ctx.waitUntil)
  ctx.waitUntil(updateLeadAfterTurn(env, lead.id, {
    append: newLines,
    qualifiedScore: agentResult.qualifiedScore,
    botState: { ...botState, ...agentResult.stateUpdate },
    needsHuman: agentResult.needsHuman,
    pipelineStage: agentResult.pipelineStage,
  }));

  // Alert human if the lead needs them (qualified or stuck).
  if (agentResult.needsHuman && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const summary = [
      "🔥 *Lead needs Azaan*",
      "",
      `Phone: \`${from}\``,
      `Score: ${agentResult.qualifiedScore ?? "?"}/100`,
      `Stage: ${agentResult.pipelineStage || "?"}`,
      "",
      "Last message:",
      `> ${body}`,
      "",
      "Bot reply:",
      `> ${agentResult.reply}`,
    ].join("\n");
    ctx.waitUntil(telegramAlert(env, summary));
  }

  return twiml(agentResult.reply);
}

function twiml(message) {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(xml, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
