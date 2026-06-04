// Client onboarding wizard — multi-step, creates a real client + dashboard on finish.

// ---- shared field renderer ----
function OnbField({ f, value, onChange }) {
  const base = {
    width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)",
    borderRadius: 10, color: "var(--ink)", font: "400 13px var(--sans)",
    padding: "10px 12px", outline: "none", colorScheme: "dark"
  };
  const onFocus = e => e.target.style.borderColor = "#cfff3a66";
  const onBlur = e => e.target.style.borderColor = "var(--line)";
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row between">
        <label style={{ fontSize: 11.5, color: f.gold ? "var(--lime)" : "var(--ink-2)", fontWeight: 500 }}>
          {f.label}{f.required && <span style={{ color: "var(--lime)" }}> *</span>}
        </label>
        {f.note && <span style={{ fontSize: 10, color: "var(--mute-2)" }}>{f.note}</span>}
      </div>
      {f.type === "area" ? (
        <textarea value={value || ""} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder}
          onFocus={onFocus} onBlur={onBlur} rows={2} style={{ ...base, resize: "vertical", minHeight: 50, lineHeight: 1.45 }} />
      ) : f.type === "select" ? (
        <select value={value || f.options[0]} onChange={e => onChange(f.key, e.target.value)} onFocus={onFocus} onBlur={onBlur} style={{ ...base, cursor: "pointer" }}>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === "radio" ? (
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {f.options.map(o => {
            const on = value === o;
            return (
              <button key={o} onClick={() => onChange(f.key, o)} className="chip" style={{
                height: 32, cursor: "pointer", background: on ? "var(--lime)" : "var(--bg-2)",
                color: on ? "#0a0a0a" : "var(--ink-2)", borderColor: on ? "var(--lime)" : "var(--line)", fontWeight: on ? 600 : 500
              }}>{o}</button>
            );
          })}
        </div>
      ) : (
        <input type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
          value={value || ""} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder}
          onFocus={onFocus} onBlur={onBlur} style={base} />
      )}
    </div>
  );
}

function FieldGrid({ fields, form, set }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {fields.map(f => (
        <div key={f.key} style={{ gridColumn: f.half ? "auto" : "1 / -1" }}>
          <OnbField f={f} value={form[f.key]} onChange={set} />
        </div>
      ))}
    </div>
  );
}

// ---- connect card (live simulate) ----
function ConnectCard({ item, state, onConnect, onRequest, onDisconnect, clientName }) {
  const st = state || "idle"; // idle | connecting | connected | requested
  const [flow, setFlow] = useState(null); // oauth | admin | pos | link
  const [menu, setMenu] = useState(false);
  const canPay = item.id === "stripe";
  return (
    <div className="panel" style={{ padding: 14, background: st === "connected" ? "#cfff3a0c" : "var(--bg-1)", borderColor: st === "connected" ? "#cfff3a3a" : "var(--line)", position: "relative" }}>
      {flow === "oauth" && <ConsentFlow item={item} clientName={clientName} onClose={() => setFlow(null)} onApproved={() => { setFlow(null); onConnect(item.id); }} />}
      {flow === "admin" && <AdminConnect item={item} clientName={clientName} onClose={() => setFlow(null)} onApproved={() => { setFlow(null); onConnect(item.id); }} />}
      {flow === "pos" && <PaymentTerminal item={item} clientName={clientName} mode="card" onClose={() => setFlow(null)} onApproved={() => { setFlow(null); onConnect(item.id); }} />}
      {flow === "link" && <PaymentTerminal item={item} clientName={clientName} mode="link" onClose={() => setFlow(null)} onApproved={() => { setFlow(null); onConnect(item.id); }} />}
      <div className="row gap-3" style={{ alignItems: "flex-start" }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center", background: item.color + "22", color: item.color, font: "700 16px var(--sans)", flexShrink: 0, border: "1px solid " + item.color + "33" }}>{item.icon}</span>
        <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
          <div className="row between">
            <span style={{ font: "600 13px var(--sans)", color: "#fff" }}>{item.name}</span>
            <span className="chip chip-dim" style={{ fontSize: 9.5 }}>{item.method}</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--mute)" }}>{item.sub} · unlocks {item.unlocks.toLowerCase()}</span>
          <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.45, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", marginTop: 4 }}>
            {item.instruction}
          </div>
          <div className="row gap-2" style={{ marginTop: 4, position: "relative" }}>
            {st === "connected" ? (
              <React.Fragment>
                <span className="chip chip-lime"><Icon name="check" cls="ic-sm" />Connected</span>
                {canPay && <button onClick={() => setFlow("pos")} className="btn" style={{ height: 26, fontSize: 11 }}><Icon name="euro" cls="ic-sm" />Take payment</button>}
                {onDisconnect && <button onClick={() => onDisconnect(item.id)} className="btn-ghost" style={{ height: 24, padding: "0 8px", border: "none", cursor: "pointer", color: "var(--mute-2)", fontSize: 11 }}>Disconnect</button>}
              </React.Fragment>
            ) : st === "connecting" ? (
              <span className="chip chip-violet"><span className="live-dot" style={{ background: "#8B7CFF" }}></span>Connecting…</span>
            ) : st === "requested" ? (
              <React.Fragment>
                <span className="chip chip-amber"><Icon name="mail" cls="ic-sm" />Access requested</span>
                <button onClick={() => setFlow("admin")} className="btn" style={{ height: 24, padding: "0 8px", fontSize: 11 }}>Enter keys</button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <button onClick={() => setFlow("oauth")} className="btn btn-primary" style={{ height: 28 }}><Icon name="link" cls="ic-sm" />Connect now</button>
                <button onClick={() => setMenu(m => !m)} className="btn" style={{ height: 28 }}>More ways<Icon name="chevD" cls="ic-sm" /></button>
                {menu && (
                  <React.Fragment>
                    <div onClick={() => setMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}></div>
                    <div className="panel" style={{ position: "absolute", top: 34, left: 0, zIndex: 31, width: 248, padding: 6, background: "var(--elev)", border: "1px solid var(--line-2)", boxShadow: "0 16px 50px #000a" }}>
                      <MenuItem icon="users" title="Client approves" sub="They sign in & grant access" onClick={() => { setMenu(false); setFlow("oauth"); }} />
                      <MenuItem icon="shield" title="I'll enter the keys" sub="Paste their API credentials" onClick={() => { setMenu(false); setFlow("admin"); }} />
                      <MenuItem icon="mail" title="Request from client" sub="Email them the access steps" onClick={() => { setMenu(false); onRequest(item.id); }} />
                      {canPay && <React.Fragment>
                        <div className="divider" style={{ margin: "5px 0" }}></div>
                        <MenuItem icon="euro" title="Charge card (POS)" sub="Type their card in now" onClick={() => { setMenu(false); setFlow("pos"); }} />
                        <MenuItem icon="link" title="Send payment link" sub="They pay it themselves" onClick={() => { setMenu(false); setFlow("link"); }} />
                      </React.Fragment>}
                    </div>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, title, sub, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <span style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--bg-2)", color: "var(--lime)", border: "1px solid var(--line)" }}><Icon name={icon} cls="ic-sm" /></span>
      <div className="col" style={{ gap: 1, minWidth: 0 }}>
        <span style={{ font: "600 12px var(--sans)", color: "var(--ink)" }}>{title}</span>
        <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{sub}</span>
      </div>
    </button>
  );
}

// ---- the wizard ----
function ClientOnboarding({ open, onClose, onCreated }) {
  const O = window.BIZBOOST_ONBOARD;
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm] = useState({ plan: "Domination €998/mo", vibe: "Premium & clean" });
  const [conn, setConn] = useState({}); // id -> state
  const [phase, setPhase] = useState("wizard"); // wizard | creating | done
  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  useEffect(() => { if (open) { setStepIdx(0); setForm({ plan: "Domination €998/mo", vibe: "Premium & clean" }); setConn({}); setPhase("wizard"); } }, [open]);
  if (!open) return null;

  const step = O.steps[stepIdx];
  const isLast = stepIdx === O.steps.length - 1;
  const canProceed = stepIdx === 0 ? (form.business && form.owner && form.email && form.phone) : true;

  function connect(id) {
    setConn(c => ({ ...c, [id]: "connecting" }));
    setTimeout(() => setConn(c => ({ ...c, [id]: "connected" })), 1100);
  }
  function request(id) { setConn(c => ({ ...c, [id]: "requested" })); }

  function finish() {
    setPhase("creating");
    setTimeout(() => setPhase("done"), 2600);
  }

  function createClient() {
    const D = window.BIZBOOST_DATA;
    const connected = Object.keys(conn).filter(k => conn[k] === "connected");
    const colorPool = ["#3FE0A8", "#5BCEFA", "#FFB547", "#8B7CFF", "#4FE3C1", "#FF7A8A"];
    const id = (form.business || "new-client").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 28);
    // map connect ids -> checklist ids done
    const doneK = ["k1"]; // call considered done from onboarding
    if (connected.includes("meta")) doneK.push("k4");
    if (connected.includes("gbp") || connected.includes("ga4") || connected.includes("gads")) doneK.push("k5");
    if (connected.includes("wa") || connected.includes("cal")) doneK.push("k6");
    const client = {
      id, name: form.business, handle: (form.website || (id + ".ie")).replace(/^https?:\/\//, ""),
      city: (form.area || "Ireland").split(/[,+]/)[0].trim(), niche: form.niche || "Service",
      plan: (form.plan || "Domination").split(" ")[0], mrr: form.plan && form.plan.includes("698") ? 698 : form.plan && form.plan.includes("298") ? 0 : 998,
      since: "Jun 2026", onboarded: 0, health: 70, owner: form.owner, avatar: (form.business || "N")[0].toUpperCase(),
      color: colorPool[D.clients.length % colorPool.length],
      leads30: 0, leadsΔ: 0, bookings30: 0, bookingsΔ: 0, revenue30: 0, revenueΔ: 0, roas: 0, missedCalls: 0,
      reviews: { count: 0, rating: 0, new30: 0 }, adSpend: 0,
      website: { visits30: 0, visitsΔ: 0, conv: 0 }, followers: { ig: 0, fb: 0, tt: 0 },
      pendingTasks: 0, lastTouch: "just now", nextDue: "Onboarding", flag: "Onboarding",
      services: (form.services || "").split(/[,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 4),
      sparkline: [0, 0, 0, 0, 0],
      onboarding: { active: true, done: doneK, started: "today" },
      connected,
      memory: {
        why: form.why, proud: form.proud, language: form.language, ideal: form.ideal, vibe: form.vibe, competitor: form.competitor
      }
    };
    D.clients.unshift(client);
    return client;
  }

  // creating / done overlay
  if (phase !== "wizard") {
    return (
      <ModalShell width={520} onClose={phase === "done" ? onClose : null} title="New client">
        {phase === "creating"
          ? <CreatingSequence form={form} />
          : <CreatedDone form={form} onGo={() => { const c = createClient(); onClose(); onCreated && onCreated(c); }} />}
      </ModalShell>
    );
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "#04050588", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", paddingTop: "5vh", paddingBottom: "5vh" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{
        width: 760, maxHeight: "90vh", background: "var(--elev)", border: "1px solid var(--line-2)",
        borderRadius: 20, boxShadow: "0 30px 90px #000b", overflow: "hidden", display: "grid", gridTemplateColumns: "220px 1fr"
      }}>
        {/* step rail */}
        <div className="col" style={{ background: "linear-gradient(180deg,#0d0f0d,#0a0b0a)", borderRight: "1px solid var(--line)", padding: 20 }}>
          <div className="row gap-2" style={{ marginBottom: 24 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="bolt" cls="ic-sm" /></span>
            <span style={{ font: "600 13px var(--sans)" }}>Onboard client</span>
          </div>
          <div className="col gap-1" style={{ flex: 1 }}>
            {O.steps.map((s, i) => {
              const active = i === stepIdx, done = i < stepIdx;
              return (
                <button key={s.id} onClick={() => i < stepIdx && setStepIdx(i)} style={{
                  display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 10px", borderRadius: 10, border: "none",
                  background: active ? "var(--bg-active)" : "transparent", cursor: i <= stepIdx ? "pointer" : "default", textAlign: "left"
                }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center",
                    background: done ? "var(--lime)" : active ? "var(--bg-3)" : "transparent",
                    border: "1px solid " + (active ? "var(--line-2)" : done ? "var(--lime)" : "var(--line-2)"),
                    color: done ? "#0a0a0a" : active ? "var(--lime)" : "var(--mute)", font: "600 10px var(--sans)" }}>
                    {done ? <Icon name="check" cls="ic-sm" /> : (i + 1)}
                  </span>
                  <div className="col" style={{ gap: 1 }}>
                    <span style={{ font: (active ? 600 : 500) + " 12.5px var(--sans)", color: active || done ? "var(--ink)" : "var(--mute)" }}>{s.label}</span>
                    <span style={{ fontSize: 10, color: "var(--mute-2)", lineHeight: 1.3 }}>{s.blurb}</span>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="prog" style={{ marginTop: 12 }}><i style={{ width: ((stepIdx + 1) / O.steps.length * 100) + "%" }}></i></div>
        </div>

        {/* content */}
        <div className="col" style={{ minWidth: 0 }}>
          <div className="row between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ font: "600 15px var(--sans)" }}>{step.label}</span>
              <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{step.blurb}</span>
            </div>
            <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>
          </div>

          <div style={{ overflowY: "auto", padding: 22, flex: 1 }}>
            {step.id === "profile" && <FieldGrid fields={O.profileFields} form={form} set={set} />}
            {step.id === "position" && (
              <div className="col gap-4">
                <div className="panel" style={{ padding: "11px 13px", background: "#cfff3a0c", borderColor: "#cfff3a2a" }}>
                  <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--ink-2)" }}><Icon name="sparkle" cls="ic-sm" />This becomes their site copy and feeds BizBoost's memory of the client.</span>
                </div>
                <FieldGrid fields={O.positionFields.map(f => ({ ...f, half: false }))} form={form} set={set} />
              </div>
            )}
            {step.id === "connect" && (
              <div className="col gap-4">
                <div className="panel" style={{ padding: "12px 14px", background: "linear-gradient(120deg,#0e1a1f,transparent 60%)", borderColor: "#25D36644" }}>
                  <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--ink-2)" }}><Icon name="phone" cls="ic-sm" />Do this live on the onboarding call — connect what you can now, request the rest.</span>
                </div>
                {["Advertising", "Analytics", "Presence", "Payments", "Comms"].map(cat => {
                  const items = O.connectList.filter(i => i.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="col gap-2">
                      <span className="eyebrow">{cat}</span>
                      {items.map(it => <ConnectCard key={it.id} item={it} state={conn[it.id]} onConnect={connect} onRequest={request} clientName={form.business} />)}
                    </div>
                  );
                })}
              </div>
            )}
            {step.id === "plan" && <PlanPreview conn={conn} />}
          </div>

          <div className="row between" style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", flexShrink: 0, background: "var(--bg-1)" }}>
            <button onClick={() => stepIdx === 0 ? onClose() : setStepIdx(stepIdx - 1)} className="btn">
              {stepIdx === 0 ? "Cancel" : <React.Fragment><Icon name="chevL" cls="ic-sm" />Back</React.Fragment>}
            </button>
            {isLast ? (
              <button onClick={finish} className="btn btn-primary"><Icon name="bolt" cls="ic-sm" />Create dashboard</button>
            ) : (
              <button onClick={() => canProceed && setStepIdx(stepIdx + 1)} disabled={!canProceed} className="btn btn-primary" style={{ opacity: canProceed ? 1 : 0.5, cursor: canProceed ? "pointer" : "not-allowed" }}>
                Continue<Icon name="arrowR" cls="ic-sm" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanPreview({ conn }) {
  const O = window.BIZBOOST_ONBOARD;
  const connected = Object.keys(conn).filter(k => conn[k] === "connected").length;
  return (
    <div className="col gap-4">
      <div className="panel" style={{ padding: "12px 14px" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>On create, their dashboard goes live and this build checklist kicks off. Tasks unlock in order — the team and automations work top to bottom.</span>
      </div>
      {O.groups.map(g => {
        const items = O.checklist.filter(k => k.group === g.id);
        return (
          <div key={g.id} className="col gap-2">
            <div className="row gap-2"><span style={{ width: 8, height: 8, borderRadius: 3, background: g.color }}></span><span style={{ font: "600 12px var(--sans)" }}>{g.label}</span><span className="chip chip-dim">{g.window}</span></div>
            <div className="col gap-1" style={{ paddingLeft: 16 }}>
              {items.map(k => (
                <div key={k.id} className="row gap-2" style={{ fontSize: 12, color: "var(--ink-2)", padding: "3px 0" }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: "1px solid var(--line-2)", flexShrink: 0 }}></span>
                  {k.title}
                  {k.auto && <span className="chip chip-dim" style={{ fontSize: 9 }}>auto</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreatingSequence({ form }) {
  const items = [
    { icon: "users", t: "Provisioning dashboard", c: "#5BCEFA" },
    { icon: "layers", t: "Cloning master databases", c: "#8B7CFF" },
    { icon: "plug", t: "Wiring connected accounts", c: "#25D366" },
    { icon: "checkSquare", t: "Spinning up build checklist", c: "#FFB547" },
    { icon: "sparkle", t: "Teaching BizBoost about " + (form.business || "them"), c: "#CFFF3A" }
  ];
  const [done, setDone] = useState([]);
  useEffect(() => { const ts = items.map((_, i) => setTimeout(() => setDone(d => [...d, i]), 400 + i * 440)); return () => ts.forEach(clearTimeout); }, []);
  return (
    <div className="col gap-2" style={{ padding: "8px 4px" }}>
      <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", marginBottom: 18 }}>
        <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="bolt" cls="ic-lg" /></span>
        <div className="h-display" style={{ fontSize: 24, lineHeight: 1.1 }}>Building <span className="it">{form.business}</span></div>
      </div>
      {items.map((it, i) => {
        const d = done.includes(i), active = !d && done.length === i;
        return (
          <div key={i} className="row gap-3" style={{ padding: "11px 13px", borderRadius: 11, background: d ? "var(--bg-2)" : active ? "#cfff3a0f" : "var(--bg-1)", border: "1px solid " + (d ? "var(--line-2)" : active ? "#cfff3a44" : "var(--line)"), opacity: d || active ? 1 : 0.4, transition: "all .3s" }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", background: d ? it.c : "var(--bg-3)", color: d ? "#0a0a0a" : it.c }}>{d ? <Icon name="check" cls="ic-sm" /> : <Icon name={it.icon} cls="ic-sm" />}</span>
            <span style={{ font: "600 13px var(--sans)", flex: 1 }}>{it.t}</span>
            {active && <span className="live-dot"></span>}
          </div>
        );
      })}
    </div>
  );
}

function CreatedDone({ form, onGo }) {
  return (
    <div className="col gap-4" style={{ padding: "8px 4px", alignItems: "center", textAlign: "center" }}>
      <span style={{ width: 52, height: 52, borderRadius: 15, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="check" cls="ic-lg" /></span>
      <div className="h-display" style={{ fontSize: 28, lineHeight: 1.1 }}><span className="it">{form.business}</span> is live.</div>
      <span style={{ fontSize: 13, color: "var(--mute)", maxWidth: 360, lineHeight: 1.5 }}>Their dashboard is provisioned and the build checklist has started. BizBoost will keep learning about them as their numbers move.</span>
      <button onClick={onGo} className="btn btn-primary" style={{ height: 40, marginTop: 4 }}><Icon name="arrowR" cls="ic-sm" />Open their dashboard</button>
    </div>
  );
}

function ModalShell({ width, onClose, title, children }) {
  return (
    <div onClick={onClose || undefined} style={{ position: "fixed", inset: 0, zIndex: 120, background: "#04050588", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{ width, maxHeight: "88vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 20, boxShadow: "0 30px 90px #000b", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="row between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ font: "600 15px var(--sans)" }}>{title}</span>
          {onClose && <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>}
        </div>
        <div style={{ overflowY: "auto", padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { ClientOnboarding });
