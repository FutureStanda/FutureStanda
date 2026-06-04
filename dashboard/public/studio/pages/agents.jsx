// Agents — dedicated page. Roster of AI agents + people, build-with-Claude, agent profiles.

function AgentsPage({ go }) {
  const store = useAgents();
  const [detail, setDetail] = useState(null);
  const [building, setBuilding] = useState(false);
  const agents = store.agents();
  const people = store.people();
  const TS = window.TaskStore;
  const HOOKS = window.NODE_HOOKS || [];
  const hookName = id => (HOOKS.find(h => h.id === id) || { name: id }).name;

  function agentWork(a) {
    if (!TS) return { active: 0, review: 0 };
    const all = TS.all().filter(t => t.assignee === a.name);
    return { active: all.filter(t => t.status === "doing").length, review: all.filter(t => t.status === "review").length };
  }

  if (detail) { const a = store.get(detail); if (a) return <AgentDetail a={a} store={store} go={go} hookName={hookName} onBack={() => setDetail(null)} />; }

  return (
    <div className="col gap-5" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 70 }}>
      {building && <BuildAgent store={store} onClose={() => setBuilding(false)} onBuilt={(id) => { setBuilding(false); setDetail(id); }} />}
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="row gap-2 eyebrow" style={{ margin: 0 }}><span className="live-dot"></span>{agents.length} agents · {agents.filter(a => a.status === "active").length} active</div>
          <div className="h-display" style={{ fontSize: 40 }}>Agents</div>
          <span style={{ color: "var(--mute)", fontSize: 14 }}>Your AI workforce — they run automations, take tasks off your plate and report back.</span>
        </div>
        <button onClick={() => setBuilding(true)} className="btn btn-primary" style={{ height: 40 }}><Icon name="sparkle" cls="ic-sm" />Build an agent</button>
      </div>

      {/* agents grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {agents.map(a => {
          const w = agentWork(a);
          return (
            <div key={a.id} onClick={() => setDetail(a.id)} className="auto-card panel" style={{ padding: 16, cursor: "pointer" }}>
              <div className="row between" style={{ marginBottom: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 12, background: a.color + "22", color: a.color, border: "1px solid " + a.color + "44", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={a.icon} /></span>
                <span className="chip" style={{ background: "transparent", borderColor: a.status === "active" ? "#cfff3a44" : "var(--line)", color: a.status === "active" ? "var(--lime)" : "var(--mute)" }}>{a.status === "active" ? <React.Fragment><span className="live-dot"></span>Active</React.Fragment> : "Paused"}</span>
              </div>
              <span style={{ font: "600 15px var(--sans)", color: "#fff" }}>{a.name}</span>
              <p style={{ fontSize: 12.5, color: "var(--mute)", margin: "4px 0 12px", lineHeight: 1.45 }}>{a.role}</p>
              <div className="row gap-2" style={{ flexWrap: "wrap", marginBottom: 12 }}>
                {(a.tools || []).slice(0, 4).map(t => <span key={t} className="chip chip-dim" style={{ height: 20, fontSize: 9.5 }}>{hookName(t)}</span>)}
                {(!a.tools || !a.tools.length) && <span style={{ fontSize: 11, color: "var(--mute-2)" }}>No tools connected yet</span>}
              </div>
              <div className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <span className="num" style={{ fontSize: 11, color: "var(--mute)" }}>{(a.runs || 0).toLocaleString()} runs</span>
                {(w.active + w.review) > 0
                  ? <span className="row gap-2" style={{ fontSize: 11, color: w.review ? "var(--violet)" : "var(--amber)" }}><span className="live-dot" style={{ background: w.review ? "var(--violet)" : "var(--amber)" }}></span>{w.active ? w.active + " working" : ""}{w.active && w.review ? " · " : ""}{w.review ? w.review + " to review" : ""}</span>
                  : <span style={{ fontSize: 11, color: "var(--mute-2)" }}>Idle</span>}
              </div>
            </div>
          );
        })}
        {/* build tile */}
        <button onClick={() => setBuilding(true)} className="panel" style={{ padding: 16, cursor: "pointer", border: "1px dashed var(--line-3)", background: "var(--bg-1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 150, color: "var(--mute)" }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="sparkle" /></span>
          <span style={{ font: "600 13px var(--sans)", color: "var(--ink-2)" }}>Build a new agent</span>
          <span style={{ fontSize: 11 }}>Describe a role — Claude provisions it</span>
        </button>
      </div>

      {/* people */}
      <div className="col gap-3">
        <span className="eyebrow" style={{ margin: 0 }}>People</span>
        <div className="row gap-3" style={{ flexWrap: "wrap" }}>
          {people.map(p => (
            <div key={p.id} className="panel" style={{ padding: "12px 16px", display: "flex", gap: 11, alignItems: "center" }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: p.color + "22", color: p.color, display: "grid", placeItems: "center", font: "600 14px var(--sans)" }}>{p.name[0]}</span>
              <div className="col" style={{ gap: 1 }}><span style={{ font: "600 13px var(--sans)" }}>{p.name}</span><span style={{ fontSize: 11, color: "var(--mute)" }}>{p.role}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentDetail({ a, store, go, hookName, onBack }) {
  const TS = window.TaskStore;
  const HOOKS = window.NODE_HOOKS || [];
  const tasks = TS ? TS.all().filter(t => t.assignee === a.name) : [];
  const [toolPick, setToolPick] = useState(false);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [chat, busy]);

  function toggleTool(id) { const cur = a.tools || []; store.patch(a.id, { tools: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] }); }

  async function send() {
    const text = input.trim(); if (!text || busy) return;
    setChat(c => [...c, { role: "me", text }]); setInput(""); setBusy(true);
    const sys = `You are ${a.name}, an AI agent inside BizBoost (an AI agency command centre). Your job: ${a.role}. Tools you can use: ${(a.tools || []).map(hookName).join(", ") || "none yet"}. You can: ${(a.can || []).join("; ")}. Reply concisely (2-4 sentences), in first person, like a capable teammate. No markdown headers.`;
    try { const r = await window.claude.complete(sys + "\n\nManager: " + text + "\n\n" + a.name + ":"); setChat(c => [...c, { role: "ai", text: (r || "").trim() || "On it." }]); }
    catch (e) { setChat(c => [...c, { role: "ai", text: "On it — I'll handle that and report back." }]); }
    setBusy(false);
  }

  const editable = !!store.get(a.id) && a.id.indexOf("ag_") === 0;

  return (
    <div className="col gap-4" style={{ maxWidth: 920, margin: "0 auto", paddingBottom: 70 }}>
      <button onClick={onBack} className="btn" style={{ width: "fit-content", height: 30 }}><Icon name="chevL" cls="ic-sm" />All agents</button>

      {/* header */}
      <div className="panel" style={{ padding: 22, background: `linear-gradient(120deg, ${a.color}14, transparent 55%)`, borderColor: a.color + "33" }}>
        <div className="row between" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div className="row gap-4" style={{ minWidth: 0 }}>
            <span style={{ width: 54, height: 54, borderRadius: 15, background: a.color, color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={a.icon} cls="ic-lg" /></span>
            <div className="col" style={{ gap: 4, minWidth: 0 }}>
              <span style={{ font: "600 22px var(--sans)", letterSpacing: "-0.02em", color: "#fff" }}>{a.name}</span>
              <span style={{ fontSize: 13, color: "var(--mute)" }}>{a.role}</span>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <span className="chip" style={{ background: "transparent", borderColor: a.status === "active" ? "#cfff3a44" : "var(--line)", color: a.status === "active" ? "var(--lime)" : "var(--mute)" }}>{a.status === "active" ? <React.Fragment><span className="live-dot"></span>Active</React.Fragment> : "Paused"}</span>
                <span className="chip chip-dim">{(a.runs || 0).toLocaleString()} runs</span>
              </div>
            </div>
          </div>
          <button onClick={() => store.patch(a.id, { status: a.status === "active" ? "paused" : "active" })} className="btn">{a.status === "active" ? "Pause agent" : "Activate"}</button>
        </div>
      </div>

      <div className="row gap-4 stretch" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* left: capabilities + tools */}
        <div className="col gap-4" style={{ flex: "1 1 340px", minWidth: 0 }}>
          <div className="panel" style={{ padding: 18 }}>
            <PanelHead title="What it can do" sub="Its remit" />
            <div className="col gap-2">
              {(a.can || []).map((c, i) => <div key={i} className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-2)" }}><span style={{ color: a.color, flexShrink: 0 }}><Icon name="check" cls="ic-sm" /></span>{c}</div>)}
              {(!a.can || !a.can.length) && <span style={{ fontSize: 12, color: "var(--mute)" }}>No capabilities defined.</span>}
            </div>
          </div>
          <div className="panel" style={{ padding: 18 }}>
            <PanelHead title="Connected tools" sub="What it can act on" action={<button onClick={() => setToolPick(p => !p)} className="btn btn-ghost" style={{ height: 26 }}><Icon name="plus" cls="ic-sm" />Tools</button>} />
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {(a.tools || []).map(t => { const h = HOOKS.find(x => x.id === t) || { name: t, color: "var(--mute)", icon: "link" }; return (
                <span key={t} className="chip" style={{ height: 26, background: h.color + "1f", borderColor: h.color + "44", color: h.color }}><Icon name={h.icon} cls="ic-sm" />{h.name}<button onClick={() => toggleTool(t)} style={{ border: "none", background: "none", cursor: "pointer", color: "inherit", padding: 0, marginLeft: 2, opacity: .6 }}><Icon name="x" cls="ic-sm" /></button></span>
              ); })}
              {(!a.tools || !a.tools.length) && <span style={{ fontSize: 12, color: "var(--mute)" }}>No tools yet — add some.</span>}
            </div>
            {toolPick && (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {HOOKS.map(h => { const on = (a.tools || []).includes(h.id); return (
                  <button key={h.id} onClick={() => toggleTool(h.id)} className="row gap-2" style={{ padding: "7px 9px", borderRadius: 8, cursor: "pointer", textAlign: "left", background: on ? h.color + "1f" : "var(--bg-2)", border: "1px solid " + (on ? h.color : "var(--line)") }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, display: "grid", placeItems: "center", background: on ? h.color : "var(--bg-3)", color: on ? "#0a0a0a" : h.color, flexShrink: 0 }}><Icon name={h.icon} cls="ic-sm" /></span>
                    <span style={{ font: "600 10.5px var(--sans)", color: on ? "#fff" : "var(--ink-2)", minWidth: 0 }} className="truncate">{h.name}</span>
                  </button>
                ); })}
              </div>
            )}
          </div>
          <div className="panel" style={{ padding: 18 }}>
            <PanelHead title="Working on" sub={tasks.length + " task" + (tasks.length === 1 ? "" : "s") + " assigned"} action={<button onClick={() => go({ page: "tasks" })} className="btn btn-ghost" style={{ height: 26 }}>Tasks<Icon name="arrowR" cls="ic-sm" /></button>} />
            <div className="col gap-2">
              {tasks.slice(0, 5).map(t => <div key={t.id} className="row gap-2" style={{ fontSize: 12.5, color: "var(--ink-2)", padding: "7px 9px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line)" }}><span style={{ width: 6, height: 6, borderRadius: 99, background: t.status === "review" ? "var(--violet)" : t.status === "doing" ? "var(--amber)" : "var(--mute)", flexShrink: 0 }}></span><span className="truncate" style={{ flex: 1 }}>{t.title}</span><span className="chip chip-dim" style={{ height: 18, fontSize: 9 }}>{t.status}</span></div>)}
              {tasks.length === 0 && <span style={{ fontSize: 12, color: "var(--mute)" }}>Nothing assigned right now.</span>}
            </div>
          </div>
        </div>

        {/* right: chat with the agent */}
        <div className="panel col" style={{ flex: "1 1 320px", minWidth: 0, padding: 0, overflow: "hidden", height: 480 }}>
          <div className="row gap-2" style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: a.color + "22", color: a.color, display: "grid", placeItems: "center" }}><Icon name={a.icon} cls="ic-sm" /></span>
            <div className="col" style={{ gap: 0 }}><span style={{ font: "600 13px var(--sans)" }}>Chat with {a.name}</span><span style={{ fontSize: 10.5, color: "var(--mute)" }}>Brief it, ask for an update, delegate</span></div>
          </div>
          <div className="portal-ai-msgs" ref={scroller} style={{ flex: 1 }}>
            {chat.length === 0 && <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", padding: "30px 16px", color: "var(--mute)" }}><span style={{ fontSize: 12.5, lineHeight: 1.5 }}>Say hi to {a.name} or give it a job — "research Murphy's top 3 competitors", "draft this week's posts"…</span></div>}
            {chat.map((m, i) => (
              <div key={i} className={"portal-ai-msg " + m.role}>
                {m.role === "ai" && <span className="portal-ai-av" style={{ background: a.color + "22", color: a.color }}><Icon name={a.icon} cls="ic-sm" /></span>}
                <div className="portal-ai-bubble" style={m.role === "me" ? { background: a.color, color: "#0a0a0a" } : {}}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="portal-ai-msg ai"><span className="portal-ai-av" style={{ background: a.color + "22", color: a.color }}><Icon name={a.icon} cls="ic-sm" /></span><div className="portal-ai-bubble"><span className="portal-ai-typing"><i></i><i></i><i></i></span></div></div>}
          </div>
          <div className="portal-ai-input">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder={"Message " + a.name + "…"} />
            <button onClick={send} disabled={!input.trim() || busy} style={{ background: a.color, opacity: input.trim() && !busy ? 1 : 0.5 }}><Icon name="arrowR" cls="ic-sm" /></button>
          </div>
        </div>
      </div>

      {editable && <button onClick={() => { store.remove(a.id); onBack(); }} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--red)", font: "500 12.5px var(--sans)", display: "flex", alignItems: "center", gap: 6, width: "fit-content" }}><Icon name="trash" cls="ic-sm" />Delete agent</button>}
    </div>
  );
}

// build an agent with Claude
function BuildAgent({ store, onClose, onBuilt }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: "What should this agent do for you? Describe its job — like “research my clients' competitors and write me a brief”, or “handle all my Google review replies”. I'll set it up." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const scroller = useRef(null);
  const hist = useRef([]);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, busy, building]);

  const HOOKS = window.NODE_HOOKS || [];
  const SYS = `You are Claude provisioning a new AI agent inside BizBoost. The user describes the agent's job. If you need more, ask ONE short question. Once you have enough OR they say go, reply with a short sentence then a fenced \`\`\`json block: {"name":"Agent name ending in 'Agent'","role":"one-line role","icon":"one of sparkle,megaphone,msg,star,trend,euro,users,doc,inbox,checkSquare,shield","tools":["pick from: ${HOOKS.map(h => h.id).join(", ")}"],"can":["3-5 short capability phrases"]}. No markdown headers.`;

  async function send(force) {
    const text = force ? "Go ahead and build it, your best judgement." : input.trim();
    if (!text || busy || building) return;
    setMsgs(m => [...m, { role: "me", text: force ? "Build it ✨" : text }]); setInput(""); setBusy(true); hist.current.push("USER: " + text);
    try {
      const r = await window.claude.complete(SYS + "\n\n" + hist.current.join("\n") + "\n\nClaude:");
      const m = (r || "").match(/```(?:json)?\s*([\s\S]*?)```/);
      const prose = (r || "").replace(/```[\s\S]*?```/g, "").trim();
      if (m) { try { const spec = JSON.parse(m[1]); setMsgs(x => [...x, { role: "ai", text: prose || "Building it now." }]); build(spec); } catch (e) { setMsgs(x => [...x, { role: "ai", text: prose || "Tell me a touch more." }]); } }
      else { setMsgs(x => [...x, { role: "ai", text: prose || "Tell me a touch more." }]); hist.current.push("CLAUDE: " + prose); }
    } catch (e) { setMsgs(x => [...x, { role: "ai", text: "Couldn't reach the model — try again, or describe the role and tools and I'll set it up." }]); }
    setBusy(false);
  }
  function build(spec) {
    setBuilding(true);
    setTimeout(() => {
      const a = store.create({ name: spec.name || "New Agent", role: spec.role || "Custom agent", icon: spec.icon || "sparkle", tools: (spec.tools || []).filter(t => HOOKS.some(h => h.id === t)), can: spec.can || [] });
      onBuilt(a.id);
    }, 1400);
  }
  const sugg = ["Research competitors and write me a brief", "Reply to all my Google reviews", "Draft 4 social posts a week per client", "Chase every unpaid invoice"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 240, background: "#04050588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 580, maxWidth: "94vw", height: "78vh", maxHeight: 620, background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000c", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="sparkle" cls="ic-sm" /></span>
            <div className="col" style={{ gap: 1 }}><span style={{ font: "600 15px var(--sans)" }}>Build an agent</span><span style={{ fontSize: 11.5, color: "var(--mute)" }}>Describe the job · Claude provisions it</span></div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>
        </div>
        <div className="portal-ai-msgs" ref={scroller} style={{ flex: 1, background: "var(--bg-1)" }}>
          {msgs.map((m, i) => (
            <div key={i} className={"portal-ai-msg " + m.role}>
              {m.role === "ai" && <span className="portal-ai-av" style={{ background: "#cfff3a22", color: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" /></span>}
              <div className="portal-ai-bubble" style={m.role === "me" ? { background: "var(--lime)", color: "#0a0a0a" } : {}}>{m.text}</div>
            </div>
          ))}
          {busy && <div className="portal-ai-msg ai"><span className="portal-ai-av" style={{ background: "#cfff3a22", color: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" /></span><div className="portal-ai-bubble"><span className="portal-ai-typing"><i></i><i></i><i></i></span></div></div>}
          {building && <div className="acv-build-magic"><span className="acv-build-orb"><Icon name="sparkle" /></span><span style={{ font: "600 14px var(--sans)", color: "#fff" }}>Provisioning your agent…</span><span style={{ fontSize: 12, color: "var(--mute)" }}>Wiring its tools & remit</span></div>}
        </div>
        {msgs.length <= 1 && !building && <div className="portal-ai-sugg" style={{ background: "var(--bg-1)" }}>{sugg.map((s, i) => <button key={i} onClick={() => setInput(s)} className="portal-ai-chip">{s}</button>)}</div>}
        <div className="portal-ai-input" style={{ background: "var(--elev)" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(false)} placeholder="Describe the agent's job…" disabled={building} />
          <button onClick={() => send(false)} disabled={!input.trim() || busy || building} style={{ background: "var(--lime)", opacity: input.trim() && !busy && !building ? 1 : 0.5 }}><Icon name="arrowR" cls="ic-sm" /></button>
        </div>
        {msgs.length > 1 && !building && <div className="row" style={{ justifyContent: "flex-end", padding: "9px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}><button onClick={() => send(true)} className="btn btn-primary" style={{ height: 30 }}><Icon name="sparkle" cls="ic-sm" />Build it now</button></div>}
      </div>
    </div>
  );
}

window.AgentsPage = AgentsPage;
