// Per-client onboarding tracker, integrations page, and BizBoost memory.

// =================== ONBOARDING TRACKER (sequential unlock) ===================
function OnboardingTracker({ c, onComplete, onConn }) {
  const O = window.BIZBOOST_ONBOARD;
  const seed = (c.onboarding && c.onboarding.done) || [];
  const [done, setDone] = useState(seed);

  // first not-done in list order is "active"; rest locked
  const order = O.checklist.map(k => k.id);
  const firstOpen = order.find(id => !done.includes(id));
  const statusOf = id => done.includes(id) ? "done" : id === firstOpen ? "active" : "locked";

  const pct = done.length / O.checklist.length;
  const complete = done.length === O.checklist.length;

  function finishTask(id) {
    if (statusOf(id) !== "active") return;
    const next = [...done, id];
    setDone(next);
    if (c.onboarding) c.onboarding.done = next; // persist on the object
    if (next.length === O.checklist.length && c.onboarding) c.onboarding.active = false;
    // if this task connects an account, light up its metrics on the dashboard
    const task = O.checklist.find(k => k.id === id);
    if (task && task.connect && onConn) {
      const set = new Set(c.connected || []);
      // the "Google" task connects the whole google suite
      if (task.connect === "gbp") { set.add("gbp"); set.add("ga4"); set.add("gads"); }
      else if (task.connect === "wa") { set.add("wa"); set.add("cal"); }
      else set.add(task.connect);
      onConn(Array.from(set));
    }
  }

  if (complete) {
    return (
      <div className="panel fadeup" style={{ padding: 28, textAlign: "center", borderColor: "#cfff3a3a", background: "linear-gradient(135deg,#14180d,transparent 60%)" }}>
        <span style={{ width: 50, height: 50, borderRadius: 14, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", margin: "0 auto 14px", boxShadow: "var(--lime-glow)" }}><Icon name="check" cls="ic-lg" /></span>
        <div className="h-display" style={{ fontSize: 26 }}>Onboarding <span className="it">complete.</span></div>
        <p style={{ fontSize: 13, color: "var(--mute)", margin: "8px auto 16px", maxWidth: 360, lineHeight: 1.5 }}>{c.name} is fully live — everything connected, built and launched. This tracker now drops off their dashboard.</p>
        <button onClick={onComplete} className="btn btn-primary" style={{ height: 36, margin: "0 auto" }}><Icon name="arrowR" cls="ic-sm" />Go to live dashboard</button>
      </div>
    );
  }

  return (
    <div className="col gap-4 fadeup">
      {/* progress header */}
      <div className="panel" style={{ padding: 18 }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row gap-3">
            <Ring value={pct} size={48} stroke={5} label={Math.round(pct * 100) + "%"} />
            <div className="col" style={{ gap: 2 }}>
              <span style={{ font: "600 15px var(--sans)" }}>Onboarding in progress</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>{done.length} of {O.checklist.length} done · complete tasks in order to unlock the next</span>
            </div>
          </div>
          <span className="chip chip-amber"><Icon name="clock" cls="ic-sm" />Day {c.onboarded || 0}</span>
        </div>
        <div className="row gap-2">
          {O.groups.map(g => {
            const items = O.checklist.filter(k => k.group === g.id);
            const gdone = items.filter(k => done.includes(k.id)).length;
            return (
              <div key={g.id} className="col gap-2 flex-1">
                <div className="prog"><i style={{ width: (gdone / items.length * 100) + "%", background: g.color }}></i></div>
                <span style={{ fontSize: 10, color: "var(--mute)" }}>{g.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* grouped tasks */}
      {O.groups.map(g => {
        const items = O.checklist.filter(k => k.group === g.id);
        return (
          <div key={g.id} className="panel" style={{ padding: 18 }}>
            <div className="row between" style={{ marginBottom: 14 }}>
              <span className="row gap-2" style={{ font: "600 13px var(--sans)" }}><span style={{ width: 8, height: 8, borderRadius: 3, background: g.color }}></span>{g.label}</span>
              <span className="chip chip-dim">{g.window}</span>
            </div>
            <div className="col gap-2">
              {items.map(k => {
                const st = statusOf(k.id);
                const connItem = k.connect ? O.connectList.find(x => x.id === k.connect) : null;
                return (
                  <div key={k.id} className="row gap-3" style={{
                    padding: "11px 13px", borderRadius: 11,
                    background: st === "active" ? "#cfff3a0c" : "var(--bg-2)",
                    border: "1px solid " + (st === "active" ? "#cfff3a3a" : "var(--line)"),
                    opacity: st === "locked" ? 0.45 : 1, transition: "all .2s"
                  }}>
                    <button onClick={() => finishTask(k.id)} disabled={st !== "active"} style={{
                      width: 20, height: 20, borderRadius: 6, flexShrink: 0, cursor: st === "active" ? "pointer" : "default",
                      border: "1.5px solid " + (st === "done" ? "var(--lime)" : st === "active" ? "var(--lime)" : "var(--line-2)"),
                      background: st === "done" ? "var(--lime)" : "transparent", display: "grid", placeItems: "center", color: "#0a0a0a"
                    }}>{st === "done" ? <Icon name="check" cls="ic-sm" /> : st === "locked" ? <Icon name="shield" cls="ic-sm" /> : null}</button>
                    <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: st === "done" ? "var(--mute)" : "var(--ink-2)", textDecoration: st === "done" ? "line-through" : "none" }}>{k.title}</span>
                      <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{k.owner === "Auto" ? "Automated" : k.owner} {connItem ? "· " + connItem.method : ""}</span>
                    </div>
                    {k.auto && <span className="chip chip-dim" style={{ fontSize: 9 }}>auto</span>}
                    {st === "active" && (
                      <button onClick={() => finishTask(k.id)} className="btn btn-primary" style={{ height: 28 }}>
                        {connItem ? <React.Fragment><Icon name="link" cls="ic-sm" />Connect</React.Fragment> : <React.Fragment><Icon name="check" cls="ic-sm" />Mark done</React.Fragment>}
                      </button>
                    )}
                    {st === "done" && <span className="chip chip-lime" style={{ fontSize: 9.5 }}>done</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =================== CLIENT INTEGRATIONS PAGE ===================
function ClientIntegrations({ c, onConn }) {
  const O = window.BIZBOOST_ONBOARD;
  const seed = c.connected || [];
  const [state, setState] = useState(() => { const o = {}; seed.forEach(id => o[id] = "connected"); return o; });

  // push connected ids up to the client object AFTER commit (never during render)
  useEffect(() => {
    const ids = Object.keys(state).filter(k => state[k] === "connected");
    onConn && onConn(ids);
  }, [state]);

  function connect(id) {
    setState(s => ({ ...s, [id]: "connecting" }));
    setTimeout(() => setState(s => ({ ...s, [id]: "connected" })), 1100);
  }
  function request(id) { setState(s => ({ ...s, [id]: "requested" })); }
  function disconnect(id) { setState(s => { const n = { ...s }; delete n[id]; return n; }); }

  const M = window.BIZBOOST_METRICS;
  const liveClient = { ...c, connected: Object.keys(state).filter(k => state[k] === "connected") };

  const cats = ["Advertising", "Analytics", "Presence", "Payments", "Comms"];
  const total = O.connectList.length;
  const connected = O.connectList.filter(i => state[i.id] === "connected").length;
  const pending = O.connectList.filter(i => !state[i.id] || state[i.id] === "requested");

  return (
    <div className="col gap-4 fadeup">
      {/* header */}
      <div className="panel" style={{ padding: 18, background: "linear-gradient(120deg,#101810,transparent 60%)", borderColor: "#cfff3a2e" }}>
        <div className="row between">
          <div className="row gap-3">
            <Ring value={connected / total} size={48} stroke={5} label={connected + "/" + total} />
            <div className="col" style={{ gap: 2 }}>
              <span style={{ font: "600 15px var(--sans)" }}>Connected accounts</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>Everything we need to run {c.name} end-to-end</span>
            </div>
          </div>
          {pending.length > 0 && (
            <button onClick={() => pending.forEach(p => request(p.id))} className="btn"><Icon name="mail" cls="ic-sm" />Request access pack ({pending.length})</button>
          )}
        </div>
        {/* which dashboard metrics are now live */}
        <div className="row gap-2" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
          {Object.keys(M.SOURCES).map(key => {
            const liveNow = M.live(liveClient, key);
            return (
              <span key={key} className="chip" style={{
                background: liveNow ? "#cfff3a12" : "var(--bg-2)",
                color: liveNow ? "var(--lime)" : "var(--mute-2)",
                borderColor: liveNow ? "#cfff3a3a" : "var(--line)"
              }}>
                {liveNow ? <Icon name="check" cls="ic-sm" /> : <Icon name="link" cls="ic-sm" />}
                {M.SOURCES[key].label}
              </span>
            );
          })}
        </div>
      </div>

      {cats.map(cat => {
        const items = O.connectList.filter(i => i.category === cat);
        if (!items.length) return null;
        return (
          <div key={cat} className="col gap-2">
            <span className="eyebrow">{cat}</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {items.map(it => <ConnectCard key={it.id} item={it} state={state[it.id]} onConnect={connect} onRequest={request} onDisconnect={disconnect} clientName={c.name} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =================== BIZBOOST MEMORY (keeps learning) ===================
function ClientMemory({ c }) {
  const m = c.memory || {};
  // static facts captured at onboarding
  const facts = [
    m.why && { label: "Why them", value: m.why, icon: "flame" },
    m.ideal && { label: "Ideal client", value: m.ideal, icon: "target" },
    m.competitor && { label: "Hunting", value: m.competitor, icon: "trend" },
    m.vibe && { label: "Brand vibe", value: m.vibe, icon: "sparkle" },
    (c.services && c.services.length) && { label: "Lead service", value: c.services[0], icon: "bolt" }
  ].filter(Boolean);

  // observations learned from live metrics (would update continuously)
  const obs = [];
  if (c.leadsΔ > 0.2) obs.push({ t: "2d", kind: "win", text: `Leads accelerating — up ${Math.round(c.leadsΔ * 100)}% MoM. Demand engine is working.` });
  if (c.leadsΔ < 0) obs.push({ t: "1d", kind: "risk", text: `Leads softened ${Math.round(Math.abs(c.leadsΔ) * 100)}% — watching for a fix before it compounds.` });
  if (c.roas >= 5) obs.push({ t: "4d", kind: "win", text: `ROAS holding at ${c.roas.toFixed(1)}x — top quartile. Room to scale spend.` });
  if (c.roas > 0 && c.roas < 3.5) obs.push({ t: "3d", kind: "risk", text: `ROAS at ${c.roas.toFixed(1)}x is below target — creative likely fatigued.` });
  if (c.missedCalls > 3) obs.push({ t: "6h", kind: "risk", text: `${c.missedCalls} missed calls this week — chatbot routing needs a look.` });
  if (c.reviews && c.reviews.new30 > 15) obs.push({ t: "1w", kind: "win", text: `${c.reviews.new30} new 5★ reviews in 30 days — reputation compounding.` });
  if (c.bookingsΔ > 0.15) obs.push({ t: "5d", kind: "trend", text: `Booking rate climbing — qualifying flow converting better.` });
  obs.push({ t: "now", kind: "trend", text: `Tracking ${c.leads30} leads, ${c.bookings30} bookings and €${(c.revenue30 || 0).toLocaleString()} revenue this month.` });

  const kindMap = { win: { c: "var(--lime)", i: "trend" }, risk: { c: "var(--red)", i: "shield" }, trend: { c: "var(--blue)", i: "pulse" } };

  return (
    <div className="col gap-4 fadeup">
      <div className="panel" style={{ padding: 18, background: "linear-gradient(120deg,#14111f,transparent 60%)", borderColor: "#8b7cff3a" }}>
        <div className="row gap-3">
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "#8B7CFF", color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkle" cls="ic-lg" /></span>
          <div className="col" style={{ gap: 2 }}>
            <span className="row gap-2" style={{ font: "600 14px var(--sans)" }}>What BizBoost knows about {c.name.split(" ")[0]}<span className="live-dot" style={{ background: "#8B7CFF" }}></span></span>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>Seeded at onboarding · keeps learning as the numbers move</span>
          </div>
        </div>
      </div>

      <div className="row gap-4 stretch" style={{ alignItems: "flex-start" }}>
        {/* facts */}
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Profile memory" sub="From the onboarding inputs" />
          <div className="col gap-2">
            {facts.length ? facts.map((f, i) => (
              <div key={i} className="col gap-2" style={{ padding: "11px 13px", borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                <span className="row gap-2 eyebrow" style={{ color: "var(--violet)" }}><Icon name={f.icon} cls="ic-sm" />{f.label}</span>
                <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{f.value}</span>
              </div>
            )) : <span style={{ fontSize: 12.5, color: "var(--mute)" }}>No onboarding notes captured yet.</span>}
          </div>
        </div>

        {/* learned timeline */}
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Learned over time" sub="Observations from live metrics" action={<span className="chip chip-violet"><span className="live-dot" style={{ background: "#8B7CFF" }}></span>live</span>} />
          <div className="col" style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 13, top: 6, bottom: 6, width: 1, background: "var(--line)" }}></div>
            {obs.map((o, i) => {
              const k = kindMap[o.kind] || kindMap.trend;
              return (
                <div key={i} className="row gap-3" style={{ padding: "8px 0", position: "relative" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--bg-2)", border: "1px solid var(--line)", color: k.c, zIndex: 1 }}><Icon name={k.i} cls="ic-sm" /></span>
                  <div className="col" style={{ gap: 2, flex: 1 }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{o.text}</span>
                    <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{o.t === "now" ? "just now" : o.t + " ago"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingTracker, ClientIntegrations, ClientMemory });
