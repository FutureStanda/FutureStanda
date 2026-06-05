// Rich page content — block documents for the Notion-style editor.
// Each page: { theme:'paper'|'dark', icon, blocks:[ {id,type,html,...} ] }
// Block types: h1 h2 h3 text bullet numbered todo toggle callout quote divider subpage synced

window.BIZBOOST_PAGES = (() => {
  let n = 0;
  const uid = () => "b" + (++n) + "_" + Math.random().toString(36).slice(2, 6);

  // ---- synced blocks (edit once, updates everywhere) ----
  const synced = {
    "tone-cue": { color: "green", emoji: "🎙️", html: '<b>UP TONE</b> · <b>FAST PACE</b> — energy high, talk like you\'ve done this a thousand times.' },
    "guarantee": { color: "lime", emoji: "🛡️", html: '<b>The guarantee:</b> qualified enquiries in your dashboard within 14 days, or next month is free.' }
  };

  const C = (color, emoji, html) => ({ id: uid(), type: "callout", color, emoji, html });
  const T = (html) => ({ id: uid(), type: "text", html });
  const H = (type, html) => ({ id: uid(), type, html });
  const B = (html) => ({ id: uid(), type: "bullet", html });
  const TODO = (html, checked) => ({ id: uid(), type: "todo", checked: !!checked, html });
  const TOG = (html, body) => ({ id: uid(), type: "toggle", open: false, html, body });
  const SY = (syncId) => ({ id: uid(), type: "synced", syncId });
  const DIV = () => ({ id: uid(), type: "divider" });
  const RED = (t) => `<span style="color:var(--pg-red)">${t}</span>`;
  const GRN = (t) => `<span style="color:var(--pg-green)">${t}</span>`;
  const ORG = (t) => `<span style="color:var(--pg-amber)">${t}</span>`;

  // ============ COLD CALL SCRIPT ============
  const coldCall = {
    theme: "paper", icon: "📞",
    blocks: [
      C("amber", "🎯", "The goal of this call is <b>one thing</b>: book the discovery call. Don't sell the whole thing here — sell the next step."),

      H("h2", "1 · Introduction"),
      SY("tone-cue"),
      C("plain", "👋", `Hello <b>(Name)</b>, it's Bartek calling from BizBoost — how's everything going today?<br><br>That's good. Listen, I can see you've a lot of great reviews and people really rate your service — quick question though: would you be able to handle an extra 5 clients a month, or would that be too much?`),
      C("plain", "🚀", `100%, man — a lot of <b>(niche)</b> businesses say the same. So as I said, I'm calling from BizBoost, ${GRN("Ireland's leading full-scale agency")}. We're finalising our last few partnership spots for the year and looking to take <b>one</b> ${GRN("(niche)")} business in the <b>(area)</b> area. Before I tell you more — mind if I ask a couple of quick questions to see if we'd even be a good fit? You got a minute?`),

      H("h2", "2 · Qualifying questions"),
      T(`<i>Keep it brief — you respect their time. Shut up and let them answer.</i>`),
      B(`What does your current process for getting clients look like — mostly word of mouth, or something more active running?`),
      B(`Roughly how many jobs a month right now, and what's that translate to revenue-wise? Ballpark's fine.`),
      B(`When you get your <b>perfect</b> job — the client you'd take ten more of tomorrow — what does that look like?`),
      B(`Honestly, what's been the biggest thing slowing your growth — getting those extra clients consistently?`),
      B(`Is scaling genuinely a priority right now, or more of a 'someday' thing?`),
      TOG("▸ Bridge to the dream (say after they answer)", `"The businesses we work with that grow fastest aren't the ones who wait until everything's perfect. They're the ones who say 'I don't know exactly how this works yet, but I'll figure it out.' That's the biggest difference I see."`),
      C("amber", "💭", `Last question — <b>why</b> is this actually important to you? Why not just stay where you are and coast? ${RED("[LET HIM ANSWER. Shut up.]")} … "Yeah, but go deeper — what's the real reason? Who's it for?"`),

      H("h2", "3 · The transition"),
      T(`"Man, I love that answer — based on everything you've told me, I'm certain we can get you there faster than you think. So here's what I'll do…"`),
      C("plain", "📅", `Let me lock you in for a proper 30 minutes this week where I show you exactly what I'd build for <b>you</b> — competition pulled apart, Google presence audited, biggest constraints laid out and how we kill them. I've got ${ORG("[Day]")} or ${ORG("[Day]")} — does that work? Good, what's the best email to send the meeting link to?`),

      H("h2", "4 · How it works"),
      SY("tone-cue"),
      T(`"How it works is simple. <b>Step 1</b> — we give you your own dashboard: the command centre for your entire business. Every lead, every review, every answered or missed call, every booking, how your ads are doing — all in real time, and most of it handled automatically before you even look."`),
      C("plain", "📲", `So instead of missing a customer at 11am because you were busy — the conversation forwards to text, your agent replies instantly, asks a couple of questions and books them in. The appointment's booked before you even realise.`),
      T(`"We also build you a better-performing, better-looking website than anyone in your area — fast, automated, SEO-optimised — putting you top of Google with outstanding reviews. The only issue you'll have is too many high-paying customers. We'd all love that problem, right?"`),

      H("h2", "5 · The offer"),
      C("blue", "🧱", `Both options start with a one-time setup of <b>€298</b> — professional website, chatbot, booking system, Google set up properly, and your command centre. Your foundation, live within 3 days.`),
      H("h3", "Growth — €698/mo"),
      T(`We run your Facebook & Google ads and automate your entire follow-up — every enquiry responded to, qualified and booked instantly. Most see results inside 14 days.`),
      SY("guarantee"),
      H("h3", "Domination — €998/mo"),
      T(`Everything in Growth, plus more ad spend, social content 4×/week, email marketing, me as your dedicated account manager, and weekly reports & calls.`),
      C("lime", "🏆", `<b>The big guarantee:</b> a consistent flow of qualified [niche] enquiries within 90 days — or you don't pay monthly until you get it.`),
      T(`"Either way you get the live dashboard, full transparency, 30-day money-back, no contracts, zero hidden costs. Based on everything you told me — I'd put you on <b>Domination</b>. It's the only one where I personally guarantee the flow of enquiries, or I don't get paid. Fair enough?"`),

      H("h2", "6 · Objection handling"),
      TOG("▸ \"It's too much / more than I expected\"", `What costs more — staying stuck while competitors who took action outpace you, or this small cost now to grow more than ever? When you look at it that way the cost gets smaller, right? But let's start you on the foundation at €298 and step up when you're ready.`),
      TOG("▸ \"I need to think about it\"", `Totally fair. Just so I've done my job — when you say think about it, is it the investment, the timing, or whether it'll actually work for you specifically? Usually it's one of those three. [Let them name the real one, then handle THAT.]`),
      TOG("▸ \"I need to talk to my partner\"", `Of course. Quick question though — if it were entirely your call, would you be doing this today? [If yes → it's about getting them comfortable, let's nail the answer now. If no → find the real objection.]`),
      TOG("▸ \"Send me the info / I'll get back to you\"", `I can do that — but straight up, 'send me info' usually means it drops to the bottom of the inbox and nothing changes. What's the one thing you'd need to be sure of to say yes today?`),

      H("h2", "7 · The close"),
      T(`"The clients who become big success stories don't wait for a meeting to start moving — they act. So that call we booked? Let's make it your <b>onboarding call</b> instead. We start today, I build tonight, and by then you're looking at it already built."`),
      C("plain", "💳", `"Easiest way to lock it in is right now — I'll fire a secure payment link to your phone, you tap it while we're on, takes 30 seconds, and the moment it clears I start building. Sending it now."`),
      C("green", "🎉", `${GRN("Booom — payment confirmed!")} Respect for pulling the trigger. Most talk about this for months and never do — you just did. Right, I'm not hanging up yet — last few questions so I can start building tonight.`),

      H("h2", "8 · Onboarding capture"),
      T(`<i>Collect these on the spot once paid:</i>`),
      TODO("Exact business name (legal + trading)"),
      TODO("Best number for leads (missed-call forwarding)"),
      TODO("Lead email + login/receipts email"),
      TODO("Areas covered (towns / radius)"),
      TODO("Why you? — what they do better"),
      TODO("A recent job they're proud of (hero example)"),
      TODO("Logos, job photos, reviews → WhatsApp")
    ]
  };

  // ============ default content for the seeded wiki pages ============
  const howItWorks = {
    theme: "dark", icon: "📘",
    blocks: [
      C("lime", "⚡", "BizBoost takes the entire client-getting machine off a business owner's plate — ads, follow-up, booking, reviews and website — all visible in one command centre."),
      H("h2", "The promise"),
      T("You show up and do the work you're great at. We keep the calendar full of your ideal clients."),
      H("h2", "The five pillars"),
      B("<b>Capture</b> — never miss a lead. Missed calls text back in 30 seconds."),
      B("<b>Convert</b> — chatbot qualifies and books automatically."),
      B("<b>Attract</b> — Google & Meta ads on high-intent searches."),
      B("<b>Reputation</b> — automated review harvesting to rank #1 locally."),
      B("<b>Transparency</b> — the live dashboard shows every lead and euro."),
      DIV(),
      T("Read next:"),
      { id: uid(), type: "subpage", pageId: "p3", icon: "💷", title: "Pricing & guarantees" }
    ]
  };

  const pricing = {
    theme: "dark", icon: "💷",
    blocks: [
      C("blue", "🧱", "Every plan starts with a <b>€298</b> one-time setup — website, chatbot, booking, Google, and command centre. Live in 3 days."),
      H("h2", "Plans"),
      H("h3", "Growth — €698/mo"),
      B("Facebook & Google ads + full follow-up automation"),
      SY("guarantee"),
      H("h3", "Domination — €998/mo"),
      B("Everything in Growth + 4×/week content, email, dedicated manager, weekly calls"),
      C("lime", "🏆", "<b>Guarantee:</b> consistent qualified enquiries within 90 days — or no monthly until you get them."),
      DIV(),
      T("Every plan: live dashboard, full transparency, 30-day money-back, no contracts.")
    ]
  };

  const pages = {
    "p-coldcall": coldCall,
    "p1": howItWorks,
    "p3": pricing
  };

  // default starter for any page without authored content
  function starter(title) {
    return { theme: "dark", icon: "📄", blocks: [
      C("plain", "✍️", "Empty page. Hit <b>+</b> or type <b>/</b> to add blocks, or ask <b>AI</b> in the side panel to draft it for you."),
    ]};
  }

  return { pages, synced, starter, uid };
})();
