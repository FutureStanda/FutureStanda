// Client detail — the "everything in one page" deep-dive for a single business.

function KpiCard({ label, value, delta, icon, color, sub, locked, lockSource, onConnect, onDrill }) {
  if (locked) {
    return (
      <button onClick={onConnect} className="panel" style={{ padding: "14px 16px", textAlign: "left", cursor: "pointer", width: "100%", border: "1px dashed var(--line-2)", background: "var(--bg-1)", display: "block" }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#cfff3a55"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line-2)"}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--bg-2)", color: "var(--mute-2)", border: "1px solid var(--line)" }}>
            <Icon name={icon} cls="ic-sm" />
          </span>
          <span style={{ color: "var(--mute-2)" }}><Icon name="link" cls="ic-sm" /></span>
        </div>
        <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: "var(--dim)" }}>— —</div>
        <div style={{ fontSize: 11.5, color: "var(--mute)", marginTop: 2 }}>{label}</div>
        <div className="row gap-2" style={{ fontSize: 10.5, color: "var(--lime)", marginTop: 4, fontWeight: 600 }}>
          <Icon name="plus" cls="ic-sm" />Connect {lockSource}
        </div>
      </button>
    );
  }
  return (
    <button onClick={onDrill} className="panel" style={{ padding: "14px 16px", textAlign: "left", width: "100%", display: "block", cursor: onDrill ? "pointer" : "default", border: "1px solid var(--line)", background: "var(--bg-1)", transition: "border-color .15s, transform .15s" }}
      onMouseEnter={e => { if (onDrill) { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.transform = "translateY(-2px)"; } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.transform = "none"; }}>
      <div className="row between" style={{ marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--bg-2)", color: color || "var(--lime)", border: "1px solid var(--line)" }}>
          <Icon name={icon} cls="ic-sm" />
        </span>
        {delta != null && <Delta v={delta} />}
      </div>
      <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", color: "#fff" }}>{value}</div>
      <div className="row between" style={{ marginTop: 2 }}>
        <div style={{ fontSize: 11.5, color: "var(--mute)" }}>{label}</div>
        {onDrill && <span className="kpi-chev" style={{ color: "var(--mute-2)", opacity: 0, transition: "opacity .15s" }}><Icon name="chevR" cls="ic-sm" /></span>}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--mute-2)", marginTop: 4 }}>{sub}</div>}
    </button>
  );
}

function PanelHead({ title, sub, action }) {
  return (
    <div className="row between" style={{ marginBottom: 16 }}>
      <div className="col" style={{ gap: 2 }}>
        <span style={{ font: "600 14px var(--sans)" }}>{title}</span>
        {sub && <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{sub}</span>}
      </div>
      {action}
    </div>
  );
}

function ClientDetail({ id, go }) {
  const c = getClient(id);
  const D = window.BIZBOOST_DATA;
  const onb = c && c.onboarding && c.onboarding.active;
  const [tab, setTab] = useState(onb ? "onboarding" : "overview");
  const [, force] = useState(0);
  const [drill, setDrill] = useState(null);
  useBrand();
  const M = window.BIZBOOST_METRICS;
  if (!c) return <div style={{ color: "var(--mute)" }}>Client not found.</div>;

  // toggle a connection on the client + re-render so metrics light up
  const onConn = useCallback((next) => { c.connected = next; force(x => x + 1); }, [c]);
  const gotoConnect = () => setTab("integrations");
  const isLive = (key) => M.live(c, key);
  const lockName = (key) => (M.suggestion(key) || {}).primary;

  const clientTasks = D.tasks.filter(t => t.client === c.id);
  const clientActivity = D.activity.filter(a => a.client === c.id);

  // build a 14-day leads series from sparkline or synth
  const series = c.sparkline ? c.sparkline.map((v, i) => ({ m: "d" + (i + 1), v })) : null;

  const revSeries = [
    { m: "Dec", v: c.revenue30 * 0.62 }, { m: "Jan", v: c.revenue30 * 0.7 }, { m: "Feb", v: c.revenue30 * 0.78 },
    { m: "Mar", v: c.revenue30 * 0.86 }, { m: "Apr", v: c.revenue30 * 0.93 }, { m: "May", v: c.revenue30 }
  ];

  const channelBars = [
    { l: "Meta", v: Math.round(c.leads30 * 0.42), color: "#1877F2" },
    { l: "Google", v: Math.round(c.leads30 * 0.31), color: "#34A853" },
    { l: "Organic", v: Math.round(c.leads30 * 0.16), color: "var(--lime)" },
    { l: "Referral", v: Math.round(c.leads30 * 0.11), color: "var(--violet)" }
  ];

  return (
    <div className="col gap-4" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <AdminDrill topic={drill} onClose={() => setDrill(null)} go={go} />
      {/* header */}
      <div className="panel fadeup" style={{ padding: 20, background: `linear-gradient(120deg, ${c.color}14, transparent 55%)`, borderColor: c.color + "33" }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="row gap-4" style={{ minWidth: 0 }}>
            <div className="avatar" style={{ background: c.color, width: 52, height: 52, borderRadius: 14, fontSize: 22 }}>{c.avatar}</div>
            <div className="col" style={{ gap: 6, minWidth: 0 }}>
              <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ font: "600 22px var(--sans)", letterSpacing: "-0.02em" }}>{c.name}</span>
                <HealthPill score={c.health} />
                <PlanBadge plan={c.plan} />
              </div>
              <div className="row gap-3" style={{ color: "var(--mute)", fontSize: 12.5, flexWrap: "wrap" }}>
                <span className="row gap-2" style={{ whiteSpace: "nowrap", flexShrink: 0 }}><Icon name="pin" cls="ic-sm" />{c.city}</span>
                <span className="row gap-2" style={{ whiteSpace: "nowrap", flexShrink: 0 }}><Icon name="globe" cls="ic-sm" />{c.handle}</span>
                <span className="row gap-2" style={{ whiteSpace: "nowrap", flexShrink: 0 }}><Icon name="users" cls="ic-sm" />{c.owner}</span>
                <span className="row gap-2" style={{ whiteSpace: "nowrap", flexShrink: 0 }}><Icon name="clock" cls="ic-sm" />Client since {c.since}</span>
              </div>
            </div>
          </div>
          <div className="row gap-2">
            <button className="btn"><Icon name="globe" cls="ic-sm" />Visit site</button>
            <button onClick={() => go({ page: "client-portal", id: c.id })} className="btn"><Icon name="eye" cls="ic-sm" />Client view</button>
            <button className="btn" style={{ color: "#fff", whiteSpace: "nowrap", background: "var(--bg-3)", borderColor: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" />Ask about {c.name.split(" ")[0]}</button>
            <BrandControl clientId={c.id} />
          </div>
        </div>
        {c.flag && (
          <div className="row gap-2" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
            <span className="chip" style={{ background: c.flag === "At risk" ? "#ff6b5c1c" : "#cfff3a1c", color: c.flag === "At risk" ? "var(--red)" : "var(--lime)", borderColor: "transparent" }}>
              <Icon name={c.flag === "At risk" ? "shield" : "flame"} cls="ic-sm" />{c.flag}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>
              {c.flag === "At risk" ? "ROAS below target and engagement falling — schedule a retention call." :
               c.flag === "Top performer" ? "Strongest account this quarter — ideal candidate for a case study." :
               c.flag === "Upsell opportunity" ? "Consistent demand on Starter — strong fit for a Growth upgrade." :
               c.flag === "Onboarding" ? "Fresh client — work through the onboarding checklist to take them live." :
               "Needs your attention this week."}
            </span>
          </div>
        )}
      </div>

      {/* tab nav */}
      <div className="row gap-2 fadeup" style={{ animationDelay: ".05s", borderBottom: "1px solid var(--line)", paddingBottom: 0 }}>
        {[
          ...(onb ? [["onboarding", "Onboarding"]] : []),
          ["overview", "Overview"], ["tasks", "Tasks"], ["marketing", "Marketing"], ["automations", "Automations"], ["leads", "Leads & calls"],
          ["reputation", "Reputation"], ["integrations", "Integrations"], ["memory", "Memory"]
        ].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "8px 4px", marginRight: 14,
            font: (tab === v ? 600 : 500) + " 13px var(--sans)",
            color: tab === v ? "var(--ink)" : "var(--mute)",
            borderBottom: "2px solid " + (tab === v ? "var(--lime)" : "transparent"),
            marginBottom: -1, display: "flex", alignItems: "center", gap: 6
          }}>
            {v === "onboarding" && <span className="live-dot" style={{ width: 5, height: 5 }}></span>}
            {l}
            {v === "memory" && <Icon name="sparkle" cls="ic-sm" />}
          </button>
        ))}
      </div>

      {/* KPI strip — hidden during onboarding */}
      {tab !== "onboarding" && tab !== "integrations" && tab !== "memory" && tab !== "automations" && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }} className="fadeup">
        <KpiCard label="Leads · 30d" value={c.leads30} delta={c.leadsΔ} icon="inbox" color="var(--lime)"
          locked={!isLive("leads30")} lockSource={lockName("leads30")} onConnect={gotoConnect} onDrill={() => setDrill({ type: "clientMetric", clientId: c.id, metric: "leads" })} />
        <KpiCard label="Booked jobs" value={c.bookings30} delta={c.bookingsΔ} icon="calendar" color="var(--teal)"
          locked={!isLive("bookings30")} lockSource={lockName("bookings30")} onConnect={gotoConnect} onDrill={() => setDrill({ type: "clientMetric", clientId: c.id, metric: "bookings" })} />
        <KpiCard label="Revenue · 30d" value={fmtMoney(c.revenue30)} delta={c.revenueΔ} icon="euro" color="var(--blue)"
          locked={!isLive("revenue30")} lockSource={lockName("revenue30")} onConnect={gotoConnect} onDrill={() => setDrill({ type: "clientMetric", clientId: c.id, metric: "revenue" })} />
        <KpiCard label="ROAS" value={c.roas ? c.roas.toFixed(1) + "x" : "—"} icon="trend" color="var(--amber)" sub={c.roas ? "€" + c.adSpend + " spend" : "no ads"}
          locked={!isLive("roas")} lockSource={lockName("roas")} onConnect={gotoConnect} onDrill={() => setDrill({ type: "clientMetric", clientId: c.id, metric: "roas" })} />
        <KpiCard label="Reviews" value={c.reviews.rating} icon="star" color="var(--amber)" sub={"+" + c.reviews.new30 + " this month · " + c.reviews.count + " total"}
          locked={!isLive("reviews")} lockSource={lockName("reviews")} onConnect={gotoConnect} onDrill={() => setDrill({ type: "clientMetric", clientId: c.id, metric: "reviews" })} />
      </div>
      )}

      {tab === "onboarding" && <OnboardingTracker c={c} onConn={onConn} onComplete={() => setTab("overview")} />}
      {tab === "integrations" && <ClientIntegrations c={c} onConn={onConn} />}
      {tab === "memory" && <ClientMemory c={c} />}
      {tab === "overview" && <OverviewTab c={c} revSeries={revSeries} channelBars={channelBars} series={series} clientActivity={clientActivity} isLive={isLive} lockName={lockName} gotoConnect={gotoConnect} />}
      {tab === "marketing" && <MarketingTab c={c} channelBars={channelBars} />}
      {tab === "automations" && <ClientAutomationsTab c={c} />}
      {tab === "leads" && <LeadsTab c={c} />}
      {tab === "reputation" && <ReputationTab c={c} />}
      {tab === "tasks" && <ClientTasksTab c={c} />}
    </div>
  );
}

function ConnectInline({ name, onConnect }) {
  return (
    <div className="col gap-3" style={{ alignItems: "center", justifyContent: "center", textAlign: "center", padding: "26px 16px", border: "1px dashed var(--line-2)", borderRadius: 12, background: "var(--bg-1)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--bg-2)", color: "var(--mute-2)", border: "1px solid var(--line)" }}><Icon name="link" cls="ic-lg" /></span>
      <span style={{ fontSize: 12.5, color: "var(--mute)", maxWidth: 220, lineHeight: 1.5 }}>Connect {name} to populate this with live data.</span>
      <button onClick={onConnect} className="btn btn-primary" style={{ height: 30 }}><Icon name="plus" cls="ic-sm" />Connect {name}</button>
    </div>
  );
}

function OverviewTab({ c, revSeries, channelBars, series, clientActivity, isLive, lockName, gotoConnect }) {
  isLive = isLive || (() => true);
  lockName = lockName || (() => "");
  gotoConnect = gotoConnect || (() => {});
  return (
    <div className="col gap-4 fadeup">
      {/* revenue + channel */}
      <div className="row gap-4 stretch" style={{ alignItems: "stretch" }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Revenue trend" sub="Last 6 months" action={isLive("revenue30") && <span className="num" style={{ font: "600 18px var(--sans)", color: "#fff" }}>{fmtMoney(c.revenue30)}</span>} />
          {isLive("revenue30")
            ? <AreaChart data={revSeries} h={200} valueFmt={v => fmtMoney(v)} color="var(--lime)" />
            : <ConnectInline name={lockName("revenue30")} onConnect={gotoConnect} />}
        </div>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Lead sources" sub="Where leads come from" />
          {isLive("leads30") ? (
            <React.Fragment>
              <BarChart data={channelBars} h={150} />
              <div className="col gap-2" style={{ marginTop: 14 }}>
                {channelBars.map(ch => (
                  <div key={ch.l} className="row between" style={{ fontSize: 12 }}>
                    <span className="row gap-2" style={{ color: "var(--ink-2)" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ch.color }}></span>{ch.l}</span>
                    <span className="num" style={{ fontWeight: 600 }}>{ch.v}</span>
                  </div>
                ))}
              </div>
            </React.Fragment>
          ) : <ConnectInline name={lockName("leads30")} onConnect={gotoConnect} />}
        </div>
      </div>

      {/* funnel + social + website */}
      <div className="row gap-4 stretch" style={{ alignItems: "stretch" }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Conversion funnel · 30d" />
          {isLive("leads30") ? <Funnel c={c} /> : <ConnectInline name={lockName("leads30")} onConnect={gotoConnect} />}
        </div>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Website" sub={c.handle} />
          <div className="col gap-3">
            <div className="row between">
              <span style={{ color: "var(--mute)", fontSize: 12 }}>Visits · 30d</span>
              {isLive("website")
                ? <span className="row gap-2"><span className="num" style={{ fontWeight: 600 }}>{fmtNum(c.website.visits30)}</span><Delta v={c.website.visitsΔ} /></span>
                : <button onClick={gotoConnect} className="chip" style={{ cursor: "pointer", color: "var(--lime)", borderColor: "#cfff3a3a" }}><Icon name="plus" cls="ic-sm" />{lockName("website")}</button>}
            </div>
            <div className="divider"></div>
            <div className="row between">
              <span style={{ color: "var(--mute)", fontSize: 12 }}>Conversion rate</span>
              <span className="num" style={{ fontWeight: 600, color: isLive("website") ? "var(--ink)" : "var(--dim)" }}>{isLive("website") ? c.website.conv + "%" : "—"}</span>
            </div>
            <div className="divider"></div>
            <div className="row between">
              <span style={{ color: "var(--mute)", fontSize: 12 }}>Missed calls · 7d</span>
              <span className="num" style={{ fontWeight: 600, color: !isLive("missedCalls") ? "var(--dim)" : c.missedCalls > 3 ? "var(--red)" : "var(--ink)" }}>{isLive("missedCalls") ? c.missedCalls : "—"}</span>
            </div>
            <div className="divider"></div>
            <div className="col gap-2" style={{ marginTop: 4 }}>
              <span style={{ color: "var(--mute)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Social following</span>
              {isLive("social") ? (
                <div className="row gap-3" style={{ flexWrap: "wrap" }}>
                  <span className="chip"><span className="dot" style={{ color: "#E1306C" }}></span>IG {fmtNum(c.followers.ig)}</span>
                  <span className="chip"><span className="dot" style={{ color: "#1877F2" }}></span>FB {fmtNum(c.followers.fb)}</span>
                  {c.followers.tt > 0 && <span className="chip"><span className="dot" style={{ color: "#FE2C55" }}></span>TT {fmtNum(c.followers.tt)}</span>}
                </div>
              ) : <button onClick={gotoConnect} className="chip" style={{ cursor: "pointer", width: "fit-content", color: "var(--lime)", borderColor: "#cfff3a3a" }}><Icon name="plus" cls="ic-sm" />Connect {lockName("social")}</button>}
            </div>
          </div>
        </div>
      </div>

      {/* services + recent activity */}
      <div className="row gap-4 stretch" style={{ alignItems: "flex-start" }}>
        <div className="panel" style={{ padding: 18, width: 340, flexShrink: 0 }}>
          <PanelHead title="Services" />
          <div className="col gap-2">
            {c.services.map((s, i) => (
              <div key={i} className="row between" style={{ padding: "8px 0", borderBottom: i < c.services.length - 1 ? "1px solid var(--line)" : "none" }}>
                <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{s}</span>
                <Icon name="chevR" cls="ic-sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Recent activity" />
          {clientActivity.length ? (
            <div className="col gap-2">
              {clientActivity.map((a, i) => (
                <div key={i} className="row gap-3" style={{ padding: "8px 0", alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--lime)", flexShrink: 0 }}></span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-2)", flex: 1 }}>{a.msg}</span>
                  <span style={{ fontSize: 11, color: "var(--mute-2)" }}>{a.t} ago</span>
                </div>
              ))}
            </div>
          ) : <div style={{ color: "var(--mute)", fontSize: 12.5 }}>No recent activity logged.</div>}
        </div>
      </div>
    </div>
  );
}

function Funnel({ c }) {
  const stages = [
    { l: "Impressions", v: c.website.visits30 * 6, color: "#2c3326" },
    { l: "Site visits", v: c.website.visits30, color: "#4a5a36" },
    { l: "Leads", v: c.leads30 * 3, color: "#7e9c46" },
    { l: "Qualified", v: c.leads30, color: "#a8d24f" },
    { l: "Booked", v: c.bookings30, color: "var(--lime)" }
  ];
  const max = stages[0].v;
  return (
    <div className="col gap-2">
      {stages.map((s, i) => (
        <div key={i} className="row gap-3" style={{ alignItems: "center" }}>
          <span style={{ width: 90, fontSize: 12, color: "var(--mute)", flexShrink: 0 }}>{s.l}</span>
          <div style={{ flex: 1, height: 26, borderRadius: 6, background: "var(--bg-2)", overflow: "hidden", position: "relative" }}>
            <div style={{ width: (s.v / max * 100) + "%", height: "100%", background: s.color, borderRadius: 6, transition: "width .8s ease", minWidth: 30 }}></div>
            <span className="num" style={{ position: "absolute", left: 10, top: 0, height: 26, display: "flex", alignItems: "center", fontSize: 11.5, fontWeight: 600, color: i >= 3 ? "#0a0a0a" : "var(--ink)" }}>{fmtNum(s.v)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingTab({ c, channelBars }) {
  const campaigns = [
    { name: c.niche + " · Search", platform: "Google Ads", spend: Math.round(c.adSpend * 0.5), roas: (c.roas * 1.1).toFixed(1), status: "active", color: "#34A853" },
    { name: c.niche + " · Lead form", platform: "Meta", spend: Math.round(c.adSpend * 0.35), roas: (c.roas * 0.9).toFixed(1), status: "active", color: "#1877F2" },
    { name: "Retargeting", platform: "Meta", spend: Math.round(c.adSpend * 0.15), roas: (c.roas * 1.3).toFixed(1), status: c.health < 65 ? "paused" : "active", color: "#1877F2" }
  ];
  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Active campaigns" sub={"€" + c.adSpend + " total spend · 30d"} action={<button className="btn btn-ghost" style={{ height: 28 }}><Icon name="plus" cls="ic-sm" />New campaign</button>} />
        <div className="col gap-2">
          {campaigns.map((cp, i) => (
            <div key={i} className="row between" style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
              <div className="row gap-3">
                <span style={{ width: 8, height: 8, borderRadius: 2, background: cp.color }}></span>
                <div className="col" style={{ gap: 1 }}>
                  <span style={{ font: "600 13px var(--sans)" }}>{cp.name}</span>
                  <span style={{ fontSize: 11, color: "var(--mute)" }}>{cp.platform}</span>
                </div>
              </div>
              <div className="row gap-4">
                <div className="col" style={{ alignItems: "flex-end", gap: 1 }}>
                  <span className="num" style={{ fontWeight: 600, fontSize: 13 }}>€{cp.spend}</span>
                  <span style={{ fontSize: 10, color: "var(--mute)" }}>spend</span>
                </div>
                <div className="col" style={{ alignItems: "flex-end", gap: 1 }}>
                  <span className="num" style={{ fontWeight: 600, fontSize: 13, color: "var(--lime)" }}>{cp.roas}x</span>
                  <span style={{ fontSize: 10, color: "var(--mute)" }}>ROAS</span>
                </div>
                <span className={"chip " + (cp.status === "active" ? "chip-lime" : "chip-dim")} style={{ minWidth: 60, justifyContent: "center" }}>{cp.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="row gap-4 stretch">
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Content calendar" sub="This week" />
          <div className="col gap-2">
            {["Mon · Reel — before/after", "Wed · Google post — offer", "Thu · IG carousel — tips", "Sat · Review highlight"].map((x, i) => (
              <div key={i} className="row gap-3" style={{ padding: "9px 0", borderBottom: i < 3 ? "1px solid var(--line)" : "none" }}>
                <span className="chip chip-teal" style={{ width: 18, height: 18, padding: 0, justifyContent: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{x}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Channel mix" />
          <BarChart data={channelBars} h={160} />
        </div>
      </div>
    </div>
  );
}

function LeadsTab({ c }) {
  const names = ["Sarah O'Brien", "John Walsh", "Mary Collins", "Patrick Doyle", "Emma Ryan", "Ciarán Murphy", "Aoife Brennan", "Tom Kelly"];
  const svc = c.services;
  const leads = names.slice(0, 6).map((n, i) => ({
    name: n, service: svc[i % svc.length],
    status: ["Booked", "New", "Contacted", "Booked", "New", "Quoted"][i],
    src: ["Meta", "Google", "Organic", "Referral", "Meta", "Google"][i],
    time: ["12m", "38m", "1h", "2h", "3h", "5h"][i],
    value: ["€2,400", "—", "€890", "€3,100", "—", "€1,650"][i]
  }));
  const stColor = { Booked: "chip-lime", New: "chip-teal", Contacted: "chip-amber", Quoted: "chip-violet" };
  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="row between" style={{ padding: "16px 18px" }}>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: "600 14px var(--sans)" }}>Lead inbox</span>
            <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{c.leads30} leads · 30d · {c.missedCalls} missed calls auto-recovered</span>
          </div>
          <button className="btn btn-ghost" style={{ height: 28 }}>Export<Icon name="download" cls="ic-sm" /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.4fr 0.9fr 0.8fr 0.7fr 0.6fr", gap: 12, padding: "10px 18px", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
          {["Lead", "Service", "Source", "Status", "Value", "When"].map((h, i) => <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>)}
        </div>
        {leads.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.4fr 0.9fr 0.8fr 0.7fr 0.6fr", gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
            <div className="row gap-2"><span className="avatar avatar-sm" style={{ background: "var(--bg-3)", color: "var(--ink-2)" }}>{l.name[0]}</span><span style={{ fontSize: 12.5, fontWeight: 500 }}>{l.name}</span></div>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>{l.service}</span>
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{l.src}</span>
            <span className={"chip " + stColor[l.status]} style={{ width: "fit-content" }}>{l.status}</span>
            <span className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>{l.value}</span>
            <span style={{ fontSize: 11.5, color: "var(--mute-2)" }}>{l.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReputationTab({ c }) {
  const reviews = [
    { name: "Sarah O'Brien", stars: 5, text: "Absolutely brilliant — fast, tidy and fairly priced. Couldn't recommend more.", time: "2d", src: "Google" },
    { name: "John Walsh", stars: 5, text: "Turned up on time, sorted the job in an hour. Proper professionals.", time: "4d", src: "Google" },
    { name: "Mary Collins", stars: 4, text: "Great work overall, only small delay getting started but happy with the result.", time: "1w", src: "Facebook" }
  ];
  return (
    <div className="col gap-4 fadeup">
      <div className="row gap-4 stretch">
        <div className="panel" style={{ padding: 20, width: 280, flexShrink: 0, textAlign: "center" }}>
          <div className="num" style={{ font: "600 48px var(--sans)", color: "var(--amber)", letterSpacing: "-0.03em" }}>{c.reviews.rating}</div>
          <div className="row gap-2" style={{ justifyContent: "center", color: "var(--amber)", marginBottom: 8 }}>
            {[1,2,3,4,5].map(i => <Icon key={i} name="star" cls="ic-sm" />)}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--mute)" }}>{c.reviews.count} total reviews</div>
          <div className="chip chip-lime" style={{ margin: "12px auto 0", width: "fit-content" }}>+{c.reviews.new30} this month</div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Latest reviews" action={<button className="btn btn-ghost" style={{ height: 28 }}><Icon name="msg" cls="ic-sm" />Request batch</button>} />
          <div className="col gap-3">
            {reviews.map((r, i) => (
              <div key={i} className="col gap-2" style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                <div className="row between">
                  <span className="row gap-2"><span className="avatar avatar-sm" style={{ background: "var(--bg-3)", color: "var(--ink-2)" }}>{r.name[0]}</span><span style={{ font: "600 12.5px var(--sans)" }}>{r.name}</span></span>
                  <div className="row gap-2" style={{ color: "var(--amber)" }}>{Array(r.stars).fill(0).map((_, j) => <Icon key={j} name="star" cls="ic-sm" />)}</div>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>"{r.text}"</span>
                <div className="row gap-2" style={{ color: "var(--mute-2)", fontSize: 11 }}><span>{r.src}</span><span>·</span><span>{r.time} ago</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientTasksTab({ c }) {
  const store = useTasks();
  const [compose, setCompose] = useState(null);
  const tasks = store.forClient(c.id);
  return (
    <div className="panel fadeup" style={{ padding: 18 }}>
      <TaskComposer open={!!compose} initial={compose} onClose={() => setCompose(null)} />
      <PanelHead title="Tasks" sub={tasks.length + " items for " + c.name} action={<button onClick={() => setCompose({ client: c.id })} className="btn btn-ghost" style={{ height: 28 }}><Icon name="plus" cls="ic-sm" />Add task</button>} />
      {tasks.length ? (
        <div className="col gap-2">
          {tasks.map(t => <TaskLine key={t.id} t={t} onEdit={setCompose} onDelete={id => store.remove(id)} />)}
        </div>
      ) : <div style={{ color: "var(--mute)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>All caught up — <button onClick={() => setCompose({ client: c.id })} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>add a task →</button></div>}
    </div>
  );
}

window.ClientDetail = ClientDetail;
