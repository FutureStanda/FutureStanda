/**
 * Vapi voice channel adapter.
 *
 * Vapi handles the actual voice call (STT + TTS + LLM loop) on their side.
 * Configure the Vapi assistant via their dashboard with a system prompt
 * matching agent.js (Vapi can't call our agent live — too slow for a phone call).
 *
 * What we receive:
 *   - "end-of-call-report" webhook with the full transcript + structured
 *     extracted data (their assistant.functions can populate this)
 *   - Optional: function-call webhooks during the call (e.g. "book_slot")
 *
 * What we do:
 *   - Create/update the Lead row in Notion with the transcript
 *   - Fire Telegram alert to Azaan with the structured summary
 */

import { findLeadByPhone, createLead, updateLeadAfterTurn } from "../notion.js";
import { telegramAlert } from "../telegram.js";

const TIMESTAMP = () => new Date().toISOString().replace("T", " ").slice(0, 16);

export async function handleVoiceWebhook(request, env, ctx) {
  let payload;
  try { payload = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

  // Vapi wraps everything in a "message" envelope. Different event types
  // come through this same endpoint.
  const msg = payload.message || payload;
  const type = msg.type;

  if (type === "end-of-call-report") {
    return handleEndOfCall(msg, env, ctx);
  }
  if (type === "function-call" || type === "tool-calls") {
    // Reserved for future: book_slot, qualify_lead etc.
    return new Response(JSON.stringify({ result: "ok" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  // Any other event — Vapi heartbeats etc. — ack with 200.
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function handleEndOfCall(msg, env, ctx) {
  const call = msg.call || {};
  const customer = call.customer || msg.customer || {};
  const phone = customer.number || call.from || "unknown";

  // Vapi gives us either transcript (raw) or messages (array of {role, message}).
  const transcript = msg.transcript
    || (Array.isArray(msg.messages)
        ? msg.messages.map((m) => `${(m.role || "?").toUpperCase()}: ${m.message || m.content || ""}`).join("\n")
        : "");

  // Structured extraction from analysis (if the assistant has structuredDataSchema set).
  const analysis = msg.analysis || {};
  const extracted = analysis.structuredData || {};
  const summary = analysis.summary || "";
  const score = Number.isFinite(extracted.qualified_score) ? extracted.qualified_score : null;
  const stage = extracted.pipeline_stage || (score !== null && score >= 61 ? "👋 Qualified" : "☎️ Contacted");

  // Find or create lead
  let lead = phone !== "unknown" ? await findLeadByPhone(env, phone) : null;
  if (!lead && phone !== "unknown") {
    lead = await createLead(env, {
      phone,
      channel: "📞 Voice",
      name: customer.name || extracted.name || null,
      projectType: extracted.project_type,
      postcode: extracted.postcode,
    });
  }

  if (lead) {
    const logBlock = [
      `[${TIMESTAMP()}] VOICE CALL — ${(call.endedReason || "completed")}`,
      summary ? `Summary: ${summary}` : null,
      "Transcript:",
      transcript,
    ].filter(Boolean).join("\n");

    ctx.waitUntil(updateLeadAfterTurn(env, lead.id, {
      append: logBlock,
      qualifiedScore: score,
      botState: extracted,
      needsHuman: score !== null && score >= 61,
      pipelineStage: stage,
    }));
  }

  // Always ping Azaan with the call result.
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const human = score !== null && score >= 61;
    ctx.waitUntil(telegramAlert(env, [
      human ? "🔥 *Voice call — qualified lead*" : "📞 *Voice call ended*",
      "",
      `Phone: \`${phone}\``,
      `Score: ${score ?? "?"}/100`,
      `Stage: ${stage}`,
      "",
      summary ? `Summary: ${summary.slice(0, 400)}` : "(no summary)",
    ].join("\n")));
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
