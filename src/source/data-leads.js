// Leads — capture-to-delivery pipeline data.

window.BIZBOOST_LEADS = (() => {

  // Pipeline stages (capture -> delivery)
  const stages = [
    { id: "new",        label: "New lead",      color: "#5BCEFA", desc: "Just captured" },
    { id: "meeting",    label: "Meeting booked", color: "#FFB547", desc: "Discovery scheduled" },
    { id: "researching",label: "Researching",   color: "#8B7CFF", desc: "Agent working" },
    { id: "proposal",   label: "Proposal sent",  color: "#CFFF3A", desc: "Pitched, awaiting" },
    { id: "won",        label: "Won",            color: "#3FE0A8", desc: "Onboarding" },
    { id: "lost",       label: "Lost",           color: "#5F635C", desc: "Not now" }
  ];

  // The intake schema — exactly the fields captured on New Lead
  const intakeSchema = [
    { section: "Contact", fields: [
      { key: "business", label: "Business name", type: "text", placeholder: "e.g. Dunne Roofing", required: true },
      { key: "person",   label: "Contact name", type: "text", placeholder: "Who you spoke to", required: true },
      { key: "email",    label: "Email", type: "email", placeholder: "name@business.ie", required: true },
      { key: "phone",    label: "Phone", type: "tel", placeholder: "+353 …", required: true, note: "Needed for the link" },
      { key: "meetingAt",label: "Discovery call", type: "meeting", required: true }
    ]},
    { section: "Their world", fields: [
      { key: "niche",    label: "Niche", type: "text", placeholder: "e.g. Roofing" },
      { key: "area",     label: "Area covered", type: "text", placeholder: "e.g. Cork + 30km" },
      { key: "google",   label: "Google Business profile", type: "url", placeholder: "Paste link" },
      { key: "socials",  label: "Socials", type: "url", placeholder: "IG / FB / TikTok links" },
      { key: "services", label: "Services offered", type: "area", placeholder: "What they sell — most profitable first" },
      { key: "process",  label: "Current way they get clients", type: "area", placeholder: "Word of mouth? Ads? Referrals?" }
    ]},
    { section: "Qualification — the gold", fields: [
      { key: "dream",    label: "Their dream client", type: "area", placeholder: "The job they'd take 10 more of" },
      { key: "blockers", label: "What's slowing growth", type: "area", placeholder: "Their biggest constraint" },
      { key: "priority", label: "How serious on scaling", type: "scale", placeholder: "" },
      { key: "change",   label: "What hitting the goal changes", type: "area", placeholder: "For the business AND their life" },
      { key: "whynow",   label: "Why now, not someday", type: "area", placeholder: "The deep why" }
    ]}
  ];

  // What fires on submit
  const automations = [
    { id: "save",     icon: "inbox",    title: "Saved to Leads database",     detail: "Added to pipeline + all views", color: "#5BCEFA", ms: 500 },
    { id: "telegram", icon: "msg",      title: "Telegram reminder scheduled", detail: "Pings you 1h + 10m before the call", color: "#229ED9", ms: 1100 },
    { id: "intro",    icon: "phone",    title: "Intro + booking link sent",   detail: "WhatsApp with their custom meeting link", color: "#25D366", ms: 1700 },
    { id: "research", icon: "sparkle",  title: "Research agent dispatched",   detail: "Deep-mode business + competitor scan", color: "#8B7CFF", ms: 2400 },
    { id: "prep",     icon: "doc",      title: "Meeting brief generating",    detail: "Custom plan built from their answers", color: "#CFFF3A", ms: 3100 }
  ];

  // Sample leads in flight
  const leads = [
    {
      id: "l-dunne",
      business: "Dunne Roofing",
      person: "Pat Dunne",
      email: "pat@dunneroofing.ie",
      phone: "+353 86 224 9981",
      niche: "Roofing",
      area: "Cork + 30km",
      stage: "researching",
      value: 998,
      package: "Domination €998/mo",
      created: "Today · 09:14",
      meetingAt: "Thu 5 Jun · 14:00",
      meetingIn: "in 3 days",
      priority: 9,
      color: "#8B7CFF",
      google: "g.page/dunne-roofing",
      socials: "@dunneroofing",
      services: "Slate & tile roofing, flat roofs, gutter & fascia, emergency repairs",
      process: "Almost all word of mouth + a bit of Google. No ads running.",
      dream: "Full re-roof jobs, €8–15k, homeowners in the suburbs who want it done right not cheap.",
      blockers: "Booked 3 weeks out but it dries up in winter. No system, leads slip through.",
      change: "Steady €40k months year-round, hire a second crew, stop quoting every evening.",
      whynow: "Turning 45, wants the business to run without him on the tools by 50.",
      introSent: true,
      telegramSet: true,
      research: "complete"
    },
    {
      id: "l-kavanagh",
      business: "Kavanagh Dental",
      person: "Dr. Emma Kavanagh",
      email: "emma@kavanaghdental.ie",
      phone: "+353 87 901 3320",
      niche: "Dental",
      area: "Wexford town",
      stage: "meeting",
      value: 998,
      package: "Domination €998/mo",
      created: "Yesterday · 16:40",
      meetingAt: "Tue 3 Jun · 11:30",
      meetingIn: "in 1 day",
      priority: 8,
      color: "#FFB547",
      google: "g.page/kavanagh-dental",
      socials: "@kavanaghdental",
      services: "Invisalign, implants, cosmetic, routine hygiene",
      process: "Referrals + an old website. Tried Boostable once, didn't stick.",
      dream: "High-value Invisalign & implant cases, not just check-ups.",
      blockers: "Front desk too busy to follow up enquiries, they go cold.",
      change: "Predictable 8–10 implant consults a month, justify a second chair.",
      whynow: "New associate starting in Sept — needs the calendar full for them.",
      introSent: true,
      telegramSet: true,
      research: "running"
    },
    {
      id: "l-nolan",
      business: "Nolan Landscaping",
      person: "Cathal Nolan",
      email: "cathal@nolanlandscapes.ie",
      phone: "+353 85 668 2210",
      niche: "Landscaping",
      area: "Kilkenny",
      stage: "new",
      value: 698,
      package: "Growth €698/mo",
      created: "Today · 11:02",
      meetingAt: "Fri 6 Jun · 10:00",
      meetingIn: "in 4 days",
      priority: 7,
      color: "#5BCEFA",
      google: "g.page/nolan-landscaping",
      socials: "@nolanlandscapes",
      services: "Garden design, paving, turfing, maintenance contracts",
      process: "Facebook posts + word of mouth. No paid ads, no follow-up system.",
      dream: "Full garden makeovers €10k+, commercial maintenance contracts.",
      blockers: "Feast or famine. Great summers, dead winters.",
      change: "Lock in recurring maintenance income to smooth out the year.",
      whynow: "Just lost a big contract to a competitor with a slicker pitch.",
      introSent: false,
      telegramSet: true,
      research: "queued"
    },
    {
      id: "l-brady",
      business: "Brady Plumbing & Heating",
      person: "Shane Brady",
      email: "shane@bradyplumbing.ie",
      phone: "+353 83 442 1180",
      niche: "Plumbing",
      area: "Athlone",
      stage: "proposal",
      value: 998,
      package: "Domination €998/mo",
      created: "2 days ago",
      meetingAt: "Mon 2 Jun · 15:00",
      meetingIn: "done",
      priority: 9,
      color: "#CFFF3A",
      google: "g.page/brady-plumbing",
      socials: "@bradyplumbing",
      services: "Boiler service & install, bathrooms, emergency callouts",
      process: "Google ads run by a cousin, no tracking, no idea on ROI.",
      dream: "Boiler installs and full bathroom fit-outs, not €80 callouts.",
      blockers: "Missing calls on the tools, no one answers, jobs go elsewhere.",
      change: "Never miss a lead again, double the install jobs.",
      whynow: "Competitor down the road just went big on ads, feeling the squeeze.",
      introSent: true,
      telegramSet: true,
      research: "complete"
    },
    {
      id: "l-power",
      business: "Power Electrical",
      person: "Niall Power",
      email: "niall@powerelectrical.ie",
      phone: "+353 86 110 7742",
      niche: "Electrical",
      area: "Limerick",
      stage: "won",
      value: 998,
      package: "Domination €998/mo",
      created: "4 days ago",
      meetingAt: "Closed Fri",
      meetingIn: "won",
      priority: 10,
      color: "#3FE0A8",
      services: "EV chargers, rewiring, commercial",
      process: "Referrals only.",
      dream: "EV charger installs at scale.",
      blockers: "No online presence at all.",
      change: "Become the go-to EV installer in the mid-west.",
      whynow: "EV grants ending, wants to ride the wave now.",
      introSent: true,
      telegramSet: true,
      research: "complete"
    }
  ];

  // Deep research agent output (for a completed lead — Dunne Roofing)
  const researchSample = {
    leadId: "l-dunne",
    status: "complete",
    runtime: "4m 12s",
    sources: 47,
    confidence: "High",
    summary: "Dunne Roofing is a well-reviewed, capacity-constrained roofer running almost entirely on word of mouth. There is a clear, fast path to €40k+ months by capturing the demand already searching in Cork and systemising follow-up. Biggest unlock: paid search + missed-call recovery. Winter seasonality is solvable with a gutter/repair offer.",
    snapshot: {
      rating: 4.8, reviews: 63, ranking: "Page 2 for 'roofers cork'",
      site: "Slow, no booking, weak on mobile", ads: "None running",
      social: "IG 740 followers, posts rarely"
    },
    opportunities: [
      { rank: 1, title: "Google Search ads on high-intent terms", impact: "High", effort: "Low",
        detail: "'roof repair cork', 're-roof cork' have strong volume and weak local competition. Estimated 25–40 qualified leads/mo at €18–28 CPL.", metric: "+€18k/mo potential" },
      { rank: 2, title: "Missed-call text-back", impact: "High", effort: "Low",
        detail: "Pat misses calls on the roof daily. Auto-text + booking recovers an estimated 30% of lost jobs.", metric: "~8 jobs/mo recovered" },
      { rank: 3, title: "Winter gutter & repair offer", impact: "Medium", effort: "Medium",
        detail: "Counter seasonality with a low-ticket gutter clean/repair campaign Oct–Feb to keep the crew busy and the pipeline warm.", metric: "Flattens the dip" },
      { rank: 4, title: "Review engine", impact: "Medium", effort: "Low",
        detail: "63 reviews is good but slow-growing. Automated review requests post-job to overtake the page-1 competitor (118 reviews).", metric: "Page 1 in ~90d" }
    ],
    competitors: [
      { name: "Leeside Roofing", note: "Page 1, 118 reviews, running Meta lead ads", threat: "high" },
      { name: "Munster Roofing Co", note: "Strong Google Ads presence, weak site", threat: "med" },
      { name: "Apex Roofing", note: "Big on before/after reels, 6k IG", threat: "med" }
    ],
    adLibrary: [
      { market: "US · Texas", play: "'Free roof inspection' lead-gen funnel + financing angle", note: "Dominant in US roofing — not used locally yet. Big opportunity." },
      { market: "US · Florida", play: "Storm-damage urgency + insurance-claim help", note: "Adapt to weather-damage angle for Irish winter." },
      { market: "UK · Manchester", play: "Before/after reel ads → instant quote form", note: "Cheap to run, high engagement. Quick win." }
    ],
    roadmap: [
      { phase: "Days 0–7", title: "Foundation", items: ["New fast site + booking", "Missed-call text-back live", "Google profile optimised"] },
      { phase: "Days 7–14", title: "Demand", items: ["Search ads live on top terms", "First before/after reel set", "Review engine switched on"] },
      { phase: "Days 14–30", title: "Scale", items: ["Scale winning ad sets", "Retargeting + reels", "Hit 25+ qualified leads/mo"] },
      { phase: "Days 30–90", title: "Systemise", items: ["Winter repair offer built", "Second crew justified", "€40k month target"] }
    ],
    gap: { from: "€22k avg month · feast-or-famine · word of mouth", to: "€40k+ steady · year-round pipeline · runs without Pat on the tools" }
  };

  return { stages, intakeSchema, automations, leads, researchSample };
})();
