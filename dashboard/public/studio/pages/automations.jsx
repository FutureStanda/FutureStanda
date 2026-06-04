// Automations page — mission-control view of every trigger → agent chain.

function Automations({ go }) {
  const A = window.BIZBOOST_AUTOMATIONS;
  const store = useAutomations();
  const chains = store.chains();
  const cadence = store.cadence();
  const [detail, setDetail] = useState(null);   // chain id
  const [creating, setCreating] = useState(false);
  const [manualNew, setManualNew] = useState(false);
  const [builder, setBuilder] = useState(null); // chain id open in canvas
  const [scope, setScope] = useState("agency"); // 'agency' | client id
  const D = window.BIZBOOST_DATA;

  const liveCount = chains.filter(c => c.enabled).length + 2; // + master + optimiser
  const detailChain = detail ? chains.find(c => c.id === detail) : null;
  const scopeChains = scope === "agency" ? chains.filter(c => !c.client) : chains.filter(c => c.client === scope);
  const scopeClient = scope !== "agency" ? D.clients.find(c => c.id === scope) : null;

  return (
    <div className="col gap-5" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 80 }}>

      {/* header */}
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="row gap-2 eyebrow" style={{ margin: 0 }}><span className="live-dot"></span>{liveCount} live · mission control</div>
          <div className="h-display" style={{ fontSize: 40 }}>Automations</div>
          <span style={{ color: "var(--mute)", fontSize: 14 }}>Every trigger, every agent, one view.</span>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ height: 40 }}><Icon name="plus" cls="ic-sm" />New automation</button>
      </div>

      {/* HERO — master chain */}
      <MasterChain master={A.master} />

      {/* AI optimiser */}
      <Optimiser opt={A.optimiser} cadence={cadence} setCadence={v => store.setCadence(v)} />

      {/* grid */}
      <div className="col gap-3">
        <div className="row between" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
          <span className="eyebrow" style={{ margin: 0 }}>{scope === "agency" ? "Agency templates" : (scopeClient ? scopeClient.name + " · automations" : "Automations")}</span>
          <span style={{ fontSize: 12, color: "var(--mute-2)" }}>{scopeChains.filter(c => c.enabled).length} of {scopeChains.length} on</span>
        </div>
        {/* business scope selector */}
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          <button onClick={() => setScope("agency")} className="chip" style={{ height: 30, cursor: "pointer", background: scope === "agency" ? "var(--lime)" : "var(--bg-2)", color: scope === "agency" ? "#0a0a0a" : "var(--ink-2)", borderColor: scope === "agency" ? "var(--lime)" : "var(--line)", fontWeight: scope === "agency" ? 600 : 500 }}><Icon name="layers" cls="ic-sm" />Agency</button>
          {D.clients.map(cl => {
            const on = scope === cl.id; const n = chains.filter(c => c.client === cl.id).length;
            return (
              <button key={cl.id} onClick={() => setScope(cl.id)} className="chip" style={{ height: 30, cursor: "pointer", background: on ? cl.color : "var(--bg-2)", color: on ? "#0a0a0a" : "var(--ink-2)", borderColor: on ? cl.color : "var(--line)", fontWeight: on ? 600 : 500 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: on ? "#0a0a0a" : cl.color }}></span>{cl.name.split(" ")[0]}{n > 0 && <span style={{ opacity: .7 }}>· {n}</span>}
              </button>
            );
          })}
        </div>
        {scope !== "agency" && (
          <div className="panel" style={{ padding: "11px 14px", background: scopeClient ? scopeClient.color + "10" : "var(--bg-1)", borderColor: scopeClient ? scopeClient.color + "33" : "var(--line)" }}>
            <span className="row gap-2" style={{ fontSize: 12, color: "var(--ink-2)" }}><Icon name="sparkle" cls="ic-sm" />Automations built here run only for <b style={{ color: "#fff" }}>{scopeClient ? scopeClient.name : ""}</b>. Use <b>New automation</b> to build one specific to them.</span>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 14 }}>
          {scopeChains.map(c => <ChainCard key={c.id} c={c} onToggle={() => store.toggle(c.id)} onOpen={() => setDetail(c.id)} />)}
          {scopeChains.length === 0 && (
            <div className="panel" style={{ padding: 30, textAlign: "center", color: "var(--mute)", gridColumn: "1 / -1" }}>
              No automations for {scopeClient ? scopeClient.name : "this"} yet. <button onClick={() => setCreating(true)} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>Build one with Claude →</button>
            </div>
          )}
        </div>
      </div>

      {detailChain && <ChainDetail c={detailChain} store={store} onClose={() => setDetail(null)} onToggle={() => store.toggle(detailChain.id)} onDelete={() => { store.remove(detailChain.id); setDetail(null); }} onBuild={() => { setBuilder(detailChain.id); setDetail(null); }} />}
      {builder && <AutomationCanvas c={chains.find(x => x.id === builder)} store={store} onClose={() => setBuilder(null)} />}
      {creating && <BuildWithClaude store={store} client={scope === "agency" ? null : scope} clientName={scopeClient ? scopeClient.name : null} onClose={() => setCreating(false)} onBuilt={(id) => { setCreating(false); setBuilder(id); }} onManual={() => { setCreating(false); setManualNew(true); }} />}
      {manualNew && <NewAutomation store={store} onClose={() => setManualNew(false)} onCreated={(c) => { setManualNew(false); setDetail(c.id); }} />}
    </div>
  );
}

// ---------- HERO master chain ----------
function MasterChain({ master }) {
  return (
    <div className="panel fadeup" style={{ padding: 0, overflow: "hidden", border: "1px solid var(--line-2)", background: "linear-gradient(135deg, #11140e 0%, var(--bg-1) 55%)" }}>
      {/* header strip */}
      <div className="row between" style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-3">
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)", flexShrink: 0 }}><Icon name="bolt" /></span>
          <div className="col" style={{ gap: 2 }}>
            <div className="row gap-2"><span style={{ font: "600 16px var(--sans)" }}>{master.name}</span><span className="chip chip-lime" style={{ height: 20 }}><span className="live-dot"></span>Active</span></div>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>The core chain — fires end-to-end the moment a client pays. {master.runsToday} run today · {master.lastRun}</span>
          </div>
        </div>
        <span className="chip chip-dim" style={{ flexShrink: 0 }}>Master</span>
      </div>

      {/* flow */}
      <div style={{ padding: "26px 22px", overflowX: "auto" }}>
        <div className="row" style={{ gap: 0, alignItems: "stretch", minWidth: "min-content" }}>
          {/* trigger */}
          <div className="col" style={{ alignItems: "center", gap: 8, flexShrink: 0, width: 150 }}>
            <span className="eyebrow" style={{ margin: 0, color: "var(--lime)" }}>Trigger</span>
            <div className="col" style={{ alignItems: "center", gap: 9, padding: "16px 12px", borderRadius: 14, background: "var(--lime-soft, #cfff3a14)", border: "1px solid #cfff3a44", width: "100%" }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name={master.trigger.icon} /></span>
              <span style={{ font: "600 13px var(--sans)", textAlign: "center", color: "#fff" }}>{master.trigger.label}</span>
              <span style={{ fontSize: 10.5, color: "var(--mute)", textAlign: "center", lineHeight: 1.35 }}>{master.trigger.sub}</span>
            </div>
          </div>

          {/* steps */}
          {master.steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <FlowConnector index={i} />
              <div className="col" style={{ alignItems: "center", gap: 8, flexShrink: 0, width: 158 }}>
                <span className="eyebrow" style={{ margin: 0, color: "var(--mute-2)" }}>Step {i + 1}</span>
                <div className="auto-step col" style={{ gap: 9, padding: "16px 13px", borderRadius: 14, background: "var(--bg-2)", border: "1px solid var(--line-2)", width: "100%", height: "calc(100% - 24px)" }}>
                  <div className="row between" style={{ width: "100%" }}>
                    <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-3)", color: "var(--lime)", display: "grid", placeItems: "center", border: "1px solid var(--line-2)" }}><Icon name={s.icon} cls="ic-sm" /></span>
                    <StatusPill status={s.status} />
                  </div>
                  <span style={{ font: "600 12.5px var(--sans)", lineHeight: 1.25, color: "#fff" }}>{s.name}</span>
                  <span style={{ fontSize: 10.5, color: "var(--mute)", lineHeight: 1.4, flex: 1 }}>{s.desc}</span>
                  <span className="chip chip-dim" style={{ height: 18, fontSize: 9.5, alignSelf: "flex-start" }}><Icon name="sparkle" cls="ic-sm" />{s.agent}</span>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function FlowConnector({ index }) {
  return (
    <div className="col" style={{ justifyContent: "center", alignItems: "center", flexShrink: 0, width: 30, paddingTop: 20 }}>
      <div style={{ position: "relative", width: "100%", height: 2, background: "linear-gradient(90deg, var(--line-3), var(--line-2))", borderRadius: 2 }}>
        <span className="flow-pulse" style={{ animationDelay: (index * 0.4) + "s" }}></span>
      </div>
      <Icon name="chevR" cls="ic-sm" />
    </div>
  );
}

function StatusPill({ status }) {
  const active = status === "active";
  return (
    <span className="chip" style={{ height: 18, fontSize: 9, padding: "0 7px", background: active ? "#cfff3a18" : "var(--bg-3)", borderColor: active ? "#cfff3a44" : "var(--line-2)", color: active ? "var(--lime)" : "var(--mute-2)" }}>
      {active && <span className="live-dot" style={{ width: 5, height: 5 }}></span>}{active ? "Active" : "Idle"}
    </span>
  );
}

// ---------- AI optimiser ----------
// ---------- AI optimiser (live engine) ----------
function Optimiser({ opt, cadence, setCadence }) {
  const E = window.BIZBOOST_OPTIMISER;
  useObjectives(); useTasks(); // re-render when underlying data changes
  const cadences = [["realtime", "Real-time"], ["hourly", "Hourly"], ["daily", "Daily"]];
  const [phase, setPhase] = useState("idle"); // idle | scanning | ready
  const [recs, setRecs] = useState([]);
  const [applied, setApplied] = useState({});
  const [lastRun, setLastRun] = useState(null);
  const snap = E ? E.snapshot() : { objAvg: 0, objCount: 0, doneToday: 0, openP0: 0 };

  function run() {
    setPhase("scanning");
    setTimeout(() => {
      setRecs(E.analyse());
      setPhase("ready");
      setLastRun(new Date());
    }, 1100);
  }
  function applyRec(r) {
    if (r.apply) { r.apply(); setApplied(a => ({ ...a, [r.id]: true })); }
  }
  function applyAll() {
    recs.forEach(r => { if (r.apply && !r.applied()) r.apply(); });
    setApplied(a => { const n = { ...a }; recs.forEach(r => { if (r.apply) n[r.id] = true; }); return n; });
  }

  const toneMap = {
    win: ["var(--lime)", "#cfff3a14", "#cfff3a3a"],
    info: ["var(--blue)", "#5bcefa12", "#5bcefa33"],
    warn: ["var(--amber)", "#ffb54712", "#ffb54733"]
  };
  const actionable = recs.filter(r => r.apply && !applied[r.id] && !(r.applied && r.applied()));

  return (
    <div className="panel fadeup" style={{ padding: 0, overflow: "hidden", borderColor: "#8b7cff3a", background: "linear-gradient(135deg, #13111d 0%, var(--bg-1) 55%)" }}>
      {/* header */}
      <div className="row between" style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", flexWrap: "wrap", gap: 14 }}>
        <div className="row gap-3">
          <span style={{ width: 42, height: 42, borderRadius: 13, background: "#8B7CFF", color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "0 0 22px #8b7cff55" }}><Icon name="sparkle" /></span>
          <div className="col" style={{ gap: 3 }}>
            <div className="row gap-2"><span style={{ font: "600 17px var(--sans)" }}>{opt.name}</span><span className="chip chip-violet" style={{ height: 20 }}><span className="live-dot" style={{ background: "#8B7CFF" }}></span>Live</span></div>
            <span style={{ fontSize: 12.5, color: "var(--mute)", maxWidth: 440, lineHeight: 1.45 }}>Reads your live objectives, tasks and accounts — then re-prioritises to drive every goal forward.</span>
          </div>
        </div>
        <button onClick={run} disabled={phase === "scanning"} className="btn" style={{ height: 38, background: "#8B7CFF", color: "#0a0a0a", border: "none", fontWeight: 600, opacity: phase === "scanning" ? 0.7 : 1 }}>
          {phase === "scanning" ? <React.Fragment><span className="live-dot" style={{ background: "#0a0a0a" }}></span>Scanning…</React.Fragment> : <React.Fragment><Icon name="refresh" cls="ic-sm" />Run optimiser</React.Fragment>}
        </button>
      </div>

      {/* live snapshot stats */}
      <div className="row" style={{ borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
        <OptStat label="Avg objective" value={Math.round(snap.objAvg * 100) + "%"} sub={snap.objCount + " tracked"} accent="#8B7CFF" />
        <OptStat label="Done today" value={snap.doneToday} sub="tasks shipped" accent="var(--lime)" />
        <OptStat label="Urgent open" value={snap.openP0} sub="P0 in queue" accent={snap.openP0 >= 4 ? "var(--amber)" : "var(--mute)"} />
        <OptStat label="Last sweep" value={lastRun ? "just now" : "—"} sub={cadence === "realtime" ? "+ on every change" : cadence === "hourly" ? "+ hourly" : "+ daily 09:00"} accent="var(--blue)" last />
      </div>

      {/* body */}
      <div className="col gap-3" style={{ padding: "18px 22px" }}>
        <div className="row between">
          <span className="eyebrow" style={{ margin: 0 }}>{phase === "ready" ? recs.length + " recommendations" : "Recommendations"}</span>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            {actionable.length > 1 && <button onClick={applyAll} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "#8B7CFF", font: "600 11.5px var(--sans)", display: "flex", alignItems: "center", gap: 5 }}><Icon name="bolt" cls="ic-sm" />Apply all ({actionable.length})</button>}
            {/* cadence */}
            <div className="row" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 999, padding: 3, gap: 2 }}>
              {cadences.map(([v, l]) => (
                <button key={v} onClick={() => setCadence(v)} style={{
                  height: 24, padding: "0 11px", borderRadius: 999, border: "none", cursor: "pointer",
                  background: cadence === v ? "#8B7CFF" : "transparent", color: cadence === v ? "#0a0a0a" : "var(--mute)",
                  font: (cadence === v ? 600 : 500) + " 11px var(--sans)"
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        {phase === "idle" && (
          <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", padding: "26px 0" }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "#8B7CFF", display: "grid", placeItems: "center" }}><Icon name="sparkle" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>Ready to optimise</span>
            <span style={{ fontSize: 12.5, color: "var(--mute)", maxWidth: 320, lineHeight: 1.5 }}>Run a sweep and I'll scan every objective, key result and task — then hand you the highest-leverage moves.</span>
            <button onClick={run} className="btn" style={{ height: 34, marginTop: 4, background: "#8B7CFF", color: "#0a0a0a", border: "none", fontWeight: 600 }}><Icon name="refresh" cls="ic-sm" />Run optimiser</button>
          </div>
        )}

        {phase === "scanning" && (
          <div className="col gap-2" style={{ padding: "8px 0" }}>
            {["Reading objectives & key results", "Cross-checking today's tasks", "Scoring account health & ROAS", "Ranking the highest-leverage moves"].map((t, i) => (
              <div key={i} className="row gap-3 opt-scan" style={{ padding: "9px 0", animationDelay: (i * 0.18) + "s", fontSize: 12.5, color: "var(--ink-2)" }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: "var(--bg-2)", border: "1px solid var(--line)", color: "#8B7CFF", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="sparkle" cls="ic-sm" /></span>
                {t}
                <span className="live-dot" style={{ background: "#8B7CFF", marginLeft: "auto" }}></span>
              </div>
            ))}
          </div>
        )}

        {phase === "ready" && recs.length === 0 && (
          <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", padding: "24px 0" }}>
            <span style={{ width: 44, height: 44, borderRadius: 13, background: "#cfff3a14", border: "1px solid #cfff3a3a", color: "var(--lime)", display: "grid", placeItems: "center" }}><Icon name="check" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>Everything's on track</span>
            <span style={{ fontSize: 12.5, color: "var(--mute)" }}>No high-leverage moves right now — your goals are pacing well.</span>
          </div>
        )}

        {phase === "ready" && recs.map(r => {
          const [col, bg, bd] = toneMap[r.tone] || toneMap.info;
          const isApplied = applied[r.id] || (r.applied && r.applied());
          return (
            <div key={r.id} className="row gap-3 opt-rec" style={{ padding: "12px 14px", borderRadius: 12, background: bg, border: "1px solid " + bd }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-1)", border: "1px solid " + bd, color: col, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={r.icon} cls="ic-sm" /></span>
              <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ gap: 10 }}>
                  <span style={{ font: "600 13px var(--sans)", color: "#fff" }}>{r.title}</span>
                  <span className="chip" style={{ height: 18, fontSize: 9.5, background: "transparent", borderColor: col + "66", color: col, flexShrink: 0 }}>{r.impact}</span>
                </div>
                <span style={{ fontSize: 11.5, color: "var(--mute)", lineHeight: 1.5 }}>{r.detail}</span>
                {r.apply && (
                  <div className="row" style={{ marginTop: 5 }}>
                    {isApplied
                      ? <span className="chip chip-lime" style={{ height: 22 }}><Icon name="check" cls="ic-sm" />Applied</span>
                      : <button onClick={() => applyRec(r)} className="btn" style={{ height: 26, background: col, color: "#0a0a0a", border: "none", fontWeight: 600, fontSize: 11.5 }}><Icon name="bolt" cls="ic-sm" />Apply</button>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OptStat({ label, value, sub, accent, last }) {
  return (
    <div className="col gap-1" style={{ padding: "14px 22px", flex: 1, minWidth: 140, borderRight: last ? "none" : "1px solid var(--line)" }}>
      <span className="eyebrow" style={{ margin: 0 }}>{label}</span>
      <span className="num" style={{ font: "700 24px var(--sans)", color: accent, letterSpacing: "-0.02em" }}>{value}</span>
      <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{sub}</span>
    </div>
  );
}

// ---------- chain card ----------
function ChainCard({ c, onToggle, onOpen }) {
  return (
    <div onClick={onOpen} className="auto-card panel" style={{ padding: 16, cursor: "pointer", opacity: c.enabled ? 1 : 0.62, transition: "opacity .2s, border-color .2s, transform .15s" }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: c.accent + "1f", color: c.accent, border: "1px solid " + c.accent + "44", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={c.icon} cls="ic-sm" /></span>
        <Toggle on={c.enabled} onClick={e => { e.stopPropagation(); onToggle(); }} />
      </div>
      <span style={{ font: "600 14px var(--sans)", color: "#fff" }}>{c.name}</span>
      <div className="row gap-2" style={{ margin: "10px 0 12px", flexWrap: "wrap" }}>
        <span className="chip" style={{ height: 22, background: "var(--bg-2)", borderColor: "var(--line-2)", color: "var(--ink-2)" }}><Icon name="bolt" cls="ic-sm" />{c.trigger}</span>
        <Icon name="arrowR" cls="ic-sm" />
        <span className="chip" style={{ height: 22, background: "var(--bg-2)", borderColor: "var(--line-2)", color: "var(--ink-2)" }}>{c.action}</span>
      </div>
      <div className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
        <span className="row gap-2" style={{ fontSize: 11, color: c.enabled ? "var(--mute)" : "var(--mute-2)" }}>
          {c.enabled ? <React.Fragment><span className="live-dot" style={{ background: c.ok ? "var(--lime)" : "var(--red)" }}></span>Last run {c.lastRun}</React.Fragment> : <React.Fragment><Icon name="pause" cls="ic-sm" />Paused</React.Fragment>}
        </span>
        <span className="num" style={{ fontSize: 11, color: "var(--mute-2)" }}>{c.runs.toLocaleString()} runs</span>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 23, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, flexShrink: 0,
      background: on ? "var(--lime)" : "var(--bg-3)", transition: "background .2s", position: "relative"
    }}>
      <span style={{ display: "block", width: 19, height: 19, borderRadius: 999, background: on ? "#0a0a0a" : "var(--mute)", transform: on ? "translateX(17px)" : "translateX(0)", transition: "transform .2s" }}></span>
    </button>
  );
}

// ---------- detail drawer ----------
function ChainDetail({ c, store, onClose, onToggle, onDelete, onBuild }) {
  const TRIGGERS = ["Status changes", "Lead created", "Missed call", "New review", "Slot booked", "No reply in 48h", "Health drops < 65", "Every Mon 08:00", "Every Thu 10:00", "Metric threshold"];
  const STEP_ICONS = ["sparkle", "checkSquare", "msg", "bell", "megaphone", "target", "inbox", "calendar", "star", "phoneMissed", "trend", "shield", "euro", "layers", "refresh"];
  const seedSteps = (store && store.detailSteps(c.id)) || [
    { icon: "bolt", name: c.trigger, desc: "Trigger condition met" },
    { icon: "sparkle", name: "AI processes", desc: "Agent evaluates and acts" },
    { icon: c.icon, name: c.action, desc: "Action fires automatically" }
  ];
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  const [trigger, setTrigger] = useState(c.trigger);
  const [steps, setSteps] = useState(seedSteps);
  const [stepEdit, setStepEdit] = useState(null); // index being edited
  const [iconPick, setIconPick] = useState(null);
  const [cfgStep, setCfgStep] = useState(null); // index being hooked up (view mode)

  const HOOKS = [
    { id: "meta", name: "Meta / Facebook", icon: "megaphone", color: "#4A90E2" },
    { id: "google", name: "Google", icon: "trend", color: "#34A853" },
    { id: "gbp", name: "Google Business", icon: "star", color: "#FFB547" },
    { id: "wa", name: "WhatsApp", icon: "msg", color: "#25D366" },
    { id: "stripe", name: "Stripe", icon: "euro", color: "#8B7CFF" },
    { id: "cal", name: "Calendar", icon: "calendar", color: "#5BCEFA" },
    { id: "ai", name: "AI Agent", icon: "sparkle", color: "#CFFF3A" },
    { id: "sms", name: "SMS / Phone", icon: "phoneMissed", color: "#FF7A8A" }
  ];

  function persistSteps(ns) { setSteps(ns); store.setDetailSteps(c.id, ns); store.patchChain(c.id, {}); }
  function hookStep(i, patch) { persistSteps(steps.map((s, idx) => idx === i ? { ...s, ...patch } : s)); }

  function save() {
    store.patchChain(c.id, { name: name.trim() || c.name, trigger, action: steps.length ? steps[steps.length - 1].name : c.action });
    store.setDetailSteps(c.id, steps);
    setEdit(false); setStepEdit(null);
  }
  function addStep() { const ns = [...steps, { icon: "sparkle", name: "New step", desc: "Describe what happens" }]; setSteps(ns); setStepEdit(ns.length - 1); }
  function setStep(i, p) { setSteps(steps.map((s, idx) => idx === i ? { ...s, ...p } : s)); }
  function removeStep(i) { setSteps(steps.filter((_, idx) => idx !== i)); setStepEdit(null); }
  function move(i, dir) { const j = i + dir; if (j < 0 || j >= steps.length) return; const ns = [...steps]; [ns[i], ns[j]] = [ns[j], ns[i]]; setSteps(ns); setStepEdit(j); }

  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", font: "400 12.5px var(--sans)", padding: "8px 10px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "#04050577", backdropFilter: "blur(3px)" }}></div>
      <div className="slide-in-r col" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 500, maxWidth: "94vw", background: "var(--elev)", borderLeft: "1px solid var(--line-2)", boxShadow: "-20px 0 60px #0009" }}>
        <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: c.accent + "1f", color: c.accent, border: "1px solid " + c.accent + "44", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={c.icon} cls="ic-sm" /></span>
            <div className="col" style={{ gap: 1, minWidth: 0 }}>
              {edit
                ? <input value={name} onChange={e => setName(e.target.value)} style={{ ...inp, font: "600 14px var(--sans)" }} />
                : <div className="row gap-2"><span style={{ font: "600 15px var(--sans)" }}>{c.name}</span>{c.created && <span className="chip chip-lime" style={{ height: 18, fontSize: 9 }}>Created by you</span>}</div>}
              <span style={{ fontSize: 11, color: "var(--mute)" }}>{(c.runs || 0).toLocaleString()} total runs · last {c.lastRun}</span>
            </div>
          </div>
          <div className="row gap-2" style={{ flexShrink: 0 }}>
            {!edit && <button onClick={() => onBuild && onBuild()} className="btn" style={{ height: 30 }}><Icon name="layers" cls="ic-sm" />Open builder</button>}
            {!edit && <button onClick={() => { setName(c.name); setTrigger(c.trigger); setSteps(seedSteps); setEdit(true); }} className="btn" style={{ height: 30 }}><Icon name="edit" cls="ic-sm" />Edit</button>}
            <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
          </div>
        </div>

        <div className="col gap-4" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* on/off */}
          <div className="row between panel" style={{ padding: "12px 14px" }}>
            <div className="col" style={{ gap: 1 }}><span style={{ font: "600 13px var(--sans)" }}>{c.enabled ? "Automation is on" : "Automation is paused"}</span><span style={{ fontSize: 11, color: "var(--mute)" }}>{c.enabled ? "Running automatically" : "No actions will fire"}</span></div>
            <Toggle on={c.enabled} onClick={onToggle} />
          </div>

          {/* chain */}
          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>The chain {edit && <span style={{ color: "var(--mute-2)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· editing</span>}</span>
            <div className="col" style={{ position: "relative" }}>
              {/* trigger */}
              <div className="row gap-3" style={{ padding: "12px 13px", borderRadius: 12, background: "#cfff3a0e", border: "1px solid #cfff3a3a", position: "relative", zIndex: 1 }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="bolt" cls="ic-sm" /></span>
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <span className="eyebrow" style={{ margin: 0, color: "var(--lime)" }}>When</span>
                  {edit
                    ? <select value={trigger} onChange={e => setTrigger(e.target.value)} style={{ ...inp, cursor: "pointer" }}>{TRIGGERS.concat(TRIGGERS.includes(trigger) ? [] : [trigger]).map(t => <option key={t} value={t}>{t}</option>)}</select>
                    : <span style={{ font: "600 13px var(--sans)" }}>{c.trigger}</span>}
                </div>
              </div>
              <div style={{ width: 2, height: 16, background: "var(--line-2)", marginLeft: 28 }}></div>
              {steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="row gap-3 auto-detail-step" style={{ padding: "12px 13px", borderRadius: 12, background: stepEdit === i ? "var(--bg-3)" : "var(--bg-2)", border: "1px solid " + (stepEdit === i ? "var(--line-3)" : "var(--line)"), alignItems: stepEdit === i ? "flex-start" : "center" }}>
                    <button onClick={() => edit && setIconPick(iconPick === i ? null : i)} style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-3)", color: c.accent, border: "1px solid var(--line-2)", display: "grid", placeItems: "center", flexShrink: 0, cursor: edit ? "pointer" : "default" }}><Icon name={s.icon} cls="ic-sm" /></button>
                    {stepEdit === i ? (
                      <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                        {iconPick === i && (
                          <div className="row gap-1" style={{ flexWrap: "wrap", padding: 6, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 8 }}>
                            {STEP_ICONS.map(ic => <button key={ic} onClick={() => { setStep(i, { icon: ic }); setIconPick(null); }} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid " + (s.icon === ic ? c.accent : "var(--line-2)"), background: s.icon === ic ? c.accent + "22" : "var(--bg-2)", color: s.icon === ic ? c.accent : "var(--mute)", cursor: "pointer", display: "grid", placeItems: "center" }}><Icon name={ic} cls="ic-sm" /></button>)}
                          </div>
                        )}
                        <input value={s.name} onChange={e => setStep(i, { name: e.target.value })} placeholder="Step name" style={{ ...inp, font: "600 12.5px var(--sans)" }} />
                        <textarea value={s.desc} onChange={e => setStep(i, { desc: e.target.value })} placeholder="What happens" rows={2} style={{ ...inp, resize: "vertical", lineHeight: 1.4 }} />
                        <div className="row gap-2">
                          <button onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost" style={{ width: 28, height: 26, border: "1px solid var(--line-2)", borderRadius: 7, cursor: i === 0 ? "default" : "pointer", color: "var(--mute)", opacity: i === 0 ? 0.4 : 1, display: "grid", placeItems: "center" }}><Icon name="chevU" cls="ic-sm" /></button>
                          <button onClick={() => move(i, 1)} disabled={i === steps.length - 1} className="btn-ghost" style={{ width: 28, height: 26, border: "1px solid var(--line-2)", borderRadius: 7, cursor: i === steps.length - 1 ? "default" : "pointer", color: "var(--mute)", opacity: i === steps.length - 1 ? 0.4 : 1, display: "grid", placeItems: "center" }}><Icon name="chevD" cls="ic-sm" /></button>
                          <button onClick={() => removeStep(i)} className="btn-ghost" style={{ height: 26, padding: "0 8px", border: "1px solid var(--line-2)", borderRadius: 7, cursor: "pointer", color: "var(--red)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Icon name="trash" cls="ic-sm" />Remove</button>
                          <button onClick={() => setStepEdit(null)} className="btn" style={{ height: 26, marginLeft: "auto", fontSize: 11 }}>Done</button>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => !edit && setCfgStep(cfgStep === i ? null : i)} className="col" style={{ gap: 2, flex: 1, minWidth: 0, cursor: edit ? "default" : "pointer" }}>
                        <span style={{ font: "600 13px var(--sans)", color: "#fff" }}>{s.name}</span>
                        <span style={{ fontSize: 11.5, color: "var(--mute)", lineHeight: 1.4 }}>{s.desc}</span>
                        {s.hook && <span className="chip" style={{ height: 18, fontSize: 9.5, marginTop: 3, width: "fit-content", background: (HOOKS.find(h => h.id === s.hook) || {}).color + "1f", borderColor: (HOOKS.find(h => h.id === s.hook) || {}).color + "55", color: (HOOKS.find(h => h.id === s.hook) || {}).color }}><Icon name="link" cls="ic-sm" />Hooked to {(HOOKS.find(h => h.id === s.hook) || {}).name}</span>}
                      </div>
                    )}
                    {edit && stepEdit !== i && <button onClick={() => setStepEdit(i)} className="btn-ghost" style={{ width: 26, height: 26, border: "none", cursor: "pointer", color: "var(--mute-2)", borderRadius: 7, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="edit" cls="ic-sm" /></button>}
                    {!edit && <span style={{ flexShrink: 0, color: s.hook ? "var(--lime)" : "var(--mute-2)", display: "grid", placeItems: "center", width: 26 }}><Icon name={s.hook ? "check" : "chevR"} cls="ic-sm" /></span>}
                  </div>
                  {/* hook-up config (view mode) */}
                  {!edit && cfgStep === i && (
                    <div className="panel" style={{ margin: "6px 0 6px 28px", padding: 14, background: "var(--bg-1)", borderColor: "var(--line-2)" }}>
                      <span className="eyebrow" style={{ margin: "0 0 9px", display: "block" }}>Hook this step up</span>
                      <span style={{ fontSize: 11, color: "var(--mute)", display: "block", marginBottom: 9 }}>Pick the account or agent that powers it.</span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 7, marginBottom: 11 }}>
                        {HOOKS.map(h => {
                          const on = s.hook === h.id;
                          return (
                            <button key={h.id} onClick={() => hookStep(i, { hook: on ? null : h.id })} className="row gap-2" style={{ padding: "8px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: on ? h.color + "1f" : "var(--bg-2)", border: "1px solid " + (on ? h.color : "var(--line)") }}>
                              <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: on ? h.color : "var(--bg-3)", color: on ? "#0a0a0a" : h.color, flexShrink: 0 }}><Icon name={h.icon} cls="ic-sm" /></span>
                              <span style={{ font: "600 11.5px var(--sans)", color: on ? "#fff" : "var(--ink-2)" }}>{h.name}</span>
                              {on && <span style={{ marginLeft: "auto", color: h.color }}><Icon name="check" cls="ic-sm" /></span>}
                            </button>
                          );
                        })}
                      </div>
                      <span className="eyebrow" style={{ margin: "0 0 6px", display: "block" }}>Message / template <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--mute-2)", fontWeight: 400 }}>· optional</span></span>
                      <textarea value={s.template || ""} onChange={e => hookStep(i, { template: e.target.value })} placeholder="e.g. “Hi {{name}}, thanks for getting in touch — when suits for a quick call?”" rows={2} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", font: "400 12px var(--sans)", padding: "8px 10px", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.45 }} />
                      <div className="row between" style={{ marginTop: 10 }}>
                        <span className="row gap-2" style={{ fontSize: 10.5, color: s.hook ? "var(--lime)" : "var(--mute-2)" }}><Icon name={s.hook ? "check" : "link"} cls="ic-sm" />{s.hook ? "Connected & live" : "Not hooked up yet"}</span>
                        <button onClick={() => setCfgStep(null)} className="btn" style={{ height: 28, fontSize: 11.5 }}>Done</button>
                      </div>
                    </div>
                  )}
                  {i < steps.length - 1 && <div style={{ width: 2, height: 16, background: "var(--line-2)", marginLeft: 28 }}></div>}
                </React.Fragment>
              ))}
            </div>
            {edit && <button onClick={addStep} className="btn" style={{ marginTop: 6, justifyContent: "center" }}><Icon name="plus" cls="ic-sm" />Add a step</button>}
          </div>
        </div>

        <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          {edit
            ? <React.Fragment>
                <button onClick={() => { setEdit(false); setStepEdit(null); }} className="btn">Cancel</button>
                <button onClick={save} className="btn btn-primary" style={{ height: 32 }}><Icon name="check" cls="ic-sm" />Save automation</button>
              </React.Fragment>
            : <React.Fragment>
                <button onClick={onDelete} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--red)", font: "500 12.5px var(--sans)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="trash" cls="ic-sm" />Delete</button>
                <button onClick={onClose} className="btn btn-primary" style={{ height: 32 }}>Done</button>
              </React.Fragment>}
        </div>
      </div>
    </div>
  );
}

// ---------- new automation (functional builder) ----------
function NewAutomation({ store, onClose, onCreated }) {
  const triggers = [
    { id: "status", label: 'Status changes', icon: "euro", ex: "→ Paid, Onboarding, Live", trigLabel: "Status changes" },
    { id: "lead", label: "Lead created", icon: "inbox", ex: "from any source", trigLabel: "Lead created" },
    { id: "missed", label: "Missed call", icon: "phoneMissed", ex: "on a client line", trigLabel: "Missed call" },
    { id: "review", label: "New review", icon: "star", ex: "Google / Facebook", trigLabel: "New review" },
    { id: "schedule", label: "On a schedule", icon: "clock", ex: "hourly / daily / weekly", trigLabel: "On a schedule" },
    { id: "metric", label: "Metric threshold", icon: "trend", ex: "health, ROAS, MRR…", trigLabel: "Metric threshold" }
  ];
  const actions = [
    { id: "agent", label: "Run an AI agent", icon: "sparkle", short: "Run AI agent", desc: "An agent evaluates and acts on the trigger" },
    { id: "task", label: "Create tasks", icon: "checkSquare", short: "Create tasks", desc: "Generates tasks and assigns them" },
    { id: "msg", label: "Send a message", icon: "msg", short: "Send message", desc: "Fires a templated SMS / WhatsApp / email" },
    { id: "notify", label: "Notify me", icon: "bell", short: "Notify you", desc: "Pings you on Telegram + in-app" },
    { id: "post", label: "Post content", icon: "megaphone", short: "Post content", desc: "Drafts and schedules a social post" },
    { id: "optimise", label: "Optimise objectives", icon: "target", short: "Optimise objectives", desc: "Re-prioritises KRs & tasks toward your goals" }
  ];
  const [trig, setTrig] = useState(null);
  const [acts, setActs] = useState([]);
  const [name, setName] = useState("");
  const ready = trig && acts.length && name.trim();

  function build() {
    if (!ready) return;
    const t = triggers.find(x => x.id === trig);
    const first = actions.find(a => a.id === acts[0]);
    const steps = acts.map(id => { const a = actions.find(x => x.id === id); return { icon: a.icon, name: a.short, desc: a.desc }; });
    const created = store.create({
      name: name.trim(),
      trigger: t.trigLabel,
      action: acts.length > 1 ? first.short + " +" + (acts.length - 1) : first.short,
      icon: t.icon,
      accent: "var(--lime)",
      steps
    });
    onCreated && onCreated(created);
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "#04050588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 620, maxHeight: "88vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000c", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3"><span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="bolt" cls="ic-sm" /></span><span style={{ font: "600 15px var(--sans)" }}>New automation</span></div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
        </div>

        <div className="col gap-4" style={{ padding: 22, overflowY: "auto" }}>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. VIP lead fast-track" autoFocus
              onFocus={e => e.target.style.borderColor = "#cfff3a66"} onBlur={e => e.target.style.borderColor = "var(--line)"}
              style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)", font: "400 14px var(--sans)", padding: "11px 13px", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0, color: "var(--lime)" }}>When this happens</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {triggers.map(t => (
                <button key={t.id} onClick={() => setTrig(t.id)} className="row gap-3" style={{ padding: "11px 12px", borderRadius: 11, cursor: "pointer", textAlign: "left", background: trig === t.id ? "#cfff3a12" : "var(--bg-2)", border: "1px solid " + (trig === t.id ? "var(--lime)" : "var(--line)") }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: trig === t.id ? "var(--lime)" : "var(--bg-3)", color: trig === t.id ? "#0a0a0a" : "var(--lime)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={t.icon} cls="ic-sm" /></span>
                  <div className="col" style={{ gap: 1, minWidth: 0 }}><span style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{t.label}</span><span style={{ fontSize: 10, color: "var(--mute)" }}>{t.ex}</span></div>
                </button>
              ))}
            </div>
          </div>

          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>Do this <span style={{ color: "var(--mute-2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· pick one or more, in order</span></span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {actions.map(a => {
                const i = acts.indexOf(a.id);
                const on = i > -1;
                return (
                  <button key={a.id} onClick={() => setActs(s => on ? s.filter(x => x !== a.id) : [...s, a.id])} className="row gap-3" style={{ padding: "11px 12px", borderRadius: 11, cursor: "pointer", textAlign: "left", background: on ? "#8b7cff14" : "var(--bg-2)", border: "1px solid " + (on ? "var(--violet)" : "var(--line)") }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: on ? "var(--violet)" : "var(--bg-3)", color: on ? "#0a0a0a" : "var(--violet)", display: "grid", placeItems: "center", flexShrink: 0, position: "relative" }}>
                      <Icon name={a.icon} cls="ic-sm" />
                      {on && <span style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: 99, background: "var(--violet)", color: "#0a0a0a", font: "700 9px var(--sans)", display: "grid", placeItems: "center", border: "2px solid var(--elev)" }}>{i + 1}</span>}
                    </span>
                    <span style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="row between" style={{ padding: "13px 22px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <span style={{ fontSize: 11, color: "var(--mute-2)" }}>{trig && acts.length ? "Trigger + " + acts.length + " action" + (acts.length > 1 ? "s" : "") : "Pick a trigger and an action"}</span>
          <button onClick={build} disabled={!ready} className="btn btn-primary" style={{ height: 34, opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}><Icon name="bolt" cls="ic-sm" />Create automation</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Automations });
