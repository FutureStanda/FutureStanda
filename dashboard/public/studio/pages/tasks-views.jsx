// Tasks Workspace — flexible views: status filter + live group-by + bulk offload to people/AI agents.

function dueBucket(due) {
  const d = (due || "").toLowerCase();
  if (d.includes("today") || d.includes("now")) return "today";
  if (d.includes("tomorrow") || /\bmon|tue|wed|thu|fri|sat|sun\b/.test(d)) return d.includes("next") ? "month" : "week";
  if (d.includes("next week") || d.includes("next")) return "month";
  if (/\d+\s*d/.test(d)) return "week";
  return "later";
}
const DUE_LABEL = { today: "Due today", week: "This week", month: "This month", later: "Later / no date" };
const DUE_ORDER = ["today", "week", "month", "later"];

const TW_STATUS = [
  { id: "open", label: "Not done", match: t => t.status === "todo", color: "var(--mute)" },
  { id: "doing", label: "In progress", match: t => t.status === "doing", color: "var(--amber)" },
  { id: "review", label: "In review", match: t => t.status === "review", color: "var(--violet)" },
  { id: "done", label: "Done", match: t => t.status === "done", color: "var(--lime)" }
];

function nicheOf(t) { const c = t.client ? getClient(t.client) : null; return c ? c.niche : "Internal / agency"; }
function clientOf(t) { const c = t.client ? getClient(t.client) : null; return c ? c.name : "Internal / agency"; }

function TasksWorkspace({ store, setComposer }) {
  useAgents();
  const agentStore = window.AgentStore;
  const [status, setStatus] = useState("open");
  const [groupBy, setGroupBy] = useState("due");
  const [sel, setSel] = useState([]);          // selected task ids
  const [offloadFor, setOffloadFor] = useState(null); // ids being offloaded
  const [newAgent, setNewAgent] = useState(false);
  const [working, setWorking] = useState([]);  // ids currently being 'worked' by an agent

  const all = store.all();
  const statusDef = TW_STATUS.find(s => s.id === status);
  const inStatus = all.filter(statusDef.match);

  const counts = {}; TW_STATUS.forEach(s => counts[s.id] = all.filter(s.match).length);

  // build groups
  function groupKey(t) {
    if (groupBy === "due") return dueBucket(t.due);
    if (groupBy === "niche") return nicheOf(t);
    if (groupBy === "client") return clientOf(t);
    if (groupBy === "assignee") return t.assignee || "Unassigned";
    if (groupBy === "priority") return t.priority || "P2";
    if (groupBy === "category") return t.category || "Other";
    return "All";
  }
  const groups = {};
  inStatus.forEach(t => { const k = groupKey(t); (groups[k] = groups[k] || []).push(t); });
  let groupKeys = Object.keys(groups);
  if (groupBy === "due") groupKeys.sort((a, b) => DUE_ORDER.indexOf(a) - DUE_ORDER.indexOf(b));
  else if (groupBy === "priority") groupKeys.sort();
  else groupKeys.sort();

  function toggleSel(id) { setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  function clearSel() { setSel([]); }

  async function offloadToAgent(ids, agent) {
    setOffloadFor(null); clearSel();
    if (agent.kind === "person") { ids.forEach(id => store.patch(id, { assignee: agent.name })); return; }
    // AI agent → set in-progress, generate a result, move to review
    setWorking(w => [...w, ...ids]);
    for (const id of ids) {
      const t = store.all().find(x => x.id === id); if (!t) continue;
      store.patch(id, { assignee: agent.name, status: "doing" });
      const c = t.client ? getClient(t.client) : null;
      const prompt = `You are ${agent.name} (${agent.role}) inside BizBoost. You were assigned this task: "${t.title}"${c ? " for " + c.name + " (" + c.niche + ")" : ""}. Do the work and report back in 2-3 short sentences — what you produced/did, ready for the owner to review. First person, concrete, no markdown.`;
      let result = "";
      try { result = (await window.claude.complete(prompt) || "").trim(); } catch (e) { result = "Drafted and ready for your review."; }
      store.patch(id, { status: "review", agentResult: result, agentName: agent.name });
      setWorking(w => w.filter(x => x !== id));
    }
  }
  function bulk(action) {
    if (action === "done") { sel.forEach(id => store.patch(id, { status: "done" })); clearSel(); }
    if (action === "delete") { sel.forEach(id => store.remove(id)); clearSel(); }
  }

  return (
    <div className="col gap-4">
      {/* status segments */}
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {TW_STATUS.map(s => (
          <button key={s.id} onClick={() => { setStatus(s.id); clearSel(); }} className="chip" style={{ height: 32, cursor: "pointer", background: status === s.id ? "var(--bg-active)" : "var(--bg-2)", borderColor: status === s.id ? s.color : "var(--line)", color: status === s.id ? "#fff" : "var(--mute)", fontWeight: status === s.id ? 600 : 500 }}>
            <span className="dot" style={{ color: s.color }}></span>{s.label}<span className="chip chip-dim" style={{ fontSize: 9.5, height: 16 }}>{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {/* group-by + agents */}
      <div className="row between" style={{ flexWrap: "wrap", gap: 10 }}>
        <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <span className="eyebrow" style={{ margin: 0 }}>Group by</span>
          {[["due", "Due"], ["niche", "Niche"], ["client", "Client"], ["assignee", "Assignee"], ["priority", "Priority"], ["category", "Category"]].map(([v, l]) => (
            <button key={v} onClick={() => setGroupBy(v)} className="chip" style={{ height: 28, cursor: "pointer", background: groupBy === v ? "var(--lime)" : "var(--bg-2)", color: groupBy === v ? "#0a0a0a" : "var(--ink-2)", borderColor: groupBy === v ? "var(--lime)" : "var(--line)", fontWeight: groupBy === v ? 600 : 500 }}>{l}</button>
          ))}
        </div>
        <button onClick={() => setNewAgent(true)} className="btn" style={{ height: 30 }}><Icon name="sparkle" cls="ic-sm" />New agent</button>
      </div>

      {/* groups */}
      {groupKeys.length === 0 && <div className="panel" style={{ padding: 30, textAlign: "center", color: "var(--mute)" }}>Nothing in {statusDef.label.toLowerCase()}.</div>}
      {groupKeys.map(k => (
        <div key={k} className="col gap-2">
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <span style={{ font: "600 12px var(--sans)", color: "#fff" }}>{groupBy === "due" ? DUE_LABEL[k] : k}</span>
            <span className="chip chip-dim">{groups[k].length}</span>
            <div style={{ flex: 1, height: 1, background: "var(--line)" }}></div>
          </div>
          <div className="col gap-2">
            {groups[k].map(t => <TWRow key={t.id} t={t} selected={sel.includes(t.id)} onSel={() => toggleSel(t.id)} onEdit={setComposer} working={working.includes(t.id)} onOffload={() => setOffloadFor([t.id])} />)}
          </div>
        </div>
      ))}

      {/* bulk action bar */}
      {sel.length > 0 && (
        <div className="tw-bulk">
          <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 600 }}>{sel.length} selected</span>
          <div className="row gap-2">
            <button onClick={() => setOffloadFor([...sel])} className="btn btn-primary" style={{ height: 30 }}><Icon name="sparkle" cls="ic-sm" />Offload</button>
            <button onClick={() => bulk("done")} className="btn" style={{ height: 30 }}><Icon name="check" cls="ic-sm" />Complete</button>
            <button onClick={() => bulk("delete")} className="btn" style={{ height: 30, color: "var(--red)" }}><Icon name="trash" cls="ic-sm" /></button>
            <button onClick={clearSel} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", fontSize: 12 }}>Clear</button>
          </div>
        </div>
      )}

      {offloadFor && <OffloadSheet ids={offloadFor} store={store} agentStore={agentStore} onPick={offloadToAgent} onClose={() => setOffloadFor(null)} onNewAgent={() => { setOffloadFor(null); setNewAgent(true); }} />}
      {newAgent && <NewAgentSheet agentStore={agentStore} onClose={() => setNewAgent(false)} />}
    </div>
  );
}

function TWRow({ t, selected, onSel, onEdit, working, onOffload }) {
  const c = t.client ? getClient(t.client) : null;
  const ag = t.assignee;
  const isReview = t.status === "review";
  return (
    <div className="col gap-2" style={{ padding: "10px 12px", borderRadius: 10, background: selected ? "var(--bg-active)" : "var(--bg-2)", border: "1px solid " + (selected ? "var(--lime)" : isReview ? "#8b7cff44" : "var(--line)") }}>
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <button onClick={onSel} style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: "1.5px solid " + (selected ? "var(--lime)" : "var(--line-2)"), background: selected ? "var(--lime)" : "transparent", display: "grid", placeItems: "center", color: "#0a0a0a" }}>{selected && <Icon name="check" cls="ic-sm" />}</button>
        <PriorityDot p={t.priority} />
        <span onClick={() => onEdit(t)} className="truncate" style={{ flex: 1, fontSize: 13, color: "var(--ink-2)", cursor: "pointer", textDecoration: t.status === "done" ? "line-through" : "none" }}>{t.title}</span>
        {working && <span className="row gap-2" style={{ fontSize: 11, color: "var(--violet)", flexShrink: 0 }}><span className="live-dot" style={{ background: "var(--violet)" }}></span>working…</span>}
        {c && <span className="row gap-2" style={{ flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }}></span><span style={{ fontSize: 11, color: "var(--mute)" }}>{c.name.split(" ")[0]}</span></span>}
        <span className="chip chip-dim" style={{ flexShrink: 0 }}>{ag}</span>
        <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 50, justifyContent: "center" }}>{t.due}</span>
        <button onClick={onOffload} className="btn-ghost" style={{ width: 24, height: 24, border: "none", borderRadius: 6, cursor: "pointer", color: "var(--mute-2)", display: "grid", placeItems: "center", flexShrink: 0 }} title="Offload"><Icon name="sparkle" cls="ic-sm" /></button>
      </div>
      {isReview && t.agentResult && (
        <div className="row gap-2" style={{ padding: "9px 11px", borderRadius: 8, background: "#8b7cff12", border: "1px solid #8b7cff2e", marginLeft: 28 }}>
          <span style={{ color: "var(--violet)", flexShrink: 0 }}><Icon name="sparkle" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.5 }}><b style={{ color: "#fff" }}>{t.agentName || t.assignee}:</b> {t.agentResult}</span>
            <div className="row gap-2">
              <button onClick={() => window.TaskStore.patch(t.id, { status: "done" })} className="btn btn-primary" style={{ height: 26, fontSize: 11 }}><Icon name="check" cls="ic-sm" />Approve</button>
              <button onClick={() => window.TaskStore.patch(t.id, { status: "todo", agentResult: null })} className="btn" style={{ height: 26, fontSize: 11 }}>Send back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OffloadSheet({ ids, store, agentStore, onPick, onClose, onNewAgent }) {
  const agents = agentStore.agents(); const people = agentStore.people();
  return (
    <div className="acv-overlay" onClick={onClose} style={{ zIndex: 160 }}>
      <div className="acv-palette" onClick={e => e.stopPropagation()} style={{ width: 440 }}>
        <div className="row between" style={{ marginBottom: 4 }}><span style={{ font: "600 15px var(--sans)" }}>Offload {ids.length} task{ids.length > 1 ? "s" : ""}</span><button onClick={onClose} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)" }}><Icon name="x" /></button></div>
        <p style={{ fontSize: 12, color: "var(--mute)", margin: "0 0 14px" }}>AI agents do the work and hand it back for review. People just take ownership.</p>
        <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>AI agents</span>
        <div className="col gap-2" style={{ marginBottom: 14 }}>
          {agents.map(a => (
            <button key={a.id} onClick={() => onPick(ids, a)} className="acv-pal-item" style={{ width: "100%" }}>
              <span className="acv-node-ic" style={{ background: a.color + "22", color: a.color }}><Icon name={a.icon} cls="ic-sm" /></span>
              <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}><span style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{a.name}</span><span style={{ fontSize: 10.5, color: "var(--mute)" }}>{a.role}</span></div>
              <Icon name="arrowR" cls="ic-sm" />
            </button>
          ))}
          <button onClick={onNewAgent} className="row gap-2" style={{ padding: "10px 12px", borderRadius: 11, border: "1px dashed var(--line-3)", background: "var(--bg-2)", cursor: "pointer", color: "var(--mute)", font: "600 12px var(--sans)" }}><Icon name="plus" cls="ic-sm" />Create a new agent</button>
        </div>
        <span className="eyebrow" style={{ display: "block", marginBottom: 8 }}>People</span>
        <div className="col gap-2">
          {people.map(a => (
            <button key={a.id} onClick={() => onPick(ids, a)} className="acv-pal-item" style={{ width: "100%" }}>
              <span className="acv-node-ic" style={{ background: a.color + "22", color: a.color }}><Icon name={a.icon} cls="ic-sm" /></span>
              <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}><span style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{a.name}</span><span style={{ fontSize: 10.5, color: "var(--mute)" }}>{a.role}</span></div>
              <Icon name="arrowR" cls="ic-sm" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewAgentSheet({ agentStore, onClose }) {
  const [name, setName] = useState(""); const [role, setRole] = useState("");
  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none", boxSizing: "border-box" };
  return (
    <div className="acv-overlay" onClick={onClose} style={{ zIndex: 170 }}>
      <div className="acv-palette" onClick={e => e.stopPropagation()} style={{ width: 400 }}>
        <div className="row between" style={{ marginBottom: 14 }}><span className="row gap-2" style={{ font: "600 15px var(--sans)" }}><Icon name="sparkle" cls="ic-sm" />New AI agent</span><button onClick={onClose} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)" }}><Icon name="x" /></button></div>
        <div className="col gap-3">
          <div className="col gap-2"><label className="acv-lbl">Agent name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SEO Agent" style={inp} autoFocus /></div>
          <div className="col gap-2"><label className="acv-lbl">What it does</label><input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Keyword research & on-page fixes" style={inp} /></div>
          <button onClick={() => { if (name.trim()) { agentStore.create({ name: name.trim(), role: role.trim() || "Custom agent" }); onClose(); } }} disabled={!name.trim()} className="btn btn-primary" style={{ height: 38, justifyContent: "center", opacity: name.trim() ? 1 : 0.5 }}><Icon name="plus" cls="ic-sm" />Create agent</button>
        </div>
      </div>
    </div>
  );
}

window.TasksWorkspace = TasksWorkspace;
