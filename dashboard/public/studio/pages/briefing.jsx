// Briefing — the admin "morning home". Portfolio rollup + AI brief + activity.

function PortfolioStat({ label, value, delta, spark, color, onClick }) {
  return (
    <button className="panel" onClick={onClick} style={{ padding: "16px 18px", flex: 1, minWidth: 0, cursor: "pointer", textAlign: "left", border: "1px solid var(--line)", background: "var(--bg-1)", transition: "border-color .15s, transform .15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span className="eyebrow">{label}</span>
        {delta != null && <Delta v={delta} />}
      </div>
      <div className="num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.03em", color: color || "var(--ink)", marginBottom: 8 }}>{value}</div>
      {spark && <Sparkline data={spark} w={200} h={30} color={color || "var(--lime)"} id={label} />}
    </button>
  );
}

function ActivityIcon({ kind }) {
  const map = {
    lead: { icon: "inbox", color: "var(--lime)" },
    review: { icon: "star", color: "var(--amber)" },
    booking: { icon: "calendar", color: "var(--teal)" },
    ad: { icon: "trend", color: "var(--blue)" },
    missed: { icon: "phoneMissed", color: "var(--red)" },
    ai: { icon: "sparkle", color: "var(--violet)" }
  };
  const m = map[kind] || map.lead;
  return (
    <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--bg-2)", color: m.color, border: "1px solid var(--line)" }}>
      <Icon name={m.icon} cls="ic-sm" />
    </span>
  );
}

function Briefing({ go, onTask }) {
  const D = window.BIZBOOST_DATA;
  const b = D.briefing;
  const [drill, setDrill] = useState(null);
  const totalLeads = D.clients.reduce((a, c) => a + c.leads30, 0);
  const totalRev = D.clients.reduce((a, c) => a + c.revenue30, 0);
  const totalMrr = D.clients.reduce((a, c) => a + c.mrr, 0);
  const avgHealth = Math.round(D.clients.reduce((a, c) => a + c.health, 0) / D.clients.length);
  const atRisk = D.clients.filter(c => c.health < 65);

  // top movers
  const movers = [...D.clients].sort((a, b) => b.leadsΔ - a.leadsΔ);

  return (
    <div className="col gap-5" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <AdminDrill topic={drill} onClose={() => setDrill(null)} go={go} onTask={onTask} />
      {/* hero */}
      <div className="fadeup" style={{ paddingTop: 6 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{b.date}</div>
        <div className="h-display" style={{ fontSize: 50, lineHeight: 1.04, marginBottom: 4 }}>
          Good morning, Bartek.
        </div>
        <div className="h-display" style={{ fontSize: 50, lineHeight: 1.04 }}>
          <span className="outline">9 businesses,</span> <span className="it">one cockpit.</span>
        </div>
      </div>

      {/* portfolio strip */}
      <div className="row gap-3 stretch fadeup" style={{ animationDelay: ".05s" }}>
        <PortfolioStat label="Monthly recurring" value={fmtMoney(totalMrr)} delta={0.13} spark={D.mrrTrend.map(m => m.v)} onClick={() => setDrill({ type: "stat", key: "mrr", label: "Monthly recurring" })} />
        <PortfolioStat label="Leads · 30d" value={totalLeads} delta={0.22} spark={[210, 244, 268, 290, 320, 358, totalLeads]} color="var(--teal)" onClick={() => setDrill({ type: "stat", key: "leads", label: "Leads · 30d" })} />
        <PortfolioStat label="Client revenue · 30d" value={fmtMoney(totalRev)} delta={0.16} spark={[180, 195, 210, 225, 240, 252, 264]} color="var(--blue)" onClick={() => setDrill({ type: "stat", key: "revenue", label: "Client revenue · 30d" })} />
        <PortfolioStat label="Avg health" value={avgHealth} delta={0.04} spark={[78, 79, 77, 80, 81, 80, avgHealth]} color="var(--amber)" onClick={() => setDrill({ type: "stat", key: "health", label: "Avg health" })} />
      </div>

      {/* AI briefing card */}
      <div className="panel fadeup" style={{ padding: 0, overflow: "hidden", animationDelay: ".1s", borderColor: "#cfff3a2e" }}>
        <div className="row between" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", background: "linear-gradient(90deg, #14180d, transparent)" }}>
          <div className="row gap-2">
            <span style={{ width: 24, height: 24, borderRadius: 7, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}>
              <Icon name="sparkle" cls="ic-sm" />
            </span>
            <span style={{ font: "600 13px var(--sans)" }}>Boost · Daily brief</span>
            <span className="chip chip-dim">auto-generated 06:00</span>
          </div>
          <button className="btn btn-ghost" style={{ height: 28 }}><Icon name="refresh" cls="ic-sm" />Regenerate</button>
        </div>
        <div className="row" style={{ alignItems: "stretch" }}>
          <BriefColumn icon="flame" tone="lime" toneLabel="Win" title="Wins" items={b.wins} onOpen={(item) => setDrill({ type: "brief", item, tone: "lime", toneLabel: "Win", icon: "flame" })} />
          <div style={{ width: 1, background: "var(--line)" }}></div>
          <BriefColumn icon="shield" tone="red" toneLabel="Needs you" title="Needs you" items={b.risks} onOpen={(item) => setDrill({ type: "brief", item, tone: "red", toneLabel: "Needs you", icon: "shield" })} />
          <div style={{ width: 1, background: "var(--line)" }}></div>
          <BriefColumn icon="clock" tone="amber" toneLabel="Today" title="Today" items={b.today} onOpen={(item) => setDrill({ type: "brief", item, tone: "amber", toneLabel: "Today", icon: "clock" })} />
        </div>
      </div>

      {/* two-col: movers + activity */}
      <div className="row gap-4 stretch fadeup" style={{ animationDelay: ".15s", alignItems: "flex-start" }}>
        {/* movers */}
        <div className="panel flex-1" style={{ padding: 18 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <span style={{ font: "600 14px var(--sans)" }}>Client momentum</span>
            <button onClick={() => go({ page: "clients" })} className="btn btn-ghost" style={{ height: 26 }}>All clients<Icon name="arrowR" cls="ic-sm" /></button>
          </div>
          <div className="col gap-2">
            {movers.slice(0, 6).map(c => (
              <button key={c.id} onClick={() => go({ page: "client", id: c.id })} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "9px 10px", borderRadius: 10,
                border: "none", cursor: "pointer", background: "transparent", textAlign: "left", transition: "background .12s"
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <Avatar client={c} />
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                  <span className="truncate" style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "#FFFFFF" }}>{c.name}</span>
                  <span style={{ font: "500 11px var(--sans)", color: "var(--mute)" }}>{c.city} · {c.niche}</span>
                </div>
                <Sparkline data={c.sparkline || c.mrrTrend || [c.leads30 * 0.6, c.leads30 * 0.8, c.leads30]} w={70} h={26} color={c.leadsΔ >= 0 ? "var(--lime)" : "var(--red)"} fill={false} id={c.id} />
                <div className="col" style={{ alignItems: "flex-end", gap: 2, width: 64 }}>
                  <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>{c.leads30}</span>
                  <Delta v={c.leadsΔ} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* activity feed */}
        <div className="panel" style={{ padding: 18, width: 380, flexShrink: 0 }}>
          <div className="row between" style={{ marginBottom: 16 }}>
            <span style={{ font: "600 14px var(--sans)" }}>Live activity</span>
            <span className="row gap-2 chip chip-dim"><span className="live-dot"></span>real-time</span>
          </div>
          <div className="col" style={{ gap: 2, maxHeight: 360, overflowY: "auto", margin: "0 -8px", padding: "0 8px" }}>
            {D.activity.map((a, i) => {
              const c = a.client ? getClient(a.client) : null;
              return (
                <button key={i} onClick={() => c && go({ page: "client", id: c.id })} className="row gap-3" style={{ padding: "8px 6px", alignItems: "flex-start", width: "100%", textAlign: "left", background: "transparent", border: "none", borderRadius: 9, cursor: c ? "pointer" : "default", transition: "background .12s" }}
                  onMouseEnter={e => { if (c) e.currentTarget.style.background = "var(--bg-2)"; }}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <ActivityIcon kind={a.kind} />
                  <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.35 }}>{a.msg}</span>
                    <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{c ? c.name + " · " : ""}{a.t} ago</span>
                  </div>
                  {c && <span style={{ color: "var(--mute-2)", flexShrink: 0, marginTop: 2 }}><Icon name="chevR" cls="ic-sm" /></span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefColumn({ icon, tone, title, items, onOpen }) {
  const color = { lime: "var(--lime)", red: "var(--red)", amber: "var(--amber)" }[tone];
  return (
    <div className="col gap-3 flex-1" style={{ padding: "16px 18px", minWidth: 0 }}>
      <div className="row gap-2" style={{ color }}>
        <Icon name={icon} cls="ic-sm" />
        <span style={{ font: "600 12px var(--sans)", color: "var(--ink)" }}>{title}</span>
      </div>
      <div className="col gap-1">
        {items.map((it, i) => (
          <button key={i} onClick={() => onOpen && onOpen(it)} className="brief-item" style={{
            display: "flex", gap: 8, alignItems: "flex-start", width: "100%", textAlign: "left",
            background: "transparent", border: "none", cursor: "pointer", padding: "7px 8px", borderRadius: 9, transition: "background .12s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: color, marginTop: 7, flexShrink: 0 }}></span>
            <span style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4, flex: 1 }}>{it.t}</span>
            <span className="brief-chev" style={{ color: "var(--mute-2)", flexShrink: 0, opacity: 0, transition: "opacity .12s" }}><Icon name="chevR" cls="ic-sm" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

window.Briefing = Briefing;
