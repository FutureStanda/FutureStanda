// Client onboarding — schema, integrations-to-connect, sequential build checklist, memory.

window.BIZBOOST_ONBOARD = (() => {

  // ----- Wizard steps -----
  const steps = [
    { id: "profile",  label: "Business profile", icon: "users",     blurb: "The basics we build everything on" },
    { id: "position", label: "Positioning",      icon: "sparkle",   blurb: "What makes them the obvious choice" },
    { id: "connect",  label: "Connect accounts", icon: "plug",      blurb: "Get access to run it for them" },
    { id: "plan",     label: "Build plan",       icon: "checkSquare", blurb: "The work that kicks off" }
  ];

  // ----- Step field schemas -----
  const profileFields = [
    { key: "business", label: "Business name", type: "text", placeholder: "Legal / trading name", required: true, half: true },
    { key: "owner",    label: "Owner / main contact", type: "text", placeholder: "Who we deal with", required: true, half: true },
    { key: "email",    label: "Login + receipts email", type: "email", placeholder: "name@business.ie", required: true, half: true },
    { key: "phone",    label: "Lead phone", type: "tel", placeholder: "Missed-call forwarding line", required: true, half: true, note: "We text back missed calls from here" },
    { key: "niche",    label: "Niche", type: "text", placeholder: "e.g. Roofing", half: true },
    { key: "area",     label: "Areas covered", type: "text", placeholder: "Towns / radius", half: true },
    { key: "website",  label: "Current website", type: "url", placeholder: "Leave blank if none", half: true },
    { key: "plan",     label: "Plan", type: "select", options: ["Domination €998/mo", "Growth €698/mo", "Starter €298"], half: true },
    { key: "services", label: "Services (most profitable first)", type: "area", placeholder: "What they sell — lead with the money-maker" }
  ];

  const positionFields = [
    { key: "why",      label: "Why them, not the competitor", type: "area", placeholder: "Their words — what they do better", gold: true },
    { key: "proud",    label: "A recent job they're proud of", type: "area", placeholder: "Becomes the hero example on the site" },
    { key: "language", label: "What customers say about them", type: "area", placeholder: "Phrases that come up a lot" },
    { key: "ideal",    label: "Ideal client to fill the calendar with", type: "area", placeholder: "The job worth 10 more of", gold: true },
    { key: "vibe",     label: "Brand vibe", type: "radio", options: ["Premium & clean", "No-nonsense", "Bold & local"] },
    { key: "competitor", label: "Main competitor outranking them", type: "text", placeholder: "Who we're hunting" }
  ];

  // ----- Accounts to connect (everything to take the business off their hands) -----
  const connectList = [
    { id: "meta",   name: "Meta Business", sub: "Facebook + Instagram", category: "Advertising", icon: "Ⓜ", color: "#1877F2",
      unlocks: "Run & track ads, post content, reply to DMs",
      method: "Partner request", instruction: "In Business Settings → Partners → Add, paste our Partner ID 4042-… and share the Ad Account + Pages." },
    { id: "gads",   name: "Google Ads", sub: "Search & Performance Max", category: "Advertising", icon: "G", color: "#34A853",
      unlocks: "Run search ads on high-intent terms",
      method: "Manager link", instruction: "Accept the manager (MCC) link request landing in the owner's email now." },
    { id: "ga4",    name: "Google Analytics 4", sub: "Website traffic", category: "Analytics", icon: "G", color: "#F9AB00",
      unlocks: "Real visitor & conversion data in the dashboard",
      method: "Add user", instruction: "Admin → Property Access → Add bizboost@ as Editor." },
    { id: "gbp",    name: "Google Business Profile", sub: "Maps & reviews", category: "Presence", icon: "G", color: "#4285F4",
      unlocks: "Rank locally, harvest reviews, post offers",
      method: "Add manager", instruction: "Business Profile → Settings → People → Add bizboost@ as Manager." },
    { id: "site",   name: "Website & Domain", sub: "Hosting / registrar", category: "Presence", icon: "◯", color: "#8B7CFF",
      unlocks: "Build the new fast site & booking",
      method: "Invite", instruction: "Invite us to the registrar (or we host the new build — recommended)." },
    { id: "stripe", name: "Stripe", sub: "Payments", category: "Payments", icon: "S", color: "#635BFF",
      unlocks: "Track revenue per lead in the dashboard",
      method: "Secure link", instruction: "Tap the read-only Stripe Connect link we send." },
    { id: "wa",     name: "WhatsApp Business", sub: "Shared inbox", category: "Comms", icon: "W", color: "#25D366",
      unlocks: "Auto-reply, qualify & book leads 24/7",
      method: "Scan QR", instruction: "Scan the QR on the onboarding call to link the shared inbox." },
    { id: "cal",    name: "Calendar / Booking", sub: "Google or Calendly", category: "Comms", icon: "C", color: "#006BFF",
      unlocks: "Leads self-book into real availability",
      method: "Connect", instruction: "Sign in with Google to sync availability." }
  ];

  // ----- Sequential build checklist (unlocks in order) -----
  const checklist = [
    { id: "k1",  group: "Foundation",  title: "Kickoff / onboarding call done", owner: "Bartek", auto: false },
    { id: "k2",  group: "Foundation",  title: "Brand assets collected (logo, photos, reviews)", owner: "Client", auto: false },
    { id: "k3",  group: "Foundation",  title: "Competitor audit complete", owner: "Bartek", auto: false },
    { id: "k4",  group: "Connect",     title: "Meta Business connected", owner: "Client", auto: false, connect: "meta" },
    { id: "k5",  group: "Connect",     title: "Google (Ads, GA4, Profile) connected", owner: "Client", auto: false, connect: "gbp" },
    { id: "k6",  group: "Connect",     title: "WhatsApp + calendar connected", owner: "Client", auto: false, connect: "wa" },
    { id: "k7",  group: "Build",       title: "New website live", owner: "Bartek", auto: false },
    { id: "k8",  group: "Build",       title: "Booking system embedded", owner: "Auto", auto: true },
    { id: "k9",  group: "Build",       title: "Missed-call text-back switched on", owner: "Auto", auto: true },
    { id: "k10", group: "Build",       title: "AI chatbot trained on their services", owner: "Auto", auto: true },
    { id: "k11", group: "Launch",      title: "Google + Meta ads live", owner: "Bartek", auto: false },
    { id: "k12", group: "Launch",      title: "Review engine harvesting", owner: "Auto", auto: true },
    { id: "k13", group: "Launch",      title: "First qualified leads landing", owner: "Auto", auto: true }
  ];

  const groups = [
    { id: "Foundation", label: "Foundation", window: "Day 0–3", color: "#5BCEFA" },
    { id: "Connect",    label: "Connect accounts", window: "On the call", color: "#25D366" },
    { id: "Build",      label: "Build", window: "Day 3–7", color: "#8B7CFF" },
    { id: "Launch",     label: "Launch", window: "Day 7–14", color: "#CFFF3A" }
  ];

  return { steps, profileFields, positionFields, connectList, checklist, groups };
})();
