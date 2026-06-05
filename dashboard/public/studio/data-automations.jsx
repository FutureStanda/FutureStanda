// Automations — trigger → agent/action chains for the BizBoost command centre.

window.BIZBOOST_AUTOMATIONS = (function () {

  // ---- THE master chain: status → "Paid" ----
  const master = {
    id: "paid-master",
    name: "New Client Ignition",
    trigger: { label: 'Status → "Paid"', icon: "euro", sub: "Fires the moment a deal closes" },
    status: "active",
    runsToday: 1,
    lastRun: "today · 11:42",
    steps: [
      { id: "m1", icon: "command", name: "Command centre spawns", desc: "Seeded with the client BUILD SPEC captured on the call", status: "active", agent: "Provisioner" },
      { id: "m2", icon: "calendar", name: "Meeting → Onboarding Call", desc: "Booked meeting converts, reminders scheduled (Telegram + email)", status: "active", agent: "Scheduler" },
      { id: "m3", icon: "sparkle", name: "Research agent starts", desc: "Competitor audit · market demand · opportunity gap", status: "active", agent: "Research" },
      { id: "m4", icon: "checkSquare", name: "Build queue populates", desc: "Tonight / 24h / day-7 tasks generated and assigned", status: "active", agent: "Planner" },
      { id: "m5", icon: "pulse", name: "Tempo sequence begins", desc: "V1 video · dashboard login · timed client touches", status: "active", agent: "Tempo" },
      { id: "m6", icon: "msg", name: "Asset intake opens", desc: "WhatsApp request: logos, job photos, reviews", status: "idle", agent: "Intake" }
    ]
  };

  // ---- AI optimiser (the always-on brain) ----
  const optimiser = {
    id: "ai-optimiser",
    name: "Performance Optimiser",
    status: "active",
    cadence: "daily", // realtime | hourly | daily
    watches: [
      { label: "Objectives & key results", icon: "target" },
      { label: "Revenue & MRR", icon: "euro" },
      { label: "Leads, bookings, ROAS", icon: "trend" },
      { label: "Tasks completed today", icon: "checkSquare" }
    ],
    // recent optimisation log
    log: [
      { at: "today · 09:00", icon: "euro", title: "MRR objective advanced", detail: "O'Sullivan moved to Paid (+€998/mo). Pushed “Grow MRR to €15k” from 38% → 47% and re-baselined the KR.", impact: "+9%", tone: "win" },
      { at: "today · 09:00", icon: "checkSquare", title: "Re-prioritised today's queue", detail: "Greenway at-risk: surfaced retention call to the top, deferred 2 low-impact content tasks.", impact: "3 tasks", tone: "info" },
      { at: "yesterday", icon: "trend", title: "Budget re-paced", detail: "Kelly Detailing ROAS climbing — flagged room to scale spend +15% to hit the leads KR faster.", impact: "+15%", tone: "win" },
      { at: "yesterday", icon: "target", title: "Objective at risk", detail: "“Every client live in 14d” slipping — Boyne build is day 6 of 7. Nudged build queue.", impact: "watch", tone: "warn" }
    ]
  };

  // ---- Other chains (grid) ----
  const chains = [
    { id: "lead-pipeline", name: "Lead Capture", trigger: "Lead created", action: "Add to pipeline + notify", icon: "inbox", accent: "var(--teal)", enabled: true, lastRun: "4m ago", runs: 312, ok: true },
    { id: "missed-call", name: "Never Miss a Lead", trigger: "Missed call", action: "30-sec text-back + qualify", icon: "phoneMissed", accent: "var(--amber)", enabled: true, lastRun: "1h ago", runs: 87, ok: true },
    { id: "review-engine", name: "Reputation Engine", trigger: "New 5★ review", action: "Harvest + post to socials", icon: "star", accent: "var(--lime)", enabled: true, lastRun: "26m ago", runs: 204, ok: true },
    { id: "booking-confirm", name: "Booking Confirmed", trigger: "Slot booked", action: "Confirm + add to calendar", icon: "calendar", accent: "var(--blue)", enabled: true, lastRun: "12m ago", runs: 146, ok: true },
    { id: "weekly-report", name: "Weekly Client Report", trigger: "Every Mon 08:00", action: "Generate + send report", icon: "trend", accent: "var(--violet)", enabled: true, lastRun: "2d ago", runs: 36, ok: true },
    { id: "stale-lead", name: "Stale Lead Rescue", trigger: "No reply in 48h", action: "Re-engage sequence", icon: "flame", accent: "var(--red)", enabled: false, lastRun: "—", runs: 19, ok: true },
    { id: "churn-watch", name: "Churn Early-Warning", trigger: "Health drops < 65", action: "Alert + book save call", icon: "shield", accent: "var(--amber)", enabled: true, lastRun: "5h ago", runs: 8, ok: true },
    { id: "content-batch", name: "Content Autopilot", trigger: "Every Thu 10:00", action: "Draft + schedule 4 posts", icon: "megaphone", accent: "var(--teal)", enabled: true, lastRun: "yesterday", runs: 52, ok: true }
  ];

  // chain detail step expansions (for the drawer)
  const chainDetail = {
    "lead-pipeline": [
      { icon: "inbox", name: "Lead lands", desc: "From ad form, website, WhatsApp or missed-call" },
      { icon: "sparkle", name: "AI enriches & scores", desc: "Pulls business info, scores intent 0–100" },
      { icon: "layers", name: "Added to pipeline", desc: "Slotted into the right stage by score" },
      { icon: "bell", name: "You're notified", desc: "Telegram ping if score > 70" }
    ],
    "missed-call": [
      { icon: "phoneMissed", name: "Call missed", desc: "Detected within seconds" },
      { icon: "msg", name: "Instant text-back", desc: "“Sorry we missed you…” sent in 30s" },
      { icon: "sparkle", name: "AI qualifies", desc: "Asks 2 quick questions, captures intent" },
      { icon: "calendar", name: "Books the job", desc: "Drops a booking link, confirms slot" }
    ],
    "review-engine": [
      { icon: "star", name: "Review posted", desc: "New 5★ on Google detected" },
      { icon: "sparkle", name: "AI reshapes it", desc: "Turns it into a branded social graphic + caption" },
      { icon: "megaphone", name: "Posts everywhere", desc: "IG, FB, GBP — on brand, on schedule" }
    ]
  };

  return { master, optimiser, chains, chainDetail };
})();
