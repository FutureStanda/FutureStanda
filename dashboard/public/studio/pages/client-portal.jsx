// Client-facing portal — what the CLIENT sees when they log in.
// Branded to them, reassuring, total transparency: their numbers + what we're doing for them.

function ClientPortal({ id, go }) {
  const c = getClient(id);
  useTasks();
  const [detail, setDetail] = useState(null);
  if (!c) return <div style={{ padding: 40, color: "var(--mute)" }}>Client not found. <button className="btn" onClick={() => go({ page: "clients" })}>Back</button></div>;

  const first = (c.owner || "there").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const accent = c.color || "var(--lime)";
  const [aiOpen, setAiOpen] = useState(false);

  const money = n => "€" + (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : n);
  const pct = n => (n >= 0 ? "+" : "") + Math.round(n * 100) + "%";

  // headline metric
  const leadWord = c.leads30 === 1 ? "lead" : "leads";

  // KPIs framed for the client
  const kpis = [
    { key: "leads", label: "New leads this month", value: c.leads30, delta: c.leadsΔ, icon: "inbox", show: true },
    { key: "bookings", label: "Jobs booked", value: c.bookings30, delta: c.bookingsΔ, icon: "calendar", show: c.bookings30 > 0 },
    { key: "revenue", label: "Revenue tracked", value: money(c.revenue30), delta: c.revenueΔ, icon: "euro", show: c.revenue30 > 0 },
    { key: "roas", label: "Return on ad spend", value: c.roas ? c.roas.toFixed(1) + "×" : "—", icon: "trend", sub: c.roas ? "every €1 → €" + c.roas.toFixed(1) : "no ads yet", show: c.roas > 0 },
    { key: "reviews", label: "5-star reviews", value: c.reviews.rating || "—", icon: "star", sub: c.reviews.new30 ? "+" + c.reviews.new30 + " new · " + c.reviews.count + " total" : c.reviews.count + " total", show: c.reviews.count > 0 }
  ].filter(k => k.show).slice(0, 5);

  // growth series (6 months, trending to current)
  const growth = [
    { m: "Dec", v: Math.round(c.leads30 * 0.42) }, { m: "Jan", v: Math.round(c.leads30 * 0.55) },
    { m: "Feb", v: Math.round(c.leads30 * 0.64) }, { m: "Mar", v: Math.round(c.leads30 * 0.78) },
    { m: "Apr", v: Math.round(c.leads30 * 0.9) }, { m: "May", v: c.leads30 }
  ];

  // lead sources
  const channels = [
    { l: "Facebook", v: Math.round(c.leads30 * 0.42), color: "#4A90E2" },
    { l: "Google", v: Math.round(c.leads30 * 0.31), color: "#34A853" },
    { l: "Website", v: Math.round(c.leads30 * 0.16), color: accent },
    { l: "Referral", v: Math.round(c.leads30 * 0.11), color: "#B98AFF" }
  ];

  return (
    <div className="portal-root" style={{ "--p-accent": accent }}>
      {/* preview banner (admin only) */}
      <div className="portal-preview-bar">
        <span className="row gap-2"><Icon name="eye" cls="ic-sm" />You're previewing {c.name}'s client portal</span>
        <button onClick={() => go({ page: "client", id: c.id })} className="portal-exit">Exit preview<Icon name="x" cls="ic-sm" /></button>
      </div>

      {/* top bar */}
      <header className="portal-top">
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <div className="portal-logo" style={{ background: accent }}>{c.avatar}</div>
          <div className="col" style={{ gap: 1 }}>
            <span className="portal-bizname">{c.name}</span>
            <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--p-mute)" }}><span className="portal-dot"></span>Live · synced just now</span>
          </div>
        </div>
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <button onClick={() => setAiOpen(true)} className="portal-ai-btn" style={{ borderColor: accent + "66", color: accent }}><Icon name="sparkle" cls="ic-sm" />Ask AI</button>
          <span className="portal-powered">Powered by <b>BizBoost</b></span>
          <div className="portal-avatar">{first[0]}</div>
        </div>
      </header>

      <div className="portal-body">
        {/* hero */}
        <section className="portal-hero fadeup">
          <span className="portal-eyebrow">{new Date().toLocaleDateString("en-IE", { weekday: "long", day: "numeric", month: "long" })}</span>
          <h1 className="portal-h1">{greet}, {first}.</h1>
          <p className="portal-lede">
            Your business brought in <b style={{ color: "var(--p-ink)" }}>{c.leads30} new {leadWord}</b> this month
            {c.leadsΔ > 0 && <React.Fragment> — that's <b style={{ color: accent }}>{pct(c.leadsΔ)}</b> on last month</React.Fragment>}.
            {" "}Here's everything we're doing to grow it.
          </p>
        </section>

        {/* KPI row */}
        <section className="portal-kpis fadeup" style={{ animationDelay: ".05s" }}>
          {kpis.map((k, i) => (
            <button key={i} className="portal-kpi portal-kpi-btn" onClick={() => setDetail(k.key)}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <span className="portal-kpi-ic"><Icon name={k.icon} cls="ic-sm" /></span>
                {k.delta != null && <span className="portal-delta" style={{ color: k.delta >= 0 ? accent : "#ff6b5c" }}><Icon name={k.delta >= 0 ? "trend" : "trendDn"} cls="ic-sm" />{pct(k.delta)}</span>}
              </div>
              <div className="portal-kpi-val">{k.value}</div>
              <div className="portal-kpi-label">{k.label}</div>
              {k.sub && <div className="portal-kpi-sub">{k.sub}</div>}
              <span className="portal-kpi-cta">View detail<Icon name="arrowR" cls="ic-sm" /></span>
            </button>
          ))}
        </section>

        {/* growth + sources */}
        <section className="portal-grid-2 fadeup" style={{ animationDelay: ".1s" }}>
          <div className="portal-card">
            <div className="portal-card-head">
              <div className="col" style={{ gap: 2 }}><span className="portal-card-title">Your growth</span><span className="portal-card-sub">New leads, last 6 months</span></div>
              <span className="portal-trend-chip" style={{ color: accent }}><Icon name="trend" cls="ic-sm" />Trending up</span>
            </div>
            <AreaChart data={growth} h={210} color={accent} valueFmt={v => v + " leads"} />
          </div>
          <div className="portal-card">
            <div className="portal-card-head">
              <div className="col" style={{ gap: 2 }}><span className="portal-card-title">Where leads come from</span><span className="portal-card-sub">This month</span></div>
            </div>
            <div className="col gap-3" style={{ marginTop: 6 }}>
              {channels.map((ch, i) => {
                const max = Math.max(...channels.map(x => x.v)) || 1;
                return (
                  <div key={i} className="col gap-2">
                    <div className="row between" style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--p-ink-2)" }}>{ch.l}</span>
                      <span className="num" style={{ color: "var(--p-ink)", fontWeight: 600 }}>{ch.v}</span>
                    </div>
                    <div className="portal-bar"><i style={{ width: (ch.v / max * 100) + "%", background: ch.color }}></i></div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* what we're doing — the transparency core */}
        <PortalWork c={c} accent={accent} money={money} />

        {/* reviews + goals */}
        <section className="portal-grid-2 fadeup" style={{ animationDelay: ".2s" }}>
          <PortalReviews c={c} accent={accent} />
          <PortalGoals c={c} accent={accent} money={money} />
        </section>

        {/* team */}
        <PortalTeam c={c} accent={accent} first={first} />

        <div className="portal-foot">
          <span>BizBoost · {c.name}</span>
          <span>Everything on this page updates in real time.</span>
        </div>
      </div>

      <PortalMetricDetail metric={detail} c={c} accent={accent} money={money} onClose={() => setDetail(null)} />
      <PortalAI open={aiOpen} c={c} accent={accent} first={first} money={money} pct={pct} onClose={() => setAiOpen(false)} />
    </div>
  );
}

// ---- client AI assistant ----
function PortalAI({ open, c, accent, first, money, pct, onClose }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, busy]);
  useEffect(() => { if (open && msgs.length === 0) setMsgs([{ role: "ai", text: `Hi ${first} — I'm your BizBoost assistant. Ask me anything about how your business is doing: your leads, what's working, where your money's going, or what we're doing next.` }]); }, [open]);
  if (!open) return null;

  const suggestions = ["How are my leads doing?", "Where are my customers coming from?", "What are you doing to grow my business?", "Is my ad spend worth it?"];

  function ctx() {
    return `You are the BizBoost client assistant for ${c.name} (${c.niche}, ${c.city}). Speak directly to the owner ${c.owner} in plain, warm, confident language — short paragraphs, no jargon, no markdown headers. You are on their side and proud of the results. Live numbers this month: ${c.leads30} leads (${pct(c.leadsΔ)} vs last month), ${c.bookings30} jobs booked, ${money(c.revenue30)} revenue, ${c.roas ? c.roas.toFixed(1) + "x return on ad spend" : "no paid ads yet"}, ${c.reviews.rating || "no"}-star rating with ${c.reviews.count} reviews (+${c.reviews.new30} this month), ${c.missedCalls} missed calls. Lead sources are mostly Facebook & Google ads plus the website. We run their ads, answer enquiries 24/7, harvest reviews, and keep their site fast. Keep answers to 2-4 sentences unless asked for detail.`;
  }

  async function send(q) {
    const text = (q != null ? q : input).trim();
    if (!text || busy) return;
    setMsgs(m => [...m, { role: "me", text }]); setInput(""); setBusy(true);
    try {
      const reply = await window.claude.complete(ctx() + "\n\nOwner asks: " + text + "\n\nYour reply:");
      setMsgs(m => [...m, { role: "ai", text: (reply || "").trim() || "Let me get back to you on that one." }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "ai", text: "I can't reach the assistant right now — but your numbers are all on this page, and Bartek's a message away." }]);
    }
    setBusy(false);
  }

  return (
    <div className="portal-ai-overlay" onClick={onClose}>
      <div className="portal-ai-panel" onClick={e => e.stopPropagation()} style={{ "--p-accent": accent }}>
        <div className="portal-ai-head">
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <span className="portal-ai-orb" style={{ background: accent }}><Icon name="sparkle" cls="ic-sm" /></span>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ font: "600 14px var(--sans)", color: "var(--p-ink)" }}>Ask about your business</span>
              <span style={{ fontSize: 11, color: "var(--p-mute)" }}>Powered by BizBoost AI · knows your live numbers</span>
            </div>
          </div>
          <button onClick={onClose} className="portal-ai-x"><Icon name="x" cls="ic-sm" /></button>
        </div>
        <div className="portal-ai-msgs" ref={scroller}>
          {msgs.map((m, i) => (
            <div key={i} className={"portal-ai-msg " + m.role}>
              {m.role === "ai" && <span className="portal-ai-av" style={{ background: accent + "22", color: accent }}><Icon name="sparkle" cls="ic-sm" /></span>}
              <div className="portal-ai-bubble" style={m.role === "me" ? { background: accent, color: "#0a0a0a" } : {}}>{m.text}</div>
            </div>
          ))}
          {busy && <div className="portal-ai-msg ai"><span className="portal-ai-av" style={{ background: accent + "22", color: accent }}><Icon name="sparkle" cls="ic-sm" /></span><div className="portal-ai-bubble"><span className="portal-ai-typing"><i></i><i></i><i></i></span></div></div>}
        </div>
        {msgs.length <= 1 && (
          <div className="portal-ai-sugg">
            {suggestions.map((s, i) => <button key={i} onClick={() => send(s)} className="portal-ai-chip">{s}</button>)}
          </div>
        )}
        <div className="portal-ai-input">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask anything about your business…" />
          <button onClick={() => send()} disabled={!input.trim() || busy} style={{ background: accent, opacity: input.trim() && !busy ? 1 : 0.5 }}><Icon name="arrowR" cls="ic-sm" /></button>
        </div>
      </div>
    </div>
  );
}

// ---- what we're handling for you ----
function PortalWork({ c, accent, money }) {
  const dom = c.plan === "Domination";
  // recently completed (this week)
  const done = [
    { icon: "megaphone", t: "Ad campaigns optimised", d: "Refreshed your best-performing ads and trimmed the wasted spend.", when: "Today" },
    { icon: "star", t: c.reviews.new30 + " new reviews collected", d: "We asked happy customers at the right moment — automatically.", when: "This week", show: c.reviews.new30 > 0 },
    { icon: "msg", t: "Every enquiry answered in seconds", d: "Missed calls texted back, questions handled, jobs booked 24/7.", when: "Ongoing" },
    { icon: "globe", t: "Website updated & kept fast", d: "Speed, SEO and content kept sharp so you rank and convert.", when: "This week" },
    { icon: "doc", t: "Content posted to your socials", d: "4 on-brand posts scheduled across the week.", when: "This week", show: dom }
  ].filter(x => x.show !== false);

  // in progress
  const wip = [
    { icon: "trend", t: "Scaling what's working", d: "Pushing more budget behind the campaigns bringing your best jobs." },
    { icon: "sparkle", t: "Testing new ad angles", d: "Two fresh creatives in review to keep your cost-per-lead low." },
    { icon: "shield", t: "Protecting your reputation", d: "Monitoring every review and reply so nothing slips." }
  ];

  return (
    <section className="portal-card portal-work fadeup" style={{ animationDelay: ".15s" }}>
      <div className="portal-card-head">
        <div className="col" style={{ gap: 2 }}>
          <span className="portal-card-title">What we're doing for you</span>
          <span className="portal-card-sub">Real work, happening behind the scenes — so you can focus on the job.</span>
        </div>
        <span className="portal-live-chip"><span className="portal-dot"></span>Live</span>
      </div>

      <div className="portal-work-grid">
        {/* in progress */}
        <div className="col gap-3">
          <span className="portal-work-label" style={{ color: accent }}><span className="portal-dot" style={{ background: accent }}></span>In progress right now</span>
          {wip.map((w, i) => (
            <div key={i} className="portal-work-item portal-work-wip">
              <span className="portal-work-ic" style={{ color: accent, borderColor: accent + "44", background: accent + "14" }}><Icon name={w.icon} cls="ic-sm" /></span>
              <div className="col" style={{ gap: 2 }}><span className="portal-work-t">{w.t}</span><span className="portal-work-d">{w.d}</span></div>
            </div>
          ))}
        </div>
        {/* done */}
        <div className="col gap-3">
          <span className="portal-work-label"><Icon name="check" cls="ic-sm" />Done recently</span>
          {done.map((w, i) => (
            <div key={i} className="portal-work-item">
              <span className="portal-work-ic portal-work-done"><Icon name="check" cls="ic-sm" /></span>
              <div className="col" style={{ gap: 2, flex: 1 }}>
                <div className="row between"><span className="portal-work-t">{w.t}</span><span className="portal-work-when">{w.when}</span></div>
                <span className="portal-work-d">{w.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- reviews showcase ----
function PortalReviews({ c, accent }) {
  const samples = [
    { n: "Sarah O'B.", t: "Absolutely first class from start to finish. Couldn't recommend them more.", d: "2 days ago" },
    { n: "Mark D.", t: "Quick, professional and great value. Exactly what they promised.", d: "5 days ago" },
    { n: "Emma R.", t: "Booked in within hours and the job was spotless. Will be back.", d: "1 week ago" }
  ];
  if (!c.reviews.count) {
    return (
      <div className="portal-card">
        <div className="portal-card-head"><span className="portal-card-title">Your reviews</span></div>
        <div className="portal-empty">Review collection switches on as soon as your first jobs complete.</div>
      </div>
    );
  }
  return (
    <div className="portal-card">
      <div className="portal-card-head">
        <div className="col" style={{ gap: 2 }}><span className="portal-card-title">What your customers say</span><span className="portal-card-sub">{c.reviews.count} reviews · {c.reviews.rating} average</span></div>
        <div className="portal-rating"><Icon name="star" cls="ic-sm" />{c.reviews.rating}</div>
      </div>
      <div className="col gap-2" style={{ marginTop: 4 }}>
        {samples.map((r, i) => (
          <div key={i} className="portal-review">
            <div className="row between" style={{ marginBottom: 5 }}>
              <span className="portal-review-n">{r.n}</span>
              <span className="portal-stars">{"★★★★★"}</span>
            </div>
            <p className="portal-review-t">"{r.t}"</p>
            <span className="portal-review-d">{r.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- growth goals ----
function PortalGoals({ c, accent, money }) {
  const goals = [
    { label: "Monthly leads", cur: c.leads30, tgt: Math.round(c.leads30 * 1.4) + 5, fmt: v => v },
    { label: "5-star reviews", cur: c.reviews.count, tgt: Math.max(c.reviews.count + 40, 50), fmt: v => v },
    { label: "Monthly revenue", cur: c.revenue30, tgt: Math.round(c.revenue30 * 1.5), fmt: money }
  ].filter(g => g.cur > 0);
  return (
    <div className="portal-card">
      <div className="portal-card-head">
        <div className="col" style={{ gap: 2 }}><span className="portal-card-title">Where we're taking you</span><span className="portal-card-sub">Your growth targets</span></div>
      </div>
      <div className="col gap-4" style={{ marginTop: 6 }}>
        {goals.map((g, i) => {
          const r = Math.min(1, g.cur / g.tgt);
          return (
            <div key={i} className="row gap-3" style={{ alignItems: "center" }}>
              <Ring value={r} size={50} stroke={5} color={accent} label={Math.round(r * 100) + "%"} />
              <div className="col" style={{ gap: 2, flex: 1 }}>
                <span className="portal-goal-label">{g.label}</span>
                <span className="portal-goal-val">{g.fmt(g.cur)} <span style={{ color: "var(--p-mute)" }}>of {g.fmt(g.tgt)} target</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- your team ----
function PortalTeam({ c, accent, first }) {
  const dom = c.plan === "Domination";
  return (
    <section className="portal-team fadeup" style={{ animationDelay: ".25s" }}>
      <div className="row gap-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
        <div className="portal-team-av" style={{ background: accent }}>B</div>
        <div className="col" style={{ gap: 3, flex: 1, minWidth: 200 }}>
          <span className="portal-team-name">Bartek — your account manager</span>
          <span className="portal-team-sub">{dom ? "On call weekly. Reach me anytime on WhatsApp." : "Looking after your growth. Message me anytime."}</span>
        </div>
        <div className="row gap-2">
          <button className="portal-btn-ghost"><Icon name="msg" cls="ic-sm" />Message</button>
          <button className="portal-btn" style={{ background: accent }}><Icon name="calendar" cls="ic-sm" />Book a call</button>
        </div>
      </div>
    </section>
  );
}

window.ClientPortal = ClientPortal;
