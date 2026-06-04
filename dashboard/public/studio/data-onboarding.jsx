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
      method: "Partner request", instruction: "In Business Settings → Partners → Add, paste our Partner ID 4042-… and share the Ad Account + Pages.",
      provider: "Meta", flow: "oauth", account: "Ad Account, Pages & Instagram",
      grants: ["Read & manage your ad campaigns", "Read ad performance & spend", "Publish to your Pages & Instagram", "Read & reply to messages"],
      apiScopes: ["ads_management", "ads_read", "pages_manage_posts", "pages_messaging", "instagram_basic", "business_management"] },
    { id: "gads",   name: "Google Ads", sub: "Search & Performance Max", category: "Advertising", icon: "G", color: "#34A853",
      unlocks: "Run search ads on high-intent terms",
      method: "Manager link", instruction: "Accept the manager (MCC) link request landing in the owner's email now.",
      provider: "Google", flow: "oauth", account: "Google Ads account",
      grants: ["Read & manage Search / PMax campaigns", "Read spend, clicks & conversions"],
      apiScopes: ["https://www.googleapis.com/auth/adwords"] },
    { id: "ga4",    name: "Google Analytics 4", sub: "Website traffic", category: "Analytics", icon: "G", color: "#F9AB00",
      unlocks: "Real visitor & conversion data in the dashboard",
      method: "Add user", instruction: "Admin → Property Access → Add bizboost@ as Editor.",
      provider: "Google", flow: "oauth", account: "Analytics 4 property",
      grants: ["Read website traffic & conversions", "Read audience & acquisition reports"],
      apiScopes: ["https://www.googleapis.com/auth/analytics.readonly"] },
    { id: "gbp",    name: "Google Business Profile", sub: "Maps & reviews", category: "Presence", icon: "G", color: "#4285F4",
      unlocks: "Rank locally, harvest reviews, post offers",
      method: "Add manager", instruction: "Business Profile → Settings → People → Add bizboost@ as Manager.",
      provider: "Google", flow: "oauth", account: "Business Profile",
      grants: ["Read & post to your profile", "Read & reply to reviews", "Read search & maps insights"],
      apiScopes: ["https://www.googleapis.com/auth/business.manage"] },
    { id: "site",   name: "Website & Domain", sub: "Hosting / registrar", category: "Presence", icon: "◯", color: "#8B7CFF",
      unlocks: "Build the new fast site & booking",
      method: "Invite", instruction: "Invite us to the registrar (or we host the new build — recommended).",
      provider: "Registrar", flow: "invite", account: "domain & DNS",
      grants: ["Point the domain to the new site", "Manage DNS records"],
      apiScopes: ["dns:write (varies by registrar)"] },
    { id: "stripe", name: "Stripe", sub: "Payments", category: "Payments", icon: "S", color: "#635BFF",
      unlocks: "Track revenue per lead in the dashboard",
      method: "Secure link", instruction: "Tap the read-only Stripe Connect link we send.",
      provider: "Stripe", flow: "oauth", account: "payments account (read-only)",
      grants: ["Read payments & payout totals", "Read customer & subscription data"],
      apiScopes: ["read_only (Stripe Connect OAuth)"] },
    { id: "wa",     name: "WhatsApp Business", sub: "Shared inbox", category: "Comms", icon: "W", color: "#25D366",
      unlocks: "Auto-reply, qualify & book leads 24/7",
      method: "Scan QR", instruction: "Scan the QR on the onboarding call to link the shared inbox.",
      provider: "Meta · WhatsApp", flow: "qr", account: "Business number & inbox",
      grants: ["Send & receive messages on your number", "Read message templates & status"],
      apiScopes: ["whatsapp_business_messaging", "whatsapp_business_management"] },
    { id: "cal",    name: "Calendar / Booking", sub: "Google or Calendly", category: "Comms", icon: "C", color: "#006BFF",
      unlocks: "Leads self-book into real availability",
      method: "Connect", instruction: "Sign in with Google to sync availability.",
      provider: "Google", flow: "oauth", account: "Calendar",
      grants: ["Read your availability", "Create & update booking events"],
      apiScopes: ["https://www.googleapis.com/auth/calendar.events"] }
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

  // ----- Admin / manual connection credentials (what YOU paste to connect on the client's behalf) -----
  // Doubles as the build spec: these are the exact keys each integration's API needs.
  const adminCredentials = {
    meta: { note: "From Meta Business Settings → System Users (token) and App Dashboard (App ID / Secret).", fields: [
      { key: "appId", label: "App ID", ph: "8842019…" },
      { key: "appSecret", label: "App Secret", ph: "••••••••••••", secret: true },
      { key: "adAccount", label: "Ad Account ID", ph: "act_10293847…" },
      { key: "token", label: "System User access token", ph: "EAAG…", secret: true }
    ]},
    gads: { note: "Developer token from your Google Ads MCC; OAuth client from Google Cloud console.", fields: [
      { key: "devToken", label: "Developer token", ph: "AbC123…", secret: true },
      { key: "customerId", label: "Customer ID", ph: "123-456-7890" },
      { key: "clientId", label: "OAuth client ID", ph: "…apps.googleusercontent.com" },
      { key: "refresh", label: "Refresh token", ph: "1//0g…", secret: true }
    ]},
    ga4: { note: "Property ID from GA4 Admin; service-account JSON from Google Cloud.", fields: [
      { key: "propertyId", label: "Property ID", ph: "312345678" },
      { key: "measurementId", label: "Measurement ID", ph: "G-XXXXXXX" },
      { key: "saJson", label: "Service account JSON", ph: "{ \"type\": \"service_account\", … }", area: true, secret: true }
    ]},
    gbp: { note: "Account & Location IDs from the Business Profile API; OAuth refresh token from Google Cloud.", fields: [
      { key: "accountId", label: "Account ID", ph: "accounts/123456…" },
      { key: "locationId", label: "Location ID", ph: "locations/987654…" },
      { key: "refresh", label: "Refresh token", ph: "1//0g…", secret: true }
    ]},
    site: { note: "API token from the client's registrar / host (Cloudflare, GoDaddy, etc.).", fields: [
      { key: "registrar", label: "Registrar / host", ph: "Cloudflare" },
      { key: "apiToken", label: "API token", ph: "••••••••", secret: true },
      { key: "zoneId", label: "Zone ID (optional)", ph: "0a1b2c3d…" }
    ]},
    stripe: { note: "Restricted (read-only) key from the client's Stripe → Developers → API keys.", fields: [
      { key: "secret", label: "Secret key", ph: "sk_live_…", secret: true },
      { key: "publishable", label: "Publishable key", ph: "pk_live_…" },
      { key: "webhook", label: "Webhook signing secret", ph: "whsec_…", secret: true }
    ]},
    wa: { note: "Phone Number ID & WABA ID from Meta; permanent token from a System User.", fields: [
      { key: "phoneId", label: "Phone Number ID", ph: "10987654321…" },
      { key: "wabaId", label: "WhatsApp Business Account ID", ph: "20394857…" },
      { key: "token", label: "Permanent access token", ph: "EAAG…", secret: true }
    ]},
    cal: { note: "Calendly personal token, or Google Calendar OAuth client.", fields: [
      { key: "provider", label: "Provider", ph: "Calendly / Google" },
      { key: "apiKey", label: "API key / token", ph: "••••••••", secret: true }
    ]}
  };

  return { steps, profileFields, positionFields, connectList, checklist, groups, adminCredentials };
})();
