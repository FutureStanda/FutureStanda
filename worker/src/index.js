/**
 * Lead-form relay Worker.
 *
 * Sits in front of every client landing page. Receives POST submissions from
 * the form, creates a row in the Leads + Clients Notion DB tagged with the
 * client_slug, and (if configured) pings the Business reports Telegram
 * channel so you know about the lead within seconds.
 *
 * Deploy:
 *   cd worker
 *   npx wrangler deploy
 *
 * Secrets (npx wrangler secret put <NAME>):
 *   NOTION_TOKEN          - same token as the bot uses
 *   LEADS_DB_ID           - the Leads + Clients database ID (32ae1db9-1ca2-81868869-c258c57219aa)
 *   TELEGRAM_BOT_TOKEN    - optional, enables instant lead-arrival ping
 *   TELEGRAM_CHAT_ID      - optional
 *
 * Plain env (wrangler.toml [vars]):
 *   THANK_YOU_URL         - where to redirect after success
 *   ALLOWED_ORIGINS       - comma-separated list of allowed Origin headers
 */

const NOTION_VERSION = "2022-06-28";

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let data;
    const ct = request.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        data = await request.json();
      } else {
        const form = await request.formData();
        data = Object.fromEntries(form);
      }
    } catch (e) {
      return new Response("Bad request", { status: 400 });
    }

    // Honeypot — if a hidden 'website' field is filled, drop silently.
    if (data.website) {
      return new Response("OK", { status: 200, headers: corsHeaders(request, env) });
    }

    if (!data.name || !data.phone) {
      return new Response("Missing required fields", {
        status: 400,
        headers: corsHeaders(request, env),
      });
    }

    const slug = data.client_slug || "unknown";
    const service = data.project_type || "—";
    const postcode = data.postcode || "";

    // 1. Create row in Leads + Clients DB
    const notionResp = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: env.LEADS_DB_ID },
        properties: {
          "Business Name": {
            title: [{ text: { content: `${data.name} (web lead)` } }],
          },
          "Contact Full Name": {
            rich_text: [{ text: { content: data.name } }],
          },
          "Phone Number": { phone_number: data.phone },
          "Full address": {
            rich_text: [{ text: { content: postcode } }],
          },
          "Additional info": {
            rich_text: [
              {
                text: {
                  content: `Source: ${slug} landing page. Service: ${service}. Submitted: ${new Date().toISOString()}`,
                },
              },
            ],
          },
          "Pipeline Stage": { select: { name: "🥶 Cold" } },
          "Last Contact": {
            date: { start: new Date().toISOString().split("T")[0] },
          },
        },
      }),
    });

    if (!notionResp.ok) {
      const errBody = await notionResp.text();
      console.error("Notion error:", notionResp.status, errBody);
      return new Response("Lead recording failed", {
        status: 502,
        headers: corsHeaders(request, env),
      });
    }

    // 2. Telegram ping (best-effort)
    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
      const msg =
        `🎯 *New lead — ${escapeMd(slug)}*\n\n` +
        `*Name:* ${escapeMd(data.name)}\n` +
        `*Phone:* ${escapeMd(data.phone)}\n` +
        `*Area:* ${escapeMd(postcode || "—")}\n` +
        `*Service:* ${escapeMd(service)}\n\n` +
        `_Call within 5 minutes for 21× higher conversion._`;
      // Don't await — fire and forget so the user gets their redirect fast.
      fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: "MarkdownV2",
          }),
        }
      ).catch((err) => console.error("Telegram error:", err));
    }

    // 3. Redirect on form submit, JSON on programmatic
    if (ct.includes("application/json")) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(request, env),
        },
      });
    }

    const thankYou = env.THANK_YOU_URL || "/thank-you";
    return Response.redirect(thankYou, 303);
  },
};

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

function escapeMd(s) {
  return String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");
}
