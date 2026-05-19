/**
 * Notion helpers for the Cloudflare Worker.
 *
 * Workers run V8, not Node — so no notion-client SDK. We hit the REST API
 * directly via fetch.
 */

const NOTION_VERSION = "2022-06-28";
const LEADS_DB_ID = "32ae1db9-1ca2-8186-8869-c258c57219aa";

async function notionFetch(env, path, init = {}) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN.trim()}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Notion ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Look up a lead row by phone number (E.164 format). Returns the page object
 * or null if no match. Phone normalisation: strip whitespace + dashes.
 */
export async function findLeadByPhone(env, phone) {
  const normalized = phone.replace(/[\s\-]/g, "");
  const data = await notionFetch(env, `/databases/${LEADS_DB_ID}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Phone Number", phone_number: { equals: normalized } },
      page_size: 1,
    }),
  });
  return data.results[0] || null;
}

/**
 * Create a brand-new lead row.
 */
export async function createLead(env, { name, phone, channel, sourceSlug, projectType, postcode }) {
  const props = {
    "Business Name": {
      title: [{ text: { content: `${name || "Unknown"} (${channel})` } }],
    },
    "Contact Full Name": name ? { rich_text: [{ text: { content: name } }] } : undefined,
    "Phone Number": phone ? { phone_number: phone } : undefined,
    "Channel": { select: { name: channel } },
    "Pipeline Stage": { select: { name: "🥶 Cold" } },
    "Last Contact": { date: { start: new Date().toISOString().split("T")[0] } },
  };
  if (projectType || sourceSlug || postcode) {
    const info = [
      sourceSlug ? `Source: ${sourceSlug}` : null,
      projectType ? `Project: ${projectType}` : null,
      postcode ? `Postcode: ${postcode}` : null,
      `Created: ${new Date().toISOString()}`,
    ].filter(Boolean).join("\n");
    props["Additional info"] = { rich_text: [{ text: { content: info } }] };
  }

  // Strip undefined values — Notion rejects them.
  for (const k of Object.keys(props)) if (props[k] === undefined) delete props[k];

  const page = await notionFetch(env, `/pages`, {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: LEADS_DB_ID },
      properties: props,
    }),
  });
  return page;
}

/**
 * Get the text content of a rich_text or title property as a single string.
 */
function readText(prop) {
  if (!prop) return "";
  const items = prop.rich_text || prop.title || [];
  return items.map((p) => p.plain_text || "").join("");
}

export function getConversationLog(leadPage) {
  return readText(leadPage.properties["Conversation Log"]);
}

export function getBotState(leadPage) {
  const raw = readText(leadPage.properties["Bot State"]);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/**
 * Append to the conversation log + persist score / state.
 * Keeps the log capped at 8000 chars (rolling).
 */
export async function updateLeadAfterTurn(env, leadId, { append, qualifiedScore, botState, needsHuman, pipelineStage }) {
  // Read current log to append, but we don't want a round-trip — pass `append`
  // as the NEW lines and overwrite. Caller is responsible for tracking the prefix.
  const props = {};
  if (append !== undefined) {
    // Cap to 1900 chars per text block (Notion limit 2000)
    const truncated = append.length > 1900 ? append.slice(-1900) : append;
    props["Conversation Log"] = { rich_text: [{ text: { content: truncated } }] };
  }
  if (qualifiedScore !== undefined && qualifiedScore !== null) {
    props["Qualified Score"] = { number: qualifiedScore };
  }
  if (botState !== undefined) {
    props["Bot State"] = { rich_text: [{ text: { content: JSON.stringify(botState).slice(0, 1900) } }] };
  }
  if (needsHuman !== undefined) {
    props["Needs Human"] = { checkbox: !!needsHuman };
  }
  if (pipelineStage !== undefined) {
    props["Pipeline Stage"] = { select: { name: pipelineStage } };
  }
  props["Last Bot Message"] = { date: { start: new Date().toISOString().split("T")[0] } };
  props["Last Contact"] = { date: { start: new Date().toISOString().split("T")[0] } };

  await notionFetch(env, `/pages/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties: props }),
  });
}
