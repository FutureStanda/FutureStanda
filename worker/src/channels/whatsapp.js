/**
 * Twilio WhatsApp channel adapter.
 *
 * Same API as SMS but `From` / `To` prefixed with "whatsapp:". Lead phone
 * numbers are stripped of the prefix before being stored in Notion.
 */

import { findLeadByPhone, createLead, getConversationLog, getBotState, updateLeadAfterTurn } from "../notion.js";
import { runAgent, resolveClient } from "../agent.js";
import { telegramAlert } from "../telegram.js";

const TIMESTAMP = () => new Date().toISOString().replace("T", " ").slice(0, 16);
const stripWa = (s) => (s || "").replace(/^whatsapp:/, "");

export async function sendWhatsApp(env, { to, body }) {
  const auth = "Basic " + btoa(`${env.TWILIO_ACCOUNT_SID.trim()}:${env.TWILIO_AUTH_TOKEN.trim()}`);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID.trim()}/Messages.json`;
  const form = new URLSearchParams();
  form.set("From", `whatsapp:${env.TWILIO_WHATSAPP_NUMBER.trim()}`);
  form.set("To", to.startsWith("whatsapp:") ? to : `whatsapp:${to}`);
  form.set("Body", body);
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!resp.ok) throw new Error(`Twilio WA ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

export async function handleInboundWhatsApp(request, env, ctx) {
  const form = await request.formData();
  const from = stripWa(form.get("From"));
  const body = (form.get("Body") || "").toString().trim();

  if (!from || !body) return twiml("");

  let lead = await findLeadByPhone(env, from);
  if (!lead) {
    lead = await createLead(env, { phone: from, channel: "💚 WhatsApp", name: null });
  }

  const log = getConversationLog(lead);
  const botState = getBotState(lead);
  const client = resolveClient({ to: stripWa(form.get("To")), from });

  const agentResult = await runAgent(env, {
    client,
    conversationLog: log,
    botState,
    inboundMessage: body,
  });

  const newLines = [
    log,
    `[${TIMESTAMP()}] LEAD (WA): ${body}`,
    `[${TIMESTAMP()}] BOT (WA): ${agentResult.reply}`,
  ].filter(Boolean).join("\n");

  ctx.waitUntil(updateLeadAfterTurn(env, lead.id, {
    append: newLines,
    qualifiedScore: agentResult.qualifiedScore,
    botState: { ...botState, ...agentResult.stateUpdate },
    needsHuman: agentResult.needsHuman,
    pipelineStage: agentResult.pipelineStage,
  }));

  if (agentResult.needsHuman && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    ctx.waitUntil(telegramAlert(env, [
      "🔥 *Lead needs Azaan (WhatsApp)*",
      "",
      `Phone: \`${from}\``,
      `Score: ${agentResult.qualifiedScore ?? "?"}/100`,
      `Stage: ${agentResult.pipelineStage || "?"}`,
      "",
      "Last message:",
      `> ${body}`,
    ].join("\n")));
  }

  return twiml(agentResult.reply);
}

function twiml(message) {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const xml = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response/>`;
  return new Response(xml, { status: 200, headers: { "Content-Type": "text/xml" } });
}
