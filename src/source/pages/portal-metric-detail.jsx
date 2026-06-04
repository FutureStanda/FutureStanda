// Portal metric drill-down — two levels deep.
// L1: metric overview (funnel, lists, charts).  L2: click any lead/job → full record + timeline.
// Deterministic fake-but-plausible data per client.

function portalSeed(str) {
  let h = 9;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  return () => { h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 13), 0x297a2d39) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
}

const PORTAL_NAMES = ["Sarah O'Brien", "Mark Dunne", "Emma Ryan", "Liam Walsh", "Aoife Kelly", "John Murphy", "Ciara Byrne", "Tom Healy", "Niamh Doyle", "Paul Brennan", "Grace Connolly", "Sean Fitzgerald", "Hannah Moore", "David Quinn", "Laura Nolan", "Conor Reilly", "Megan Lynch", "Eoin Carroll", "Rachel Kavanagh", "Darren Foley", "Sinead Power", "Gavin Sweeney", "Orla Maguire", "Brian Kenny"];
const PORTAL_AREAS = ["Salthill", "Knocknacarra", "Oranmore", "Barna", "Renmore", "Newcastle", "Bearna", "Claregalway", "Athenry", "Moycullen"];
const LOST_REASONS = ["Went with a cheaper quote", "Decided to hold off for now", "Stopped responding after the quote", "Job no longer needed", "Out of our service area"];
const WON_NOTES = ["Booked on the spot after the call", "Loved the fast response — booked same day", "Referred by a previous customer", "Chose us over two other quotes"];

const PORTAL_SOURCES = {
  Facebook: "#4A90E2", Google: "#34A853", Website: "#9b8cff", Referral: "#FF8A5B", WhatsApp: "#25D366"
};

// ---- master dataset: one coherent set of leads per client ----
function buildLeads(c, accent) {
  const rnd = portalSeed(c.id + "leads");
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const services = (c.services && c.services.length) ? c.services : ["Service call", "New install", "Repair", "Maintenance"];
  const srcNames = Object.keys(PORTAL_SOURCES);
  const total = Math.max(6, Math.min(c.leads30 || 12, 26));
  const avgJob = Math.max(120, Math.round((c.revenue30 || 9000) / Math.max(c.bookings30 || 10, 1)));

  // outcome distribution
  function statusFor(i) {
    const r = i / total;
    if (r < 0.34) return "won";
    if (r < 0.50) return "booked";
    if (r < 0.68) return "quoted";
    if (r < 0.86) return "lost";
    return "new";
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const times = ["08:30", "09:00", "10:30", "11:00", "13:00", "14:30", "16:00", "17:30"];

  return Array.from({ length: total }, (_, i) => {
    const status = statusFor(i);
    const name = PORTAL_NAMES[Math.floor(rnd() * PORTAL_NAMES.length)];
    const src = srcNames[Math.floor(rnd() * srcNames.length)];
    const svc = pick(services);
    const area = pick(PORTAL_AREAS);
    const value = Math.round(avgJob * (0.5 + rnd() * 1.6));
    const dayN = i === 0 ? 0 : i < 3 ? i : Math.ceil(i * 1.4);
    const ago = dayN === 0 ? "Today" : dayN === 1 ? "Yesterday" : dayN + " days ago";
    const first = name.split(" ")[0];
    const phone = pick(["087", "085", "086", "089"]) + " " + (100 + Math.floor(rnd() * 899)) + " " + (1000 + Math.floor(rnd() * 8999));
    const email = first.toLowerCase().replace(/[^a-z]/g, "") + pick([".", "_", ""]) + name.split(" ")[1].toLowerCase() + "@" + pick(["gmail.com", "hotmail.com", "outlook.com"]);
    const enquiry = pick([
      `Hi, looking for a quote on ${svc.toLowerCase()} out in ${area}. When could you take a look?`,
      `Hey — do you cover ${area}? Need ${svc.toLowerCase()} done fairly soon if possible.`,
      `Saw your ad. Interested in ${svc.toLowerCase()}, what would that roughly cost?`,
      `Need someone reliable for ${svc.toLowerCase()} in ${area}. Are you taking on new work?`
    ]);
    const sched = { day: pick(days), time: pick(times) };

    return {
      id: c.id + "-L" + i, name, first, src, srcColor: PORTAL_SOURCES[src], svc, area, value, ago, dayN, phone, email, enquiry, status, sched,
      wonNote: pick(WON_NOTES), lostReason: pick(LOST_REASONS),
      rating: 5, reviewText: pick(["Brilliant job, really happy.", "Spot on, would use again.", "Fast and tidy, great work."])
    };
  });
}

const STATUS_META = {
  won: { label: "Won", color: "var(--p-accent)", icon: "check" },
  booked: { label: "Booked", color: "#4A90E2", icon: "calendar" },
  quoted: { label: "Quoted", color: "#FFB547", icon: "euro" },
  lost: { label: "Lost", color: "#7d8470", icon: "x" },
  new: { label: "New", color: "#9b8cff", icon: "inbox" }
};

// ---- L2: full record + timeline ----
function buildTimeline(l, money) {
  const t = [];
  t.push({ icon: "inbox", c: l.srcColor, t: "Enquiry received", d: `Via ${l.src} — "${l.svc}" in ${l.area}`, when: l.ago });
  t.push({ icon: "msg", c: "#25D366", t: "Auto text-back sent", d: "BizBoost replied within 30 seconds, before you even saw it", when: l.ago });
  t.push({ icon: "sparkle", c: "#9b8cff", t: "Qualified by assistant", d: `${l.first} confirmed they're ready to go ahead`, when: l.ago });
  if (l.status === "new") {
    t.push({ icon: "bell", c: "var(--p-accent)", t: "Handed to you", d: "Fresh lead — waiting on first contact", when: "now", live: true });
    return t;
  }
  t.push({ icon: "euro", c: "#FFB547", t: "Quote sent", d: `${money(l.value)} for ${l.svc.toLowerCase()}`, when: l.ago });
  if (l.status === "quoted") {
    t.push({ icon: "clock", c: "var(--p-accent)", t: "Awaiting decision", d: "Follow-up scheduled automatically", when: "pending", live: true });
    return t;
  }
  if (l.status === "lost") {
    t.push({ icon: "x", c: "#7d8470", t: "Marked lost", d: l.lostReason, when: l.ago });
    t.push({ icon: "refresh", c: "#9b8cff", t: "Added to win-back", d: "We'll re-engage them down the line", when: "ongoing" });
    return t;
  }
  // booked or won
  t.push({ icon: "calendar", c: "#4A90E2", t: "Job booked", d: `${l.sched.day} at ${l.sched.time}`, when: l.ago });
  if (l.status === "booked") {
    t.push({ icon: "clock", c: "var(--p-accent)", t: "Scheduled", d: "Confirmed and in your calendar", when: "upcoming", live: true });
    return t;
  }
  t.push({ icon: "check", c: "var(--p-accent)", t: "Job completed", d: `${money(l.value)} collected`, when: l.ago });
  t.push({ icon: "star", c: "#FFC53D", t: "Review requested", d: `${l.first} left ${l.rating}★ — "${l.reviewText}"`, when: l.ago });
  return t;
}

function PortalRecord({ l, accent, money, onBack }) {
  const sm = STATUS_META[l.status];
  const timeline = buildTimeline(l, money);
  return (
    <div className="pmd-body">
      {/* identity */}
      <div className="pmd-rec-hero">
        <span className="pmd-rec-av" style={{ background: l.srcColor + "26", color: l.srcColor }}>{l.name[0]}</span>
        <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
          <span className="pmd-rec-name">{l.name}</span>
          <span className="pmd-row-d">{l.svc} · {l.area}</span>
        </div>
        <span className="pmd-pill" style={{ color: sm.color, borderColor: sm.color + "66", background: sm.color + "14" }}><Icon name={sm.icon} cls="ic-sm" />{sm.label}</span>
      </div>

      {/* contact + value */}
      <div className="pmd-rec-meta">
        <a className="pmd-meta-cell" href={"tel:" + l.phone.replace(/\s/g, "")}><span className="pmd-meta-l"><Icon name="phone" cls="ic-sm" />Phone</span><span className="pmd-meta-v">{l.phone}</span></a>
        <a className="pmd-meta-cell" href={"mailto:" + l.email}><span className="pmd-meta-l"><Icon name="mail" cls="ic-sm" />Email</span><span className="pmd-meta-v pmd-trunc">{l.email}</span></a>
        <div className="pmd-meta-cell"><span className="pmd-meta-l"><Icon name="megaphone" cls="ic-sm" />Source</span><span className="pmd-meta-v" style={{ color: l.srcColor }}>{l.src}</span></div>
        <div className="pmd-meta-cell"><span className="pmd-meta-l"><Icon name="euro" cls="ic-sm" />{l.status === "won" ? "Job value" : l.status === "lost" ? "Missed value" : "Quote"}</span><span className="pmd-meta-v" style={{ color: l.status === "won" ? accent : l.status === "lost" ? "#7d8470" : "var(--p-ink)" }}>{money(l.value)}</span></div>
      </div>

      {/* outcome banner */}
      {l.status === "won" && <div className="pmd-banner" style={{ background: accent + "14", borderColor: accent + "44" }}><Icon name="check" cls="ic-sm" /><span>Won — {l.wonNote.toLowerCase()}.</span></div>}
      {l.status === "lost" && <div className="pmd-banner" style={{ background: "#7d847014", borderColor: "#7d847044", color: "var(--p-ink-2)" }}><Icon name="x" cls="ic-sm" /><span>Lost — {l.lostReason.toLowerCase()}. Added to win-back.</span></div>}
      {l.status === "booked" && <div className="pmd-banner" style={{ background: "#4A90E214", borderColor: "#4A90E244" }}><Icon name="calendar" cls="ic-sm" /><span>Booked for {l.sched.day} at {l.sched.time}.</span></div>}
      {l.status === "quoted" && <div className="pmd-banner" style={{ background: "#FFB54714", borderColor: "#FFB54744" }}><Icon name="clock" cls="ic-sm" /><span>Quote out — we're following up automatically.</span></div>}

      {/* enquiry */}
      <div className="pmd-section">
        <span className="pmd-section-t">The enquiry</span>
        <div className="pmd-quote">"{l.enquiry}"</div>
      </div>

      {/* timeline */}
      <div className="pmd-section">
        <span className="pmd-section-t">Full journey</span>
        <div className="pmd-timeline">
          {timeline.map((e, i) => (
            <div key={i} className="pmd-tl-row">
              <div className="pmd-tl-line">
                <span className="pmd-tl-dot" style={{ background: e.c, boxShadow: e.live ? `0 0 0 4px ${e.c}22` : "none" }}><Icon name={e.icon} cls="ic-sm" /></span>
                {i < timeline.length - 1 && <span className="pmd-tl-bar"></span>}
              </div>
              <div className="col" style={{ gap: 2, paddingBottom: 16, flex: 1 }}>
                <div className="row between"><span className="pmd-tl-t">{e.t}</span><span className="pmd-ago">{e.when}</span></div>
                <span className="pmd-tl-d">{e.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- L1 metric overview ----
function PortalMetricDetail({ metric, c, accent, money, onClose }) {
  const [record, setRecord] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => { setRecord(null); setFilter("all"); }, [metric]);
  if (!metric) return null;

  const rnd = portalSeed(c.id + metric);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const leads = buildLeads(c, accent);

  let title, sub, body;

  if (metric === "leads") {
    const counts = { all: leads.length, won: 0, booked: 0, quoted: 0, lost: 0, new: 0 };
    leads.forEach(l => counts[l.status]++);
    const shown = filter === "all" ? leads : leads.filter(l => l.status === filter);
    const funnel = [
      { l: "Enquiries", v: leads.length },
      { l: "Qualified", v: leads.filter(l => l.status !== "new").length },
      { l: "Booked", v: leads.filter(l => l.status === "won" || l.status === "booked").length },
      { l: "Won", v: counts.won }
    ];
    title = "New leads"; sub = c.leads30 + " this month · " + (c.leadsΔ >= 0 ? "+" : "") + Math.round(c.leadsΔ * 100) + "% on last month";
    body = (
      <React.Fragment>
        <PortalFunnel funnel={funnel} accent={accent} />
        <div className="pmd-filters">
          {[["all", "All"], ["won", "Won"], ["booked", "Booked"], ["quoted", "Quoted"], ["lost", "Lost"], ["new", "New"]].map(([k, lab]) => (
            <button key={k} className={"pmd-chip" + (filter === k ? " on" : "")} onClick={() => setFilter(k)} style={filter === k ? { background: accent, borderColor: accent, color: "#0a0a0a" } : {}}>
              {lab} <span className="pmd-chip-n">{counts[k]}</span>
            </button>
          ))}
        </div>
        <div className="pmd-section">
          <span className="pmd-section-t">{filter === "all" ? "Every lead" : STATUS_META[filter].label + " leads"} · tap to open</span>
          <div className="col gap-2">
            {shown.map(l => <LeadRow key={l.id} l={l} money={money} onClick={() => setRecord(l)} />)}
            {shown.length === 0 && <div className="portal-empty">None in this stage right now.</div>}
          </div>
        </div>
      </React.Fragment>
    );
  }

  else if (metric === "bookings") {
    const booked = leads.filter(l => l.status === "won" || l.status === "booked");
    const upcoming = leads.filter(l => l.status === "booked");
    const services = (c.services && c.services.length) ? c.services : ["Service call", "New install", "Repair"];
    const byService = services.map(s => ({ s, v: booked.filter(b => b.svc === s).length })).filter(x => x.v > 0);
    title = "Jobs booked"; sub = c.bookings30 + " this month · " + (c.bookingsΔ >= 0 ? "+" : "") + Math.round(c.bookingsΔ * 100) + "% on last month";
    body = (
      <React.Fragment>
        <div className="pmd-stats">
          <PortalStat label="Booked" value={c.bookings30} accent={accent} />
          <PortalStat label="Conversion" value={Math.round((c.bookings30 / Math.max(c.leads30, 1)) * 100) + "%"} sub="of leads" accent={accent} />
          <PortalStat label="Avg value" value={money(Math.round(c.revenue30 / Math.max(c.bookings30, 1)))} accent={accent} />
        </div>
        {byService.length > 0 && <div className="pmd-section">
          <span className="pmd-section-t">By service</span>
          <div className="col gap-3">
            {byService.map((b, i) => { const max = Math.max(...byService.map(x => x.v)); return (<div key={i} className="col gap-2"><div className="row between" style={{ fontSize: 13 }}><span style={{ color: "var(--p-ink-2)" }}>{b.s}</span><span className="num" style={{ fontWeight: 600 }}>{b.v}</span></div><div className="portal-bar"><i style={{ width: (b.v / max * 100) + "%", background: accent }}></i></div></div>); })}
          </div>
        </div>}
        <div className="pmd-section">
          <span className="pmd-section-t">Upcoming jobs · tap to open</span>
          <div className="col gap-2">
            {upcoming.map(l => (
              <button key={l.id} className="pmd-row pmd-row-btn" onClick={() => setRecord(l)}>
                <div className="pmd-cal"><span className="pmd-cal-d">{l.sched.day}</span><span className="pmd-cal-t">{l.sched.time}</span></div>
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}><span className="pmd-row-t">{l.name}</span><span className="pmd-row-d">{l.svc} · {l.area}</span></div>
                <span className="num" style={{ color: "var(--p-ink)", fontWeight: 600, fontSize: 13 }}>{money(l.value)}</span>
                <Icon name="chevR" cls="ic-sm" />
              </button>
            ))}
            {upcoming.length === 0 && <div className="portal-empty">No upcoming jobs scheduled.</div>}
          </div>
        </div>
      </React.Fragment>
    );
  }

  else if (metric === "revenue") {
    const won = leads.filter(l => l.status === "won");
    const total = c.revenue30;
    const services = (c.services && c.services.length) ? c.services : ["Service call", "New install", "Repair"];
    const split = services.map(s => ({ s, v: won.filter(w => w.svc === s).reduce((a, w) => a + w.value, 0) })).filter(x => x.v > 0);
    title = "Revenue tracked"; sub = money(total) + " this month · " + (c.revenueΔ >= 0 ? "+" : "") + Math.round(c.revenueΔ * 100) + "% on last month";
    body = (
      <React.Fragment>
        <div className="pmd-stats">
          <PortalStat label="This month" value={money(total)} accent={accent} />
          <PortalStat label="Avg job" value={money(Math.round(total / Math.max(c.bookings30, 1)))} accent={accent} />
          <PortalStat label="Per lead" value={money(Math.round(total / Math.max(c.leads30, 1)))} accent={accent} />
        </div>
        {split.length > 0 && <div className="pmd-section">
          <span className="pmd-section-t">Revenue by service</span>
          <div className="col gap-3">
            {split.map((b, i) => { const max = Math.max(...split.map(x => x.v)); return (<div key={i} className="col gap-2"><div className="row between" style={{ fontSize: 13 }}><span style={{ color: "var(--p-ink-2)" }}>{b.s}</span><span className="num" style={{ fontWeight: 600 }}>{money(b.v)}</span></div><div className="portal-bar"><i style={{ width: (b.v / max * 100) + "%", background: accent }}></i></div></div>); })}
          </div>
        </div>}
        <div className="pmd-section">
          <span className="pmd-section-t">Jobs completed · tap to open</span>
          <div className="col gap-2">
            {won.map(l => (
              <button key={l.id} className="pmd-row pmd-row-btn" onClick={() => setRecord(l)}>
                <span className="pmd-av" style={{ background: accent + "22", color: accent }}><Icon name="check" cls="ic-sm" /></span>
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}><span className="pmd-row-t">{l.name}</span><span className="pmd-row-d">{l.svc} · {l.ago}</span></div>
                <span className="num" style={{ color: accent, fontWeight: 700, fontSize: 14 }}>{money(l.value)}</span>
                <Icon name="chevR" cls="ic-sm" />
              </button>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }

  else if (metric === "roas") {
    const spend = c.adSpend || 0;
    const ret = Math.round(spend * (c.roas || 0));
    const channels = [["Facebook Ads", "#4A90E2", 0.55], ["Google Ads", "#34A853", 0.45]];
    title = "Return on ad spend"; sub = (c.roas || 0).toFixed(1) + "× · every €1 brings back €" + (c.roas || 0).toFixed(1);
    body = (
      <React.Fragment>
        <div className="pmd-stats">
          <PortalStat label="Ad spend" value={money(spend)} accent={accent} />
          <PortalStat label="Revenue back" value={money(ret)} accent={accent} />
          <PortalStat label="Cost / lead" value={money(Math.round(spend / Math.max(c.leads30, 1)))} accent={accent} />
        </div>
        <div className="pmd-roas-vis">
          <div className="col gap-2" style={{ flex: 1 }}><span className="pmd-roas-lbl">You invested</span><div className="pmd-roas-bar" style={{ background: "var(--p-surface-2)" }}><span style={{ color: "var(--p-ink)" }}>{money(spend)}</span></div></div>
          <Icon name="arrowR" cls="ic-sm" />
          <div className="col gap-2" style={{ flex: 2.4 }}><span className="pmd-roas-lbl" style={{ color: accent }}>We brought back</span><div className="pmd-roas-bar" style={{ background: accent, color: "#0a0a0a" }}>{money(ret)}</div></div>
        </div>
        <div className="pmd-section">
          <span className="pmd-section-t">By channel</span>
          <div className="col gap-3">
            {channels.map((ch, i) => { const chSpend = Math.round(spend * ch[2]); const chRoas = (c.roas || 0) * (0.85 + rnd() * 0.4); return (<div key={i} className="pmd-row"><span className="pmd-av" style={{ background: ch[1] + "22", color: ch[1] }}><Icon name="megaphone" cls="ic-sm" /></span><div className="col" style={{ gap: 1, flex: 1 }}><span className="pmd-row-t">{ch[0]}</span><span className="pmd-row-d">{money(chSpend)} spent</span></div><span className="pmd-pill" style={{ color: accent, borderColor: accent + "55" }}>{chRoas.toFixed(1)}×</span></div>); })}
          </div>
        </div>
      </React.Fragment>
    );
  }

  else if (metric === "reviews") {
    const dist = [[5, 0.86], [4, 0.10], [3, 0.03], [2, 0.008], [1, 0.002]];
    const samples = [
      { n: "Sarah O'Brien", st: 5, t: "Absolutely first class from start to finish. Couldn't recommend them more.", d: "2 days ago" },
      { n: "Mark Dunne", st: 5, t: "Quick, professional and great value. Exactly what they promised and on time.", d: "5 days ago" },
      { n: "Emma Ryan", st: 5, t: "Booked in within hours and the job was spotless. Will be back for sure.", d: "1 week ago" },
      { n: "Liam Walsh", st: 4, t: "Really happy with the work, fair price. Tidied up after themselves too.", d: "1 week ago" },
      { n: "Grace Connolly", st: 5, t: "Honestly the best in the area. Sorted everything with zero hassle.", d: "2 weeks ago" }
    ];
    title = "5-star reviews"; sub = c.reviews.rating + " average · " + c.reviews.count + " total · +" + c.reviews.new30 + " this month";
    body = (
      <React.Fragment>
        <div className="pmd-rating-hero">
          <div className="col" style={{ alignItems: "center", gap: 2 }}>
            <span className="pmd-rating-big" style={{ color: accent }}>{c.reviews.rating}</span>
            <span className="portal-stars" style={{ fontSize: 14 }}>{"★★★★★"}</span>
            <span className="pmd-row-d">{c.reviews.count} reviews</span>
          </div>
          <div className="col gap-2" style={{ flex: 1 }}>
            {dist.map(([star, frac], i) => (<div key={i} className="row gap-2" style={{ alignItems: "center", fontSize: 11.5 }}><span style={{ color: "var(--p-mute)", width: 30 }}>{star}★</span><div className="portal-bar" style={{ flex: 1 }}><i style={{ width: (frac * 100) + "%", background: accent }}></i></div><span className="num" style={{ color: "var(--p-mute)", width: 30, textAlign: "right" }}>{Math.round(c.reviews.count * frac)}</span></div>))}
          </div>
        </div>
        <div className="pmd-section">
          <span className="pmd-section-t">Latest reviews</span>
          <div className="col gap-2">
            {samples.map((r, i) => (<div key={i} className="portal-review"><div className="row between" style={{ marginBottom: 5 }}><span className="portal-review-n">{r.n}</span><span className="portal-stars">{"★".repeat(r.st) + "☆".repeat(5 - r.st)}</span></div><p className="portal-review-t">"{r.t}"</p><div className="row between"><span className="portal-review-d">{r.d}</span><span className="pmd-reply"><Icon name="check" cls="ic-sm" />Replied by BizBoost</span></div></div>))}
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <div className="pmd-overlay" onClick={onClose}>
      <div className="pmd-sheet" onClick={e => e.stopPropagation()} style={{ "--p-accent": accent }}>
        <div className="pmd-head">
          {record ? (
            <button className="pmd-back" onClick={() => setRecord(null)}><Icon name="chevL" cls="ic-sm" />All {title.toLowerCase()}</button>
          ) : (
            <div className="col" style={{ gap: 3 }}>
              <span className="pmd-title">{title}</span>
              <span className="pmd-sub">{sub}</span>
            </div>
          )}
          <button className="pmd-close" onClick={onClose}><Icon name="x" /></button>
        </div>
        {record ? <PortalRecord l={record} accent={accent} money={money} onBack={() => setRecord(null)} /> : <div className="pmd-body">{body}</div>}
        <div className="pmd-foot"><span className="row gap-2"><span className="portal-dot" style={{ background: accent }}></span>Live data · updates automatically</span></div>
      </div>
    </div>
  );
}

function LeadRow({ l, money, onClick }) {
  const sm = STATUS_META[l.status];
  return (
    <button className="pmd-row pmd-row-btn" onClick={onClick}>
      <span className="pmd-av" style={{ background: l.srcColor + "22", color: l.srcColor }}>{l.name[0]}</span>
      <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
        <span className="pmd-row-t">{l.name}</span>
        <span className="pmd-row-d pmd-trunc">{l.svc} · via {l.src}</span>
      </div>
      <div className="col" style={{ gap: 3, alignItems: "flex-end" }}>
        <span className="pmd-pill" style={{ color: sm.color, borderColor: sm.color + "55" }}>{sm.label}</span>
        <span className="pmd-ago">{l.ago}</span>
      </div>
      <Icon name="chevR" cls="ic-sm" />
    </button>
  );
}

function PortalStat({ label, value, sub, accent }) {
  return (<div className="pmd-stat"><span className="pmd-stat-v">{value}</span><span className="pmd-stat-l">{label}{sub ? " " + sub : ""}</span></div>);
}

function PortalFunnel({ funnel, accent }) {
  const max = funnel[0].v || 1;
  return (
    <div className="pmd-funnel">
      {funnel.map((f, i) => {
        const pct = f.v / max;
        const conv = i > 0 ? Math.round(f.v / Math.max(funnel[i - 1].v, 1) * 100) : 100;
        return (
          <div key={i} className="pmd-funnel-row">
            <span className="pmd-funnel-l">{f.l}</span>
            <div className="pmd-funnel-bar-wrap"><div className="pmd-funnel-bar" style={{ width: (20 + pct * 80) + "%", background: `color-mix(in srgb, var(--p-accent) ${30 + pct * 70}%, var(--p-surface-2))` }}><span className="num">{f.v}</span></div></div>
            <span className="pmd-funnel-pct">{i > 0 ? conv + "%" : ""}</span>
          </div>
        );
      })}
    </div>
  );
}

window.PortalMetricDetail = PortalMetricDetail;
window.buildPortalLeads = buildLeads;
window.buildPortalTimeline = buildTimeline;
window.PORTAL_STATUS_META = STATUS_META;
