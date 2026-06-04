// Node-graph automation builder — n8n / Make / Zapier style.
// Drag nodes, connect ports with wires, configure each node, and Run to flow through the graph.

const NODE_HOOKS = [
  { id: "meta", name: "Meta / Facebook", icon: "megaphone", color: "#4A90E2" },
  { id: "google", name: "Google Ads", icon: "trend", color: "#34A853" },
  { id: "gbp", name: "Google Business", icon: "star", color: "#FFB547" },
  { id: "wa", name: "WhatsApp", icon: "msg", color: "#25D366" },
  { id: "stripe", name: "Stripe", icon: "euro", color: "#8B7CFF" },
  { id: "cal", name: "Calendar", icon: "calendar", color: "#5BCEFA" },
  { id: "ai", name: "AI Agent", icon: "sparkle", color: "#CFFF3A" },
  { id: "sms", name: "SMS / Phone", icon: "phoneMissed", color: "#FF7A8A" },
  { id: "email", name: "Email / Gmail", icon: "mail", color: "#EA4335" },
  { id: "slack", name: "Slack", icon: "msg", color: "#E01E5A" },
  { id: "telegram", name: "Telegram", icon: "bell", color: "#2AABEE" },
  { id: "sheets", name: "Google Sheets", icon: "layers", color: "#0F9D58" },
  { id: "hubspot", name: "HubSpot CRM", icon: "users", color: "#FF7A59" },
  { id: "notion", name: "Notion", icon: "doc", color: "#cfcfcf" },
  { id: "openai", name: "OpenAI / GPT", icon: "sparkle", color: "#10A37F" },
  { id: "webhook", name: "Webhook / HTTP", icon: "link", color: "#9b8cff" },
  { id: "zapier", name: "Zapier", icon: "bolt", color: "#FF4F00" }
];
const TRIGGER_TYPES_LIST = [
  { id: "status", name: "Status change", icon: "euro", ex: "→ Paid / Onboarding / Live" },
  { id: "lead", name: "New lead", icon: "inbox", ex: "from any source" },
  { id: "inbound", name: "Inbound message", icon: "msg", ex: "DM / WhatsApp / SMS" },
  { id: "missed", name: "Missed call", icon: "phoneMissed", ex: "on a client line" },
  { id: "review", name: "New review", icon: "star", ex: "Google / Facebook" },
  { id: "schedule", name: "Schedule", icon: "clock", ex: "hourly / daily / weekly" },
  { id: "metric", name: "Metric threshold", icon: "trend", ex: "ROAS, health, MRR…" },
  { id: "webhook", name: "Webhook", icon: "link", ex: "external app fires it" }
];

const NODE_PALETTE = [
  { kind: "action", name: "Run AI agent", icon: "sparkle", desc: "An agent evaluates & acts" },
  { kind: "action", name: "Send message", icon: "msg", desc: "SMS / WhatsApp / email" },
  { kind: "action", name: "Create task", icon: "checkSquare", desc: "Adds a task to the queue" },
  { kind: "action", name: "Book / calendar", icon: "calendar", desc: "Creates a booking" },
  { kind: "action", name: "Post content", icon: "megaphone", desc: "Drafts & schedules a post" },
  { kind: "action", name: "Notify you", icon: "bell", desc: "Telegram + in-app ping" },
  { kind: "filter", name: "Condition", icon: "shield", desc: "Only continue if…" },
  { kind: "action", name: "Wait / delay", icon: "clock", desc: "Pause then continue" }
];

const NW = 210, NH = 78; // node box size

function genGraphFromChain(c, store) {
  const existing = store.graph(c.id);
  if (existing) return existing;
  const steps = store.detailSteps(c.id) || [
    { icon: "sparkle", name: "AI processes", desc: "Agent evaluates and acts" },
    { icon: c.icon, name: c.action, desc: "Action fires" }
  ];
  const nodes = [{ id: "n_trigger", kind: "trigger", name: c.trigger, icon: "bolt", x: 60, y: 200, hook: null, template: "" }];
  let x = 320;
  steps.forEach((s, i) => {
    nodes.push({ id: "n" + i, kind: "action", name: s.name, icon: s.icon || "sparkle", desc: s.desc, x, y: 200 + (i % 2 === 0 ? 0 : 0), hook: s.hook || null, template: s.template || "" });
    x += 270;
  });
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  return { nodes, edges };
}

function AutomationCanvas({ c, store, onClose }) {
  const [graph, setGraph] = useState(() => genGraphFromChain(c, store));
  const [sel, setSel] = useState(null);          // selected node id (config)
  const [connectFrom, setConnectFrom] = useState(null); // node id awaiting target
  const [running, setRunning] = useState(false);
  const [activeNode, setActiveNode] = useState(null);
  const [runLog, setRunLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [palette, setPalette] = useState(false);
  const [askAI, setAskAI] = useState(false);
  const [nodeAsk, setNodeAsk] = useState("");
  const [nodeBuilding, setNodeBuilding] = useState(false);
  const drag = useRef(null);
  const canvasRef = useRef(null);
  const pan = useRef(null);

  function commit(g) { setGraph(g); store.setGraph(c.id, g); }
  const node = id => graph.nodes.find(n => n.id === id);

  // ----- pan the canvas by dragging empty space -----
  function onCanvasDown(e) {
    if (e.target.closest(".acv-node") || e.target.closest(".acv-cfg") || e.target.closest(".acv-log") || e.target.closest(".acv-wire-del")) return;
    const el = canvasRef.current;
    pan.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: false };
    el.classList.add("panning");
  }
  useEffect(() => {
    function move(e) {
      if (!pan.current) return;
      const p = pan.current, dx = e.clientX - p.sx, dy = e.clientY - p.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true;
      canvasRef.current.scrollLeft = p.sl - dx;
      canvasRef.current.scrollTop = p.st - dy;
    }
    function up() { if (pan.current) { canvasRef.current && canvasRef.current.classList.remove("panning"); pan.current = null; } }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  // ----- drag nodes -----
  function onPointerDown(e, id) {
    if (e.target.closest(".nd-port") || e.target.closest(".nd-cfg")) return;
    const n = node(id); const startX = e.clientX, startY = e.clientY, ox = n.x, oy = n.y;
    drag.current = { id, startX, startY, ox, oy, moved: false };
    e.stopPropagation();
  }
  useEffect(() => {
    function move(e) {
      if (!drag.current) return;
      const d = drag.current; const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
      setGraph(g => ({ ...g, nodes: g.nodes.map(n => n.id === d.id ? { ...n, x: Math.max(0, d.ox + dx), y: Math.max(0, d.oy + dy) } : n) }));
    }
    function up() { if (drag.current) { const moved = drag.current.moved; const id = drag.current.id; drag.current = null; store.setGraph(c.id, graphRef.current); if (!moved) setSel(s => s === id ? s : id); } }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  const graphRef = useRef(graph); graphRef.current = graph;

  // ----- connect ports (click OR drag) -----
  const wire = useRef(null);
  const [wireLive, setWireLive] = useState(null); // {x1,y1,x2,y2}
  function portClick(e, id, side) {
    e.stopPropagation();
    if (side === "out") { setConnectFrom(id); }
    else if (side === "in" && connectFrom && connectFrom !== id) {
      const exists = graph.edges.some(ed => ed.from === connectFrom && ed.to === id);
      if (!exists) commit({ ...graph, edges: [...graph.edges, { from: connectFrom, to: id }] });
      setConnectFrom(null);
    }
  }
  function onPortDown(e, id) {
    e.stopPropagation(); e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = canvasRef.current.scrollLeft, sy = canvasRef.current.scrollTop;
    wire.current = { from: id, rect, sx, sy };
    setConnectFrom(id);
  }
  useEffect(() => {
    function move(e) {
      if (!wire.current) return;
      const w = wire.current;
      const x = e.clientX - w.rect.left + canvasRef.current.scrollLeft;
      const y = e.clientY - w.rect.top + canvasRef.current.scrollTop;
      const a = node(w.from); if (!a) return;
      setWireLive({ x1: a.x + NW, y1: a.y + NH / 2, x2: x, y2: y });
    }
    function up(e) {
      if (!wire.current) return;
      const w = wire.current; wire.current = null; setWireLive(null);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const port = el && el.closest && el.closest("[data-nodein]");
      if (port) {
        const to = port.getAttribute("data-nodein");
        if (to && to !== w.from) {
          const g = graphRef.current;
          if (!g.edges.some(ed => ed.from === w.from && ed.to === to)) commit({ ...g, edges: [...g.edges, { from: w.from, to }] });
        }
        setConnectFrom(null);
      }
    }
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);
  function removeEdge(i) { commit({ ...graph, edges: graph.edges.filter((_, idx) => idx !== i) }); }

  // ----- add / remove nodes -----
  function addNode(p) {
    const id = "n_" + Date.now().toString(36);
    const last = graph.nodes[graph.nodes.length - 1];
    const nn = { id, kind: p.kind, name: p.name, icon: p.icon, desc: p.desc, x: (last ? last.x + 60 : 320), y: (last ? last.y + 120 : 200), hook: null, template: "" };
    commit({ ...graph, nodes: [...graph.nodes, nn] });
    setPalette(false); setSel(id);
  }
  async function claudeBuildNode() {
    if (!nodeAsk.trim() || nodeBuilding) return;
    setNodeBuilding(true);
    const hookIds = NODE_HOOKS.map(h => h.id).join(", ");
    const prompt = `You are Claude building one automation step for "${c.name}". The user wants: "${nodeAsk.trim()}". Reply ONLY with JSON: {"name":"short step name","icon":"one of sparkle,msg,checkSquare,calendar,megaphone,bell,shield,clock,inbox,star,phoneMissed,trend,euro,mail,users,doc,link","hook":"one of: ${hookIds}","kind":"action or filter","template":"the concrete message/rule for this step"}. No prose.`;
    try {
      const r = await window.claude.complete(prompt);
      const m = r.match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : null;
      const id = "n_" + Date.now().toString(36);
      const last = graph.nodes[graph.nodes.length - 1];
      const nn = { id, kind: (o && o.kind === "filter") ? "filter" : "action", name: (o && o.name) || nodeAsk.trim().slice(0, 40), icon: (o && o.icon) || "sparkle", desc: "", hook: (o && NODE_HOOKS.some(h => h.id === o.hook)) ? o.hook : null, template: (o && o.template) || "", x: (last ? last.x + 270 : 320), y: (last ? last.y : 200) };
      const edges = last ? [...graph.edges, { from: last.id, to: id }] : graph.edges;
      commit({ nodes: [...graph.nodes, nn], edges });
      setNodeAsk(""); setPalette(false); setSel(id);
    } catch (e) {}
    setNodeBuilding(false);
  }
  function delNode(id) {
    if (id === "n_trigger") return;
    commit({ nodes: graph.nodes.filter(n => n.id !== id), edges: graph.edges.filter(e => e.from !== id && e.to !== id) });
    setSel(null);
  }
  function patchNode(id, patch) { commit({ ...graph, nodes: graph.nodes.map(n => n.id === id ? { ...n, ...patch } : n) }); }

  // ----- run -----
  async function run() {
    setRunning(true); setShowLog(true); setRunLog([]);
    // topological-ish order: follow edges from trigger
    const order = []; const seen = new Set();
    function walk(id) { if (seen.has(id)) return; seen.add(id); order.push(id); graph.edges.filter(e => e.from === id).forEach(e => walk(e.to)); }
    walk("n_trigger");
    graph.nodes.forEach(n => { if (!seen.has(n.id)) order.push(n.id); });
    for (const id of order) {
      const n = node(id);
      setActiveNode(id);
      const hook = NODE_HOOKS.find(h => h.id === n.hook);
      setRunLog(l => [...l, { node: n.name, ok: true, via: hook ? hook.name : (n.kind === "trigger" ? "Trigger fired" : "Ran") }]);
      await new Promise(r => setTimeout(r, 620));
    }
    setActiveNode(null); setRunning(false);
  }

  const selNode = sel ? node(sel) : null;

  return (
    <div className="acv-root">
      {/* toolbar */}
      <div className="acv-bar">
        <div className="row gap-3" style={{ alignItems: "center", minWidth: 0 }}>
          <button onClick={onClose} className="acv-btn"><Icon name="chevL" cls="ic-sm" />Close</button>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: c.accent + "1f", color: c.accent, border: "1px solid " + c.accent + "44", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={c.icon} cls="ic-sm" /></span>
          <div className="col" style={{ gap: 0, minWidth: 0 }}>
            <span style={{ font: "600 14px var(--sans)", color: "#fff" }} className="truncate">{c.name}</span>
            <span style={{ fontSize: 11, color: "var(--mute)" }}>{graph.nodes.length} nodes · {graph.edges.length} connections</span>
          </div>
        </div>
        <div className="row gap-2">
          <button onClick={() => setPalette(true)} className="acv-btn"><Icon name="plus" cls="ic-sm" />Add node</button>
          <button onClick={() => setAskAI(true)} className="acv-btn"><Icon name="sparkle" cls="ic-sm" />Ask Claude</button>
          <button onClick={() => setShowLog(s => !s)} className="acv-btn"><Icon name="layers" cls="ic-sm" />Run log</button>
          <button onClick={run} disabled={running} className="acv-btn acv-run">{running ? <React.Fragment><span className="live-dot" style={{ background: "#0a0a0a" }}></span>Running…</React.Fragment> : <React.Fragment><Icon name="play" cls="ic-sm" />Run</React.Fragment>}</button>
          <button onClick={onClose} className="acv-btn acv-x"><Icon name="x" cls="ic-sm" /></button>
        </div>
      </div>

      {connectFrom && <div className="acv-hint">Click an input port (left side of a node) to connect — or <button onClick={() => setConnectFrom(null)} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>cancel</button></div>}

      {/* canvas */}
      <div className="acv-canvas" ref={canvasRef} onPointerDown={onCanvasDown} onClick={(e) => { if (pan.current && pan.current.moved) return; setSel(null); setConnectFrom(null); }}>
        <div className="acv-scroll">
          {/* edges */}
          <svg className="acv-edges" width="3000" height="1600">
            {graph.edges.map((e, i) => {
              const a = node(e.from), b = node(e.to); if (!a || !b) return null;
              const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2;
              const mx = (x1 + x2) / 2;
              const active = running && activeNode && (activeNode === e.to);
              return (
                <g key={i}>
                  <path d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke={active ? c.accent : "var(--line-3)"} strokeWidth={active ? 3 : 2} className="acv-wire" />
                  <circle cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="9" fill="var(--bg-2)" stroke="var(--line-2)" className="acv-wire-del" onClick={ev => { ev.stopPropagation(); removeEdge(i); }} />
                  <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + 3} textAnchor="middle" fontSize="11" fill="var(--mute)" style={{ pointerEvents: "none" }}>×</text>
                </g>
              );
            })}
            {wireLive && <path d={`M ${wireLive.x1} ${wireLive.y1} C ${(wireLive.x1 + wireLive.x2) / 2} ${wireLive.y1}, ${(wireLive.x1 + wireLive.x2) / 2} ${wireLive.y2}, ${wireLive.x2} ${wireLive.y2}`} fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeDasharray="6 5" style={{ pointerEvents: "none" }} />}
          </svg>
          {/* nodes */}
          {graph.nodes.map(n => {
            const hook = NODE_HOOKS.find(h => h.id === n.hook);
            const isActive = activeNode === n.id;
            const isTrigger = n.kind === "trigger";
            return (
              <div key={n.id} className={"acv-node born" + (sel === n.id ? " sel" : "") + (isActive ? " active" : "")}
                style={{ left: n.x, top: n.y, width: NW, animationDelay: (graph.nodes.indexOf(n) * 0.08) + "s", borderColor: isActive ? c.accent : isTrigger ? "var(--lime)" : (sel === n.id ? "var(--line-3)" : "var(--line-2)"), boxShadow: isActive ? "0 0 0 3px " + c.accent + "44, 0 10px 30px #000a" : undefined }}
                onPointerDown={e => onPointerDown(e, n.id)} onClick={e => { e.stopPropagation(); setSel(n.id); }}>
                {/* input port */}
                {!isTrigger && <span data-nodein={n.id} className={"nd-port nd-in" + (connectFrom ? " live" : "")} onClick={e => portClick(e, n.id, "in")} title="Input"></span>}
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <span className="acv-node-ic" style={{ background: (isTrigger ? "var(--lime)" : (hook ? hook.color : c.accent)) + "22", color: isTrigger ? "var(--lime)" : (hook ? hook.color : c.accent) }}><Icon name={n.icon} cls="ic-sm" /></span>
                  <div className="col" style={{ gap: 1, minWidth: 0, flex: 1 }}>
                    <span className="acv-node-kind">{isTrigger ? "TRIGGER" : n.kind === "filter" ? "CONDITION" : "ACTION"}</span>
                    <span className="acv-node-name truncate">{n.name}</span>
                  </div>
                </div>
                <div className="row between" style={{ marginTop: 8 }}>
                  {hook ? <span className="acv-hookchip" style={{ color: hook.color, borderColor: hook.color + "55" }}><Icon name="link" cls="ic-sm" />{hook.name}</span>
                    : <span className="acv-hookchip dim" onClick={e => { e.stopPropagation(); setSel(n.id); }}><Icon name="link" cls="ic-sm" />Not hooked up</span>}
                  <button className="nd-cfg" onClick={e => { e.stopPropagation(); setSel(n.id); }}><Icon name="edit" cls="ic-sm" /></button>
                </div>
                {/* output port */}
                <span data-nodeout={n.id} className={"nd-port nd-out" + (connectFrom === n.id ? " armed" : "")} onPointerDown={e => onPortDown(e, n.id)} onClick={e => portClick(e, n.id, "out")} title="Drag to connect"></span>
              </div>
            );
          })}
        </div>

        {/* run log */}
        {showLog && (
          <div className="acv-log" onClick={e => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: 10 }}>
              <span className="eyebrow" style={{ margin: 0 }}>Run log</span>
              <button onClick={() => setShowLog(false)} className="btn-ghost" style={{ width: 24, height: 24, border: "none", cursor: "pointer", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="x" cls="ic-sm" /></button>
            </div>
            {runLog.length === 0 ? <span style={{ fontSize: 12, color: "var(--mute)" }}>Hit Run to watch it flow through every node.</span>
              : runLog.map((r, i) => (
                <div key={i} className="row gap-2 acv-log-row" style={{ animationDelay: (i * 0.05) + "s" }}>
                  <span style={{ color: "var(--lime)" }}><Icon name="check" cls="ic-sm" /></span>
                  <span style={{ fontSize: 12, color: "var(--ink-2)", flex: 1 }}>{r.node}</span>
                  <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{r.via}</span>
                </div>
              ))}
            {running && <div className="row gap-2" style={{ marginTop: 6 }}><span className="live-dot"></span><span style={{ fontSize: 11.5, color: "var(--mute)" }}>Executing…</span></div>}
          </div>
        )}
      </div>

      {/* node config panel */}
      {selNode && <NodeConfig n={selNode} accent={c.accent} store={store} onPatch={p => patchNode(selNode.id, p)} onDelete={() => delNode(selNode.id)} onClose={() => setSel(null)} onAskClaude={() => setAskAI(true)} />}

      {askAI && <CanvasAI c={c} graph={graph} offset={!!selNode} node={selNode} onNodePatch={p => selNode && patchNode(selNode.id, p)} onConnect={tool => store.connectTool(tool, { at: Date.now() })} onClose={() => setAskAI(false)} onApply={spec => { if (spec && spec.nodes) commit(spec); }} />}

      {/* palette */}
      {palette && (
        <div className="acv-overlay" onClick={() => setPalette(false)}>
          <div className="acv-palette" onClick={e => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: 12 }}><span style={{ font: "600 14px var(--sans)" }}>Add a node</span><button onClick={() => setPalette(false)} className="acv-x btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)" }}><Icon name="x" /></button></div>
            {/* Claude builds the node */}
            <div className="acv-rec" style={{ marginBottom: 12 }}>
              <span className="row gap-2" style={{ fontSize: 11, color: "#b4a8ff", fontWeight: 600, marginBottom: 7 }}><Icon name="sparkle" cls="ic-sm" />Describe a step — Claude builds & connects it</span>
              <div className="row gap-2">
                <input value={nodeAsk} onChange={e => setNodeAsk(e.target.value)} onKeyDown={e => e.key === "Enter" && claudeBuildNode()} placeholder="e.g. text the customer their booking reminder" className="acv-input" style={{ flex: 1 }} disabled={nodeBuilding} />
                <button onClick={claudeBuildNode} disabled={!nodeAsk.trim() || nodeBuilding} className="btn btn-primary" style={{ height: 36, opacity: nodeAsk.trim() && !nodeBuilding ? 1 : 0.5 }}>{nodeBuilding ? <span className="live-dot" style={{ background: "#0a0a0a" }}></span> : <Icon name="arrowR" cls="ic-sm" />}</button>
              </div>
            </div>
            <span className="acv-lbl" style={{ display: "block", marginBottom: 7 }}>Or pick a preset</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {NODE_PALETTE.map((p, i) => (
                <button key={i} onClick={() => addNode(p)} className="acv-pal-item">
                  <span className="acv-node-ic" style={{ background: "var(--bg-3)", color: c.accent }}><Icon name={p.icon} cls="ic-sm" /></span>
                  <div className="col" style={{ gap: 1, minWidth: 0 }}><span style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{p.name}</span><span style={{ fontSize: 10.5, color: "var(--mute)" }}>{p.desc}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NodeConfig({ n, accent, store, onPatch, onDelete, onClose, onAskClaude }) {
  const isTrigger = n.kind === "trigger";
  const hookMeta = NODE_HOOKS.find(h => h.id === n.hook);
  const connected = n.hook ? store.isConnected(n.hook) : false;
  const [flow, setFlow] = useState(null); // 'oauth' | 'keys'
  const [aiSetup, setAiSetup] = useState(null); // {busy, text}
  const [desc, setDesc] = useState(n.explain || null); // plain-english summary
  const [descBusy, setDescBusy] = useState(false);
  const [rec, setRec] = useState(n.rec || null);
  const [recBusy, setRecBusy] = useState(false);
  const [customAsk, setCustomAsk] = useState(null); // 'trigger' | 'source'
  const [sec, setSec] = useState(isTrigger ? "event" : "connect");
  useEffect(() => { setSec(isTrigger ? "event" : "connect"); }, [n.id, isTrigger]);
  const SECTIONS = isTrigger
    ? [{ id: "event", label: "Event", icon: "bolt" }, { id: "source", label: "Source", icon: "link" }, { id: "detail", label: "Details", icon: "clock" }]
    : [{ id: "connect", label: "Connect", icon: "link" }, { id: "action", label: "Action", icon: "msg" }, { id: "optimise", label: "Optimise", icon: "sparkle" }];

  const TRIGGER_TYPES = TRIGGER_TYPES_LIST;
  function doConnect(mode) { setFlow(mode); }
  function finishConnect() { if (n.hook) store.connectTool(n.hook, { at: Date.now() }); setFlow(null); }

  async function aiCreate() {
    if (!hookMeta) return;
    setAiSetup({ busy: true });
    const prompt = `You are Claude operating inside BizBoost with connected access to the client's ${hookMeta.name} account. The automation step is "${n.name}". Describe, in 2-3 short sentences, exactly what you would create/configure in ${hookMeta.name} to make this step work end-to-end (e.g. products, webhooks, templates, API objects). Be concrete and specific, first-person ("I've created…"). No markdown.`;
    try { const r = await window.claude.complete(prompt); setAiSetup({ busy: false, text: (r || "").trim() }); if (n.hook) store.connectTool(n.hook, { at: Date.now() }); }
    catch (e) { setAiSetup({ busy: false, text: "I'll handle the setup on the backend once access is granted." }); }
  }

  async function explain() {
    setDescBusy(true);
    const prompt = `Explain this automation ${isTrigger ? "trigger" : "step"} so a smart 8-year-old gets it. Step name: "${n.name}". ${n.tType ? "Trigger type: " + n.tType + ". " : ""}${hookMeta ? "Tool: " + hookMeta.name + ". " : ""}${n.template ? "Detail: " + n.template + ". " : ""}One short, warm, plain-English sentence (max 2). What does this part DO and why does it matter? No jargon, no markdown.`;
    try { const r = await window.claude.complete(prompt); const t = (r || "").trim(); setDesc(t); onPatch({ explain: t }); }
    catch (e) { const t = isTrigger ? "This is the spark — it watches for something to happen, then kicks the whole automation off." : "This step does one job automatically so you don't have to."; setDesc(t); onPatch({ explain: t }); }
    setDescBusy(false);
  }

  async function recommend() {
    setRecBusy(true);
    const prompt = `You are Claude optimising a BizBoost automation step. Step: "${n.name}"${hookMeta ? ", powered by " + hookMeta.name : ""}${n.template ? ', detail: "' + n.template + '"' : ""}. Suggest ONE concrete improvement focused on removing friction / saving time or money / capturing more. Reply as compact JSON only: {"idea":"one-line idea","now":"how it works today (short)","future":"how it'd work after (short)","willHappen":"a good outcome example","wontHappen":"a bad thing it prevents"}. No markdown, JSON only.`;
    try {
      const r = await window.claude.complete(prompt);
      const m = r.match(/\{[\s\S]*\}/); const obj = m ? JSON.parse(m[0]) : null;
      if (obj) { setRec(obj); onPatch({ rec: obj }); } else { setRec({ idea: (r || "").trim() }); }
    } catch (e) { setRec({ idea: "Connect this step to AI so it handles edge-cases without you." }); }
    setRecBusy(false);
  }

  return (
    <div className="acv-cfg" onClick={e => e.stopPropagation()}>
      {flow && <NodeConnectFlow hook={hookMeta} mode={flow} onClose={() => setFlow(null)} onDone={finishConnect} />}
      <div className="row between" style={{ padding: "15px 16px", borderBottom: "1px solid var(--line)" }}>
        <span className="eyebrow" style={{ margin: 0 }}>{isTrigger ? "Trigger" : "Configure node"}</span>
        <div className="row gap-2">
          <button onClick={onAskClaude} className="btn" style={{ height: 26, fontSize: 11 }}><Icon name="sparkle" cls="ic-sm" />Ask Claude</button>
          <button onClick={onClose} className="btn-ghost" style={{ width: 26, height: 26, border: "none", cursor: "pointer", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="x" cls="ic-sm" /></button>
        </div>
      </div>
      {/* name + section tabs */}
      <div className="col gap-3" style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="col gap-2">
          <label className="acv-lbl">{isTrigger ? "Trigger name" : "Step name"}</label>
          <input value={n.name} onChange={e => onPatch({ name: e.target.value })} className="acv-input" />
        </div>
        <div className="acv-secnav">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSec(s.id)} className={"acv-sectab" + (sec === s.id ? " on" : "")}>
              <Icon name={s.icon} cls="ic-sm" />{s.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI command bar — configure this whole node from a sentence */}
      <NodeAIBar n={n} isTrigger={isTrigger} onPatch={onPatch} onConnect={tool => store.connectTool(tool, { at: Date.now() })} setSec={setSec} />

      <div className="col gap-4" style={{ padding: 16, overflowY: "auto", flex: 1 }}>
        {/* ===== TRIGGER · EVENT ===== */}
        {isTrigger && sec === "event" && (
          <div className="col gap-2">
            <label className="acv-lbl">What happens?</label>
            <span className="acv-help">Pick the kind of event that kicks this whole automation off.</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 4 }}>
              {TRIGGER_TYPES.map(t => {
                const on = n.tType === t.id;
                return (
                  <button key={t.id} onClick={() => onPatch({ tType: t.id })} className="row gap-2" style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: on ? "var(--lime)1f" : "var(--bg-2)", border: "1px solid " + (on ? "var(--lime)" : "var(--line)") }}>
                    <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: on ? "var(--lime)" : "var(--bg-3)", color: on ? "#0a0a0a" : "var(--lime)", flexShrink: 0 }}><Icon name={t.icon} cls="ic-sm" /></span>
                    <div className="col" style={{ gap: 0, minWidth: 0 }}><span style={{ font: "600 11.5px var(--sans)", color: on ? "#fff" : "var(--ink-2)" }} className="truncate">{t.name}</span><span style={{ fontSize: 9.5, color: "var(--mute-2)" }} className="truncate">{t.ex}</span></div>
                  </button>
                );
              })}
              {n.tType && n.tType.indexOf("custom:") === 0 && (
                <div className="row gap-2" style={{ padding: "9px 10px", borderRadius: 9, background: "var(--lime)1f", border: "1px solid var(--lime)" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--lime)", color: "#0a0a0a", flexShrink: 0 }}><Icon name="bolt" cls="ic-sm" /></span>
                  <span style={{ font: "600 11.5px var(--sans)", color: "#fff" }} className="truncate">{n.tType.slice(7)}</span>
                </div>
              )}
              <button onClick={() => setCustomAsk("trigger")} className="row gap-2" style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: "var(--bg-2)", border: "1px dashed var(--line-3)" }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--bg-3)", color: "var(--mute)", flexShrink: 0 }}><Icon name="plus" cls="ic-sm" /></span>
                <span style={{ font: "600 11.5px var(--sans)", color: "var(--mute)" }}>Custom event…</span>
              </button>
            </div>
          </div>
        )}

        {/* ===== TRIGGER · DETAIL ===== */}
        {isTrigger && sec === "detail" && (
          <TriggerSetup n={n} onPatch={onPatch} hookMeta={hookMeta} />
        )}

        {/* ===== SOURCE / CONNECT (trigger source OR action powered-by) ===== */}
        {((isTrigger && sec === "source") || (!isTrigger && sec === "connect")) && (
          <React.Fragment>
            <div className="col gap-2">
              <label className="acv-lbl">{isTrigger ? "Which app fires this?" : "What powers this step?"}</label>
              <span className="acv-help">{isTrigger ? "The tool we watch for the event." : "The tool that carries out this action."}</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 4 }}>
                {NODE_HOOKS.map(h => {
                  const on = n.hook === h.id;
                  return (
                    <button key={h.id} onClick={() => onPatch({ hook: on ? null : h.id })} className="row gap-2" style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: on ? h.color + "1f" : "var(--bg-2)", border: "1px solid " + (on ? h.color : "var(--line)") }}>
                      <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: on ? h.color : "var(--bg-3)", color: on ? "#0a0a0a" : h.color, flexShrink: 0 }}><Icon name={h.icon} cls="ic-sm" /></span>
                      <span style={{ font: "600 11.5px var(--sans)", color: on ? "#fff" : "var(--ink-2)", minWidth: 0 }} className="truncate">{h.name}</span>
                    </button>
                  );
                })}
                <button onClick={() => setCustomAsk("source")} className="row gap-2" style={{ padding: "9px 10px", borderRadius: 9, cursor: "pointer", textAlign: "left", background: "var(--bg-2)", border: "1px dashed var(--line-3)" }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--bg-3)", color: "var(--mute)", flexShrink: 0 }}><Icon name="plus" cls="ic-sm" /></span>
                  <span style={{ font: "600 11.5px var(--sans)", color: "var(--mute)" }}>Custom…</span>
                </button>
              </div>
            </div>
            {hookMeta && (
              <div className="col gap-2">
                <label className="acv-lbl">Connection · {hookMeta.name}</label>
                <div className="acv-aisetup">
                  {aiSetup && aiSetup.text ? (
                    <div className="col gap-2">
                      <span className="row gap-2" style={{ fontSize: 11, color: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" />Claude set this up</span>
                      <span style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>{aiSetup.text}</span>
                    </div>
                  ) : (
                    <button onClick={aiCreate} disabled={aiSetup && aiSetup.busy} className="acv-aibtn">
                      {aiSetup && aiSetup.busy ? <React.Fragment><span className="live-dot"></span>Claude is setting it up…</React.Fragment> : <React.Fragment><Icon name="sparkle" cls="ic-sm" />Let Claude set up {hookMeta.name}</React.Fragment>}
                    </button>
                  )}
                </div>
                {connected ? (
                  <div className="acv-conn ok">
                    <span className="row gap-2" style={{ minWidth: 0 }}><span style={{ width: 26, height: 26, borderRadius: 7, background: hookMeta.color + "22", color: hookMeta.color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="check" cls="ic-sm" /></span><div className="col" style={{ gap: 0, minWidth: 0 }}><span style={{ font: "600 12px var(--sans)", color: "#fff" }}>Connected</span><span style={{ fontSize: 10.5, color: "var(--lime)" }}>Claude can act on this account</span></div></span>
                    <button onClick={() => store.disconnectTool(n.hook)} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute-2)", fontSize: 10.5 }}>Disconnect</button>
                  </div>
                ) : (
                  <div className="row gap-2">
                    <button onClick={() => doConnect("oauth")} className="btn btn-primary" style={{ height: 32, flex: 1, justifyContent: "center" }}><Icon name="link" cls="ic-sm" />Connect {hookMeta.name}</button>
                    <button onClick={() => doConnect("keys")} className="btn" style={{ height: 32 }} title="Paste API keys">Use keys</button>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        )}

        {/* ===== ACTION ===== */}
        {!isTrigger && sec === "action" && (
          <div className="col gap-2">
            <label className="acv-lbl">What it does</label>
            <span className="acv-help">The message, content or rule this step runs{hookMeta ? " through " + hookMeta.name : ""}.</span>
            <textarea value={n.template || ""} onChange={e => onPatch({ template: e.target.value })} rows={6} placeholder={"e.g. “Hi {{name}}, thanks for getting in touch — when suits for a quick call?”"} className="acv-input" style={{ resize: "vertical", lineHeight: 1.55, marginTop: 4 }} />
          </div>
        )}

        {/* ===== OPTIMISE ===== */}
        {!isTrigger && sec === "optimise" && (
          <div className="acv-rec">
            {rec ? (
              <div className="col gap-2">
                <span className="row gap-2" style={{ fontSize: 11, color: "#8B7CFF", fontWeight: 600 }}><Icon name="sparkle" cls="ic-sm" />Claude's recommendation</span>
                <span style={{ fontSize: 12.5, color: "#fff", fontWeight: 600, lineHeight: 1.45 }}>{rec.idea}</span>
                {rec.now && <div className="acv-rec-row"><span className="acv-rec-tag">Now</span><span>{rec.now}</span></div>}
                {rec.future && <div className="acv-rec-row"><span className="acv-rec-tag lime">After</span><span>{rec.future}</span></div>}
                {rec.willHappen && <div className="acv-rec-row"><span style={{ color: "var(--lime)", flexShrink: 0 }}><Icon name="check" cls="ic-sm" /></span><span>{rec.willHappen}</span></div>}
                {rec.wontHappen && <div className="acv-rec-row"><span style={{ color: "var(--red)", flexShrink: 0 }}><Icon name="shield" cls="ic-sm" /></span><span>Prevents: {rec.wontHappen}</span></div>}
                <button onClick={recommend} disabled={recBusy} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", fontSize: 10.5, alignSelf: "flex-start" }}>{recBusy ? "Thinking…" : "↻ Another idea"}</button>
              </div>
            ) : (
              <button onClick={recommend} disabled={recBusy} className="acv-recbtn">
                {recBusy ? <React.Fragment><span className="live-dot" style={{ background: "#8B7CFF" }}></span>Claude is looking for an improvement…</React.Fragment> : <React.Fragment><Icon name="sparkle" cls="ic-sm" />Get Claude's recommendation for this step</React.Fragment>}
              </button>
            )}
          </div>
        )}
      </div>

      {/* live status — pinned bottom */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--line)" }}>
        <div className="acv-cfg-status" style={{ borderColor: connected ? accent + "44" : "var(--line)", margin: 0 }}>
          <span className="row gap-2" style={{ fontSize: 11.5, color: connected ? accent : "var(--mute)" }}><span className="live-dot" style={{ background: connected ? accent : "var(--mute-2)" }}></span>{isTrigger ? (n.tType ? "Trigger is live" : "Pick an event") : connected ? "Connected & ready to run" : n.hook ? "Connect " + (hookMeta ? hookMeta.name : "the tool") + " to go live" : "Pick what powers this step"}</span>
        </div>
      </div>

      {customAsk && <CustomNameModal kind={customAsk} onClose={() => setCustomAsk(null)} onSave={(v) => {
        if (customAsk === "trigger") onPatch({ tType: "custom:" + v });
        else { const id = "custom:" + v; if (!NODE_HOOKS.some(h => h.id === id)) NODE_HOOKS.push({ id, name: v, icon: "link", color: "#9b8cff" }); onPatch({ hook: id }); }
        setCustomAsk(null);
      }} />}

      {/* description toggle (pinned bottom) */}
      {!isTrigger && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--line)" }}>
          <button onClick={onDelete} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--red)", font: "500 12.5px var(--sans)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="trash" cls="ic-sm" />Delete node</button>
        </div>
      )}
    </div>
  );
}

window.AutomationCanvas = AutomationCanvas;

// ---- clean in-app modal for naming a custom trigger / source ----
function CustomNameModal({ kind, onClose, onSave }) {
  const [v, setV] = useState("");
  const isTrig = kind === "trigger";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 330, background: "#04050599", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col gap-3" style={{ width: 380, background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 16, padding: 20, boxShadow: "0 30px 90px #000c" }}>
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name={isTrig ? "bolt" : "link"} cls="ic-sm" /></span>
          <span style={{ font: "600 14px var(--sans)" }}>{isTrig ? "Custom trigger event" : "Custom source / app"}</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--mute)", lineHeight: 1.45 }}>{isTrig ? "Name the event that should kick this off." : "Name the app or service to connect."}</span>
        <input autoFocus value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && v.trim()) onSave(v.trim()); }} placeholder={isTrig ? "e.g. Form submitted on Typeform" : "e.g. Airtable"} className="acv-input" />
        <div className="row gap-2" style={{ justifyContent: "flex-end" }}>
          <button onClick={onClose} className="btn">Cancel</button>
          <button onClick={() => v.trim() && onSave(v.trim())} disabled={!v.trim()} className="btn btn-primary" style={{ opacity: v.trim() ? 1 : 0.5 }}><Icon name="check" cls="ic-sm" />Add</button>
        </div>
      </div>
    </div>
  );
}
window.CustomNameModal = CustomNameModal;

// ---- per-trigger-type setup: each trigger gets its own real config + test ----
const TRIGGER_SETUP = {
  status: { title: "When a status changes to…", fields: [{ k: "to", label: "New status", type: "select", opts: ["Paid", "Onboarding", "Live", "Lost", "At risk"] }], captures: ["contact", "old status", "new status", "timestamp"], test: f => `Lead “Sarah O'Brien” status → ${f.to || "Paid"}` },
  lead: { title: "When a new lead comes in…", fields: [{ k: "src", label: "From source", type: "select", opts: ["Any source", "Facebook", "Google", "Website", "WhatsApp", "Referral"] }, { k: "minScore", label: "Min. lead score", type: "select", opts: ["Any", "50+", "70+", "90+"] }], captures: ["name", "phone", "email", "source", "score"], test: f => `New lead from ${f.src || "Facebook"} · score 84` },
  inbound: { title: "When a message arrives…", fields: [{ k: "channel", label: "Channel", type: "select", opts: ["Any", "WhatsApp", "SMS", "Instagram DM", "Facebook"] }, { k: "contains", label: "Only if it contains", type: "text", ph: "e.g. quote, price, booking" }], captures: ["sender", "message", "channel", "timestamp"], test: f => `WhatsApp: “how much for a quote?”` },
  missed: { title: "When a call is missed…", fields: [{ k: "line", label: "On line", type: "select", opts: ["Main line", "Sales line", "All lines"] }, { k: "after", label: "After", type: "select", opts: ["Any miss", "3 rings", "Out of hours only"] }], captures: ["caller number", "time", "line", "duration"], test: f => `Missed call from +353 87 555 1212` },
  review: { title: "When a review is posted…", fields: [{ k: "rating", label: "Rating", type: "select", opts: ["5★ only", "4★ and up", "Any rating", "3★ and below"] }, { k: "platform", label: "Platform", type: "select", opts: ["Google", "Facebook", "Any"] }], captures: ["reviewer", "rating", "text", "platform"], test: f => `${f.rating || "5★"} review on ${f.platform || "Google"}` },
  schedule: { title: "On a schedule…", fields: [{ k: "freq", label: "How often", type: "select", opts: ["Every hour", "Every day", "Every week", "Every month"] }, { k: "time", label: "At", type: "select", opts: ["08:00", "09:00", "12:00", "17:00", "20:00"] }], captures: ["run time", "period covered"], test: f => `Runs ${f.freq || "every day"} at ${f.time || "09:00"}` },
  metric: { title: "When a metric crosses a line…", fields: [{ k: "metric", label: "Metric", type: "select", opts: ["Account health", "ROAS", "Leads / week", "Missed calls", "MRR"] }, { k: "op", label: "Goes", type: "select", opts: ["below", "above"] }, { k: "val", label: "Value", type: "text", ph: "e.g. 65" }], captures: ["metric", "value", "client", "timestamp"], test: f => `${f.metric || "Account health"} ${f.op || "below"} ${f.val || "65"}` },
  webhook: { title: "When an external app calls in…", fields: [], webhook: true, captures: ["full JSON payload"], test: f => `POST received · 200 OK` }
};

function TriggerSetup({ n, onPatch, hookMeta }) {
  const [tested, setTested] = useState(null);
  const tt = (n.tType || "").indexOf("custom:") === 0 ? "custom" : n.tType;
  const cfg = TRIGGER_SETUP[tt];
  const cond = n.cond || {};
  function set(k, v) { onPatch({ cond: { ...cond, [k]: v } }); setTested(null); }

  if (!n.tType) return <div className="acv-help" style={{ padding: "20px 4px", textAlign: "center" }}>Pick an event on the <b style={{ color: "var(--ink-2)" }}>Event</b> tab first — then set it up here.</div>;
  if (!cfg) {
    // custom trigger
    return (
      <div className="col gap-3">
        <label className="acv-lbl">{(n.tType || "").slice(7) || "Custom event"} · setup</label>
        <span className="acv-help">Describe exactly when this custom event should fire and what it sends through.</span>
        <textarea value={n.template || ""} onChange={e => onPatch({ template: e.target.value })} rows={4} placeholder="e.g. When a Typeform 'Quote request' is submitted — sends name, email and the answers." className="acv-input" style={{ resize: "vertical", lineHeight: 1.5 }} />
      </div>
    );
  }
  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none", boxSizing: "border-box" };
  const webhookUrl = "https://hooks.bizboost.ie/t/" + (n.id || "trigger").replace(/[^a-z0-9]/gi, "");

  return (
    <div className="col gap-3">
      <label className="acv-lbl">{cfg.title}</label>
      {cfg.webhook ? (
        <div className="col gap-2">
          <span className="acv-help">Point any app (Zapier, Make, a form, your own code) at this URL. Every POST fires the automation with its payload.</span>
          <div className="row gap-2">
            <span className="mono" style={{ flex: 1, fontSize: 11, color: "var(--ink-2)", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{webhookUrl}</span>
            <button onClick={() => { try { navigator.clipboard.writeText(webhookUrl); } catch (e) {} }} className="btn" style={{ height: 36 }}><Icon name="copy" cls="ic-sm" /></button>
          </div>
        </div>
      ) : (
        cfg.fields.map(f => (
          <div key={f.k} className="col gap-2">
            <label className="acv-lbl" style={{ color: "var(--mute)" }}>{f.label}</label>
            {f.type === "select"
              ? <select value={cond[f.k] || f.opts[0]} onChange={e => set(f.k, e.target.value)} style={{ ...inp, cursor: "pointer" }}>{f.opts.map(o => <option key={o} value={o}>{o}</option>)}</select>
              : <input value={cond[f.k] || ""} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} style={inp} />}
          </div>
        ))
      )}

      <div className="acv-captures">
        <span className="acv-lbl" style={{ marginBottom: 4 }}>Data it sends to every following step</span>
        <div className="row gap-2" style={{ flexWrap: "wrap" }}>
          {cfg.captures.map(x => <span key={x} className="chip chip-dim" style={{ height: 22 }}>{x}</span>)}
        </div>
      </div>

      {/* test */}
      <button onClick={() => setTested(cfg.test(cond))} className="btn" style={{ height: 34, justifyContent: "center" }}><Icon name="play" cls="ic-sm" />Test this trigger</button>
      {tested && (
        <div className="acv-conn ok" style={{ alignItems: "flex-start" }}>
          <span style={{ color: "var(--lime)", flexShrink: 0, marginTop: 1 }}><Icon name="check" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span style={{ font: "600 12px var(--sans)", color: "#fff" }}>Caught a test event</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{tested}{hookMeta ? " · via " + hookMeta.name : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
}
window.TriggerSetup = TriggerSetup;

// ---- AI command bar: configure a whole node (trigger or action) from one sentence ----
function NodeAIBar({ n, isTrigger, onPatch, onConnect, setSec }) {
  const [v, setV] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const hookIds = NODE_HOOKS.map(h => h.id).join(", ");
  const trigIds = TRIGGER_TYPES_LIST.map(t => t.id).join(", ");

  async function go() {
    if (!v.trim() || busy) return;
    setBusy(true); setDone(null);
    const sys = isTrigger
      ? `You configure a trigger node in a BizBoost automation. The user describes when it should fire. Reply ONLY JSON: {"name":"short trigger name","tType":"one of: ${trigIds}","hook":"the app it watches, one of: ${hookIds} (or omit)","cond":{ "key":"value" matching the trigger type — e.g. status:{to}, lead:{src,minScore}, schedule:{freq,time}, metric:{metric,op,val}, review:{rating,platform}, inbound:{channel,contains}, missed:{line,after} },"template":"one-line plain description of exactly when it fires and what data it captures"}. For "every hour" use tType schedule, cond {"freq":"Every hour"}. No prose.`
      : `You configure an action node in a BizBoost automation. The user describes what it should do. Reply ONLY JSON: {"name":"short action name","hook":"the app that carries it out, one of: ${hookIds}","template":"the exact message/content/rule it runs","connect":true}. e.g. "send the quote to Telegram" → hook telegram. No prose.`;
    try {
      const r = await window.claude.complete(sys + "\n\nUser: " + v.trim() + "\n\nJSON:");
      const m = r.match(/\{[\s\S]*\}/); const o = m ? JSON.parse(m[0]) : null;
      if (o) {
        const patch = {};
        if (o.name) patch.name = o.name;
        if (o.tType) patch.tType = o.tType;
        if (o.hook && NODE_HOOKS.some(h => h.id === o.hook)) patch.hook = o.hook;
        if (o.cond) patch.cond = o.cond;
        if (o.template) patch.template = o.template;
        onPatch(patch);
        if (o.connect && patch.hook && onConnect) onConnect(patch.hook);
        setDone(o.name || "Configured");
        setV("");
        setSec(isTrigger ? "detail" : "action");
        setTimeout(() => setDone(null), 2600);
      }
    } catch (e) {}
    setBusy(false);
  }

  const examples = isTrigger
    ? ["every hour", "when a 5★ review lands on Google", "when account health drops below 65"]
    : ["pull new quotes from the database", "send it to my Telegram", "draft a weekly report from all the metrics"];

  return (
    <div className="nodeai">
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <span className="nodeai-orb"><Icon name="sparkle" cls="ic-sm" /></span>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} disabled={busy}
          placeholder={isTrigger ? "Describe when this should fire…" : "Describe what this step should do…"} className="nodeai-input" />
        <button onClick={go} disabled={!v.trim() || busy} className="nodeai-go" style={{ opacity: v.trim() && !busy ? 1 : 0.5 }}>
          {busy ? <span className="live-dot" style={{ background: "#0a0a0a" }}></span> : <Icon name="arrowR" cls="ic-sm" />}
        </button>
      </div>
      {done ? (
        <span className="row gap-2" style={{ fontSize: 11, color: "var(--lime)", marginTop: 7 }}><Icon name="check" cls="ic-sm" />Claude set it up — “{done}”. Review the tabs below.</span>
      ) : (
        <div className="row gap-2" style={{ marginTop: 7, flexWrap: "wrap" }}>
          {examples.map((ex, i) => <button key={i} onClick={() => { setV(ex); }} className="nodeai-ex">{ex}</button>)}
        </div>
      )}
    </div>
  );
}
window.NodeAIBar = NodeAIBar;

// ---- connect flow: walk through a real OAuth-style grant or API-key paste ----
function NodeConnectFlow({ hook, mode, onClose, onDone }) {
  const [stage, setStage] = useState(mode === "keys" ? "keys" : "consent"); // consent | authorizing | keys | done
  const [keys, setKeys] = useState("");
  useEffect(() => {
    if (stage === "authorizing") { const t = setTimeout(() => setStage("done"), 1500); return () => clearTimeout(t); }
    if (stage === "done") { const t = setTimeout(() => onDone(), 1100); return () => clearTimeout(t); }
  }, [stage]);
  if (!hook) return null;

  const scopes = {
    stripe: ["Read & create products, prices and payment links", "Read charges & payouts", "Receive webhooks for new payments"],
    meta: ["Manage ad campaigns & creatives", "Read leads from lead forms", "Reply to messages & comments"],
    wa: ["Send & receive messages", "Use message templates", "Read delivery status"],
    cal: ["Read your availability", "Create & update bookings", "Send invites"],
    google: ["Manage Google Ads campaigns", "Read conversions & spend"],
    slack: ["Post messages to channels", "Read channel list"],
    email: ["Send email on your behalf", "Read replies in the thread"]
  }[hook.id] || ["Read account data", "Create & update records on your behalf", "Receive webhooks"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 320, background: "#04050599", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 420, background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 16, boxShadow: "0 30px 90px #000c", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "15px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: hook.color + "22", color: hook.color, display: "grid", placeItems: "center" }}><Icon name={hook.icon} cls="ic-sm" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>Connect {hook.name}</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, border: "none", cursor: "pointer", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="x" cls="ic-sm" /></button>
        </div>

        {stage === "consent" && (
          <div className="col gap-4" style={{ padding: 18 }}>
            <div className="row gap-3" style={{ alignItems: "center", justifyContent: "center", padding: "6px 0" }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", font: "700 16px var(--sans)" }}>B</span>
              <Icon name="arrowR" cls="ic-sm" />
              <span style={{ width: 40, height: 40, borderRadius: 11, background: hook.color + "22", color: hook.color, display: "grid", placeItems: "center" }}><Icon name={hook.icon} /></span>
            </div>
            <span style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "center", lineHeight: 1.5 }}>BizBoost is asking to connect to your <b style={{ color: "#fff" }}>{hook.name}</b> account so it can run this step automatically.</span>
            <div className="col gap-2" style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
              <span className="eyebrow" style={{ margin: 0 }}>This will allow BizBoost to</span>
              {scopes.map((s, i) => <span key={i} className="row gap-2" style={{ fontSize: 12, color: "var(--ink-2)" }}><Icon name="check" cls="ic-sm" />{s}</span>)}
            </div>
            <button onClick={() => setStage("authorizing")} className="btn btn-primary" style={{ height: 40, justifyContent: "center" }}><Icon name="shield" cls="ic-sm" />Authorize {hook.name}</button>
            <span style={{ fontSize: 10.5, color: "var(--mute-2)", textAlign: "center" }}>Prototype — simulates the real OAuth grant. Revoke anytime.</span>
          </div>
        )}
        {stage === "authorizing" && (
          <div className="col gap-3" style={{ padding: "36px 18px", alignItems: "center" }}>
            <div style={{ width: 40, height: 40, border: "3px solid var(--line)", borderTopColor: hook.color, borderRadius: "50%", animation: "spin .8s linear infinite" }}></div>
            <span style={{ font: "600 13px var(--sans)" }}>Connecting to {hook.name}…</span>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
          </div>
        )}
        {stage === "keys" && (
          <div className="col gap-3" style={{ padding: 18 }}>
            <span style={{ fontSize: 12.5, color: "var(--mute)", lineHeight: 1.5 }}>Paste the API key / token from your {hook.name} dashboard. We store it encrypted.</span>
            <textarea value={keys} onChange={e => setKeys(e.target.value)} rows={3} placeholder={hook.id === "stripe" ? "sk_live_…" : "API key / token"} className="acv-input" style={{ fontFamily: "var(--mono)", resize: "vertical" }} />
            <button onClick={() => setStage("authorizing")} disabled={!keys.trim()} className="btn btn-primary" style={{ height: 38, justifyContent: "center", opacity: keys.trim() ? 1 : 0.5 }}><Icon name="check" cls="ic-sm" />Save & connect</button>
          </div>
        )}
        {stage === "done" && (
          <div className="col gap-2" style={{ padding: "32px 18px", alignItems: "center", textAlign: "center" }}>
            <span style={{ width: 48, height: 48, borderRadius: 14, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="check" cls="ic-lg" /></span>
            <span style={{ font: "600 15px var(--sans)" }}>{hook.name} connected</span>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>Claude can now act on this account for you.</span>
          </div>
        )}
      </div>
    </div>
  );
}
window.NodeConnectFlow = NodeConnectFlow;

// ---- Claude chat assistant inside the builder ----
function CanvasAI({ c, graph, onClose, offset, node, onNodePatch, onConnect }) {
  const stepCtx = node ? ` The user is focused on the "${node.name}" step${node.hook ? " (hooked to " + node.hook + ")" : ""}.` : "";
  const [msgs, setMsgs] = useState([{ role: "ai", text: node ? `I can help with the "${node.name}" step — how it should work, what to connect, or the message it sends. Just ask.` : `I'm Claude — I can help you design this automation. Ask me what to add, how to wire it up, or how to connect a tool. I can see your current graph (${graph.nodes.length} nodes).` }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef(null);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, busy]);

  const suggestions = node ? ["How should this step work?", "What message should it send?", "What do I need to connect?"] : ["What's a good next step here?", "How do I connect Stripe?", "Make this miss fewer leads", "Explain what this does"];

  function graphSummary() {
    const ns = graph.nodes.map(n => `${n.kind}:${n.name}${n.hook ? " [" + n.hook + "]" : ""}`).join(" → ");
    return ns;
  }
  async function send(q) {
    const text = (q != null ? q : input).trim();
    if (!text || busy) return;
    setMsgs(m => [...m, { role: "me", text }]); setInput(""); setBusy(true);
    const hookIds = NODE_HOOKS.map(h => h.id).join(", ");
    const canAct = node ? ` You can CONFIGURE the focused "${node.name}" node directly. When the user asks you to set it up / configure / connect / write the message, reply with one short sentence AND a fenced \`\`\`json block: {"set":{"name":"optional new name","hook":"one of: ${hookIds}","template":"the message or rule","tType":"trigger type id if it's a trigger"},"connect":true} — include only the keys you're changing. "connect":true means mark that integration connected.` : "";
    const sys = `You are Claude, an automation-building copilot inside BizBoost. You design AND configure node-based automations (n8n/Zapier style). Integrations (ids): ${hookIds}. The automation "${c.name}" currently is: ${graphSummary()}.${stepCtx}${canAct} Research how the real tool works and pick the right integration + a concrete message/template. Keep prose to 2-4 sentences, plain language, no markdown headers.`;
    try {
      const reply = await window.claude.complete(sys + "\n\nUser: " + text + "\n\nClaude:");
      const m = (reply || "").match(/```(?:json)?\s*([\s\S]*?)```/);
      let prose = (reply || "").replace(/```[\s\S]*?```/g, "").trim();
      let applied = null;
      if (m && node && onNodePatch) {
        try {
          const obj = JSON.parse(m[1]);
          if (obj.set) { onNodePatch(obj.set); applied = obj.set; }
          if (obj.connect && obj.set && obj.set.hook && onConnect) onConnect(obj.set.hook);
        } catch (e) {}
      }
      setMsgs(mm => [...mm, { role: "ai", text: prose || (applied ? "Done — I've set that up on the node." : "Let me think on that."), applied }]);
    } catch (e) {
      setMsgs(m => [...m, { role: "ai", text: "I can't reach the model right now — but tell me the trigger and the outcome you want and I'll map the nodes." }]);
    }
    setBusy(false);
  }

  return (
    <div className="acv-cfg" style={{ width: 360, right: offset ? 344 : 0, borderLeft: "1px solid var(--line-2)" }} onClick={e => e.stopPropagation()}>
      <div className="row between" style={{ padding: "15px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-2" style={{ alignItems: "center" }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="sparkle" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 0 }}><span style={{ font: "600 13px var(--sans)", color: "#fff" }}>Ask Claude</span><span style={{ fontSize: 10.5, color: "var(--mute)" }}>Build copilot · sees your graph</span></div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ width: 26, height: 26, border: "none", cursor: "pointer", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="x" cls="ic-sm" /></button>
      </div>
      <div className="portal-ai-msgs" ref={scroller} style={{ flex: 1 }}>
        {msgs.map((m, i) => (
          <div key={i} className={"portal-ai-msg " + m.role}>
            {m.role === "ai" && <span className="portal-ai-av" style={{ background: "#cfff3a22", color: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" /></span>}
            <div className="portal-ai-bubble" style={m.role === "me" ? { background: "var(--lime)", color: "#0a0a0a" } : {}}>{m.text}</div>
          </div>
        ))}
        {busy && <div className="portal-ai-msg ai"><span className="portal-ai-av" style={{ background: "#cfff3a22", color: "var(--lime)" }}><Icon name="sparkle" cls="ic-sm" /></span><div className="portal-ai-bubble"><span className="portal-ai-typing"><i></i><i></i><i></i></span></div></div>}
      </div>
      {msgs.length <= 1 && <div className="portal-ai-sugg">{suggestions.map((s, i) => <button key={i} onClick={() => send(s)} className="portal-ai-chip">{s}</button>)}</div>}
      <div className="portal-ai-input">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Ask Claude to help build…" />
        <button onClick={() => send()} disabled={!input.trim() || busy} style={{ background: "var(--lime)", opacity: input.trim() && !busy ? 1 : 0.5 }}><Icon name="arrowR" cls="ic-sm" /></button>
      </div>
    </div>
  );
}

window.CanvasAI = CanvasAI;

// ===== Build-with-Claude: describe → Claude asks questions → it builds the graph =====
function specToGraph(spec) {
  const okIcons = ["bolt", "sparkle", "msg", "checkSquare", "calendar", "megaphone", "bell", "shield", "clock", "inbox", "star", "phoneMissed", "trend", "euro", "layers", "link", "mail", "users", "doc"];
  const okHooks = NODE_HOOKS.map(h => h.id);
  const raw = (spec.nodes || []).slice(0, 12);
  const nodes = raw.map((n, i) => ({
    id: i === 0 ? "n_trigger" : "n" + i,
    kind: i === 0 ? "trigger" : (n.kind === "filter" ? "filter" : "action"),
    name: (n.name || "Step").slice(0, 40),
    icon: okIcons.includes(n.icon) ? n.icon : (i === 0 ? "bolt" : "sparkle"),
    desc: n.desc || "",
    hook: okHooks.includes(n.hook) ? n.hook : null,
    template: n.template || "",
    x: 60 + i * 270, y: 200 + (i % 2 ? 40 : 0)
  }));
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
  return { nodes, edges };
}

function extractJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  let body = fence ? fence[1] : null;
  if (!body) { const b = text.indexOf("{"), e = text.lastIndexOf("}"); if (b > -1 && e > b) body = text.slice(b, e + 1); }
  if (!body) return null;
  try { return JSON.parse(body); } catch (e) { return null; }
}

function BuildWithClaude({ store, client, clientName, onClose, onBuilt, onManual }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: (clientName ? `Building for ${clientName}. ` : "") + "Tell me what you want this automation to do — in your own words, as much detail as you like. The trigger, the outcome, who it's for. I'll ask a couple of quick questions, then build the whole thing for you." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const scroller = useRef(null);
  const history = useRef([]);
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; }, [msgs, busy, building]);

  const SYS = `You are Claude, an expert automation architect inside BizBoost (an AI agency command centre). The user describes an automation they want; you help design it as a node graph (n8n/Zapier style).

Available integrations (use these exact ids for "hook"): ${NODE_HOOKS.map(h => h.id).join(", ")}.
Available icons: bolt, sparkle, msg, checkSquare, calendar, megaphone, bell, shield, clock, inbox, star, phoneMissed, trend, euro, mail, users, doc.

Behaviour:
- If you DON'T yet have enough to build (trigger, the key steps, which tools), ask 1-3 SHORT, informative clarifying questions. Be specific and helpful — suggest sensible defaults. Keep it under 4 sentences. Do NOT output JSON yet.
- Once you have enough OR the user says go ahead / build it / your call, reply with ONE short confirming sentence, then a fenced \`\`\`json block with this exact shape:
{"name":"Short automation name","nodes":[{"name":"Trigger label","icon":"bolt"},{"name":"Step name","icon":"msg","hook":"wa","desc":"one line","template":"optional message"}],"edges":"linear"}
The FIRST node is always the trigger. 3-7 nodes total. Pick the right hook per step. Keep names tight.`;

  function pushHistory(role, text) { history.current.push(role.toUpperCase() + ": " + text); }

  async function send(forceBuild) {
    const text = forceBuild ? "Go ahead and build it now — your best judgement on anything unspecified." : input.trim();
    if (!text || busy || building) return;
    setMsgs(m => [...m, { role: "me", text: forceBuild ? "Build it now ✨" : text }]); setInput(""); setBusy(true);
    pushHistory("user", text);
    try {
      const reply = await window.claude.complete(SYS + "\n\nConversation so far:\n" + history.current.join("\n") + "\n\nClaude:");
      const spec = extractJSON(reply || "");
      const prose = (reply || "").replace(/```[\s\S]*?```/g, "").trim();
      if (spec && spec.nodes && spec.nodes.length) {
        setMsgs(m => [...m, { role: "ai", text: prose || "Here's what I'll build:" }]);
        pushHistory("claude", prose);
        buildIt(spec);
      } else {
        setMsgs(m => [...m, { role: "ai", text: prose || "Tell me a bit more and I'll map it out." }]);
        pushHistory("claude", prose);
      }
    } catch (e) {
      setMsgs(m => [...m, { role: "ai", text: "I couldn't reach the model. You can build it manually instead — or try again." }]);
    }
    setBusy(false);
  }

  function buildIt(spec) {
    setBuilding(true);
    const graph = specToGraph(spec);
    const steps = graph.nodes.slice(1).map(n => ({ icon: n.icon, name: n.name, desc: n.desc, hook: n.hook, template: n.template }));
    const created = store.create({
      name: spec.name || "New automation",
      trigger: graph.nodes[0] ? graph.nodes[0].name : "Trigger",
      action: steps.length ? steps[steps.length - 1].name : "Action",
      icon: "bolt", accent: "var(--lime)", steps, client: client || null
    });
    store.setGraph(created.id, graph);
    // dramatic beat, then open the canvas to watch it
    setTimeout(() => { onBuilt(created.id); }, 1500);
  }

  const sugg = ["When a lead comes in from Facebook, text them back instantly and book a call", "Every Monday, pull last week's numbers and send me a summary", "When a job's marked paid, ask the customer for a Google review"];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 240, background: "#04050588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 600, maxWidth: "94vw", height: "82vh", maxHeight: 680, background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000c", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="sparkle" cls="ic-sm" /></span>
            <div className="col" style={{ gap: 1 }}><span style={{ font: "600 15px var(--sans)" }}>Build with Claude</span><span style={{ fontSize: 11.5, color: "var(--mute)" }}>Describe it · Claude designs & builds it</span></div>
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
          {building && (
            <div className="acv-build-magic">
              <span className="acv-build-orb"><Icon name="bolt" /></span>
              <span style={{ font: "600 14px var(--sans)", color: "#fff" }}>Building your automation…</span>
              <span style={{ fontSize: 12, color: "var(--mute)" }}>Laying out nodes & wiring it up</span>
            </div>
          )}
        </div>

        {msgs.length <= 1 && !building && (
          <div className="portal-ai-sugg" style={{ background: "var(--bg-1)" }}>
            {sugg.map((s, i) => <button key={i} onClick={() => { setInput(s); }} className="portal-ai-chip">{s}</button>)}
          </div>
        )}

        <div className="portal-ai-input" style={{ background: "var(--elev)" }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(false)} placeholder="Describe the automation you want…" disabled={building} />
          <button onClick={() => send(false)} disabled={!input.trim() || busy || building} style={{ background: "var(--lime)", opacity: input.trim() && !busy && !building ? 1 : 0.5 }}><Icon name="arrowR" cls="ic-sm" /></button>
        </div>
        <div className="row between" style={{ padding: "9px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <button onClick={onManual} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", font: "500 11.5px var(--sans)" }}>Prefer to build it manually?</button>
          {msgs.length > 1 && !building && <button onClick={() => send(true)} className="btn btn-primary" style={{ height: 30 }}><Icon name="bolt" cls="ic-sm" />Build it now</button>}
        </div>
      </div>
    </div>
  );
}

window.BuildWithClaude = BuildWithClaude;
