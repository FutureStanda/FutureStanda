/**
 * Cloudflare Worker — FutureStanda receptionist + lead relay.
 *
 * Routes:
 *   POST /leads      — landing-page form submissions (existing)
 *   POST /sms        — Twilio inbound SMS webhook
 *   POST /whatsapp   — Twilio inbound WhatsApp webhook
 *   POST /voice      — Vapi call-event webhook (end-of-call mostly)
 *
 * Deploy:
 *   cd worker
 *   npx wrangler deploy
 *
 * Secrets (npx wrangler secret put <NAME>):
 *   NOTION_TOKEN              — same as the GitHub Action's secret
 *   ANTHROPIC_API_KEY         — for the agent (Claude Haiku)
 *   TELEGRAM_BOT_TOKEN        — for instant lead alerts
 *   TELEGRAM_CHAT_ID          — Business Reports channel
 *   TWILIO_ACCOUNT_SID        — from console.twilio.com
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_NUMBER             — E.164, e.g. +353871234567 (your Irish SMS number)
 *   TWILIO_WHATSAPP_NUMBER    — E.164 of WhatsApp sender (sandbox or production)
 *
 * Plain vars (wrangler.toml [vars]):
 *   THANK_YOU_URL             — where the lead form redirects after success
 *   ALLOWED_ORIGINS           — comma-separated origins for CORS
 */

import { sendSms, handleInboundSms } from "./channels/sms.js";
import { handleInboundWhatsApp } from "./channels/whatsapp.js";
import { handleVoiceWebhook } from "./channels/voice.js";
import { createLead, findLeadByPhone, updateLeadAfterTurn, getConversationLog, getBotState } from "./notion.js";
import { runAgent, resolveClient } from "./agent.js";
import { telegramAlert, escapeMd } from "./telegram.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight for the lead form
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/sms" && request.method === "POST") {
      return handleInboundSms(request, env, ctx);
    }
    if (url.pathname === "/whatsapp" && request.method === "POST") {
      return handleInboundWhatsApp(request, env, ctx);
    }
    if (url.pathname === "/voice" && request.method === "POST") {
      return handleVoiceWebhook(request, env, ctx);
    }
    if ((url.pathname === "/leads" || url.pathname === "/submit") && request.method === "POST") {
      return handleLeadForm(request, env, ctx);
    }
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  },
};

/**
 * Lead-form handler. Receives a POST from a landing page, creates the lead
 * row in Notion, fires the agent's FIRST proactive SMS to the lead, and
 * pings Azaan via Telegram.
 */
async function handleLeadForm(request, env, ctx) {
  let data;
  const ct = request.headers.get("content-type") || "";
  try {
    data = ct.includes("application/json")
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Honeypot
  if (data.website) return new Response("OK", { status: 200, headers: corsHeaders(request, env) });

  if (!data.name || !data.phone) {
    return new Response("Missing required fields", { status: 400, headers: corsHeaders(request, env) });
  }

  const phone = data.phone.replace(/[\s\-]/g, "");
  const slug = data.client_slug || "unknown";

  // Find or create the lead — landing-page submissions might be from a returning lead.
  let lead = await findLeadByPhone(env, phone);
  if (!lead) {
    lead = await createLead(env, {
      name: data.name,
      phone,
      channel: "🌐 Web Form",
      sourceSlug: slug,
      projectType: data.project_type,
      postcode: data.postcode,
    });
  }

  // Fire the agent's first proactive message — feed in the form data as "context"
  // so the agent doesn't ask things they already filled in.
  const client = resolveClient({ slug });
  const initialContext = [
    `Lead submitted form. Captured already:`,
    `- Name: ${data.name}`,
    `- Phone: ${phone}`,
    data.postcode ? `- Postcode: ${data.postcode}` : null,
    data.project_type ? `- Project type: ${data.project_type}` : null,
    "",
    "Send a warm opening SMS that acknowledges what they submitted (don't re-ask), then move to the next qualifying question.",
  ].filter(Boolean).join("\n");

  const agentResult = await runAgent(env, {
    client,
    conversationLog: "",
    botState: { name: data.name, postcode: data.postcode, project_type: data.project_type },
    inboundMessage: initialContext,
  });

  // Save to Notion + send the SMS in parallel.
  const TIMESTAMP = new Date().toISOString().replace("T", " ").slice(0, 16);
  const log = [
    `[${TIMESTAMP}] FORM: name=${data.name}, postcode=${data.postcode || "?"}, project=${data.project_type || "?"}`,
    `[${TIMESTAMP}] BOT (SMS): ${agentResult.reply}`,
  ].join("\n");

  ctx.waitUntil(updateLeadAfterTurn(env, lead.id, {
    append: log,
    qualifiedScore: agentResult.qualifiedScore,
    botState: { name: data.name, postcode: data.postcode, project_type: data.project_type, ...agentResult.stateUpdate },
    needsHuman: agentResult.needsHuman,
    pipelineStage: agentResult.pipelineStage || "☎️ Contacted",
  }));

  // Send the SMS (if Twilio's configured) — best-effort
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_NUMBER && phone.startsWith("+")) {
    ctx.waitUntil(sendSms(env, { to: phone, body: agentResult.reply }).catch((e) => console.error("SMS send failed:", e)));
  }

  // Ping Azaan via Telegram immediately
  ctx.waitUntil(telegramAlert(env, [
    "🎯 *New web-form lead*",
    "",
    `*Name:* ${escapeMd(data.name)}`,
    `*Phone:* ${escapeMd(phone)}`,
    `*Postcode:* ${escapeMd(data.postcode || "—")}`,
    `*Project:* ${escapeMd(data.project_type || "—")}`,
    "",
    `Bot sent: _${escapeMd(agentResult.reply.slice(0, 200))}_`,
    "",
    "_Call within 5 minutes for 21× higher conversion\\._",
  ].join("\n")));

  // Respond to the caller (landing page or fetch)
  if (ct.includes("application/json")) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(request, env) },
    });
  }
  return Response.redirect(env.THANK_YOU_URL || "/thank-you", 303);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  const allow = allowed.includes("*") || allowed.includes(origin) ? origin || "*" : allowed[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
