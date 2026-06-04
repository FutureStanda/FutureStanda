// Overlays — Command palette (⌘K), Quick Add modal, AI assistant panel.

// ---------- Command Palette ----------
function CommandPalette({ open, onClose, go, onNewLead, onNewClient, onNewTask }) {
  const D = window.BIZBOOST_DATA;
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  const [sel, setSel] = useState(0);

  useEffect(() => {if (open) {setQ("");setSel(0);setTimeout(() => inputRef.current && inputRef.current.focus(), 30);}}, [open]);

  const nav = [
  { type: "Go to", label: "Briefing", icon: "home", action: () => go({ page: "briefing" }) },
  { type: "Go to", label: "Clients", icon: "users", action: () => go({ page: "clients" }) },
  { type: "Go to", label: "Leads", icon: "inbox", action: () => go({ page: "leads" }) },
  { type: "Go to", label: "Tasks", icon: "checkSquare", action: () => go({ page: "tasks" }) },
  { type: "Go to", label: "Marketing", icon: "megaphone", action: () => go({ page: "marketing" }) },
  { type: "Go to", label: "Objectives", icon: "target", action: () => go({ page: "objectives" }) },
  { type: "Go to", label: "Automations", icon: "refresh", action: () => go({ page: "automations" }) },
  { type: "Go to", label: "Agents", icon: "sparkle", action: () => go({ page: "agents" }) },
  { type: "Go to", label: "Resources", icon: "folder", action: () => go({ page: "resources" }) },
  { type: "Go to", label: "Pages", icon: "doc", action: () => go({ page: "docs" }) },
  { type: "Go to", label: "Integrations", icon: "plug", action: () => go({ page: "integrations" }) }];

  const actions = [
  { type: "Action", label: "New lead — capture & dispatch", icon: "inbox", action: onNewLead },
  { type: "Action", label: "Add new client", icon: "plus", action: onNewClient },
  { type: "Action", label: "Create task", icon: "checkSquare", action: onNewTask },
  { type: "Action", label: "Launch campaign", icon: "megaphone" },
  { type: "Action", label: "Ask Boost AI", icon: "sparkle" }];

  const clients = D.clients.map((c) => ({ type: "Client", label: c.name, sub: c.city + " · " + c.niche, color: c.color, action: () => go({ page: "client", id: c.id }) }));

  const all = [...nav, ...actions, ...clients];
  const ql = q.toLowerCase();
  const results = ql ? all.filter((i) => i.label.toLowerCase().includes(ql) || (i.sub || "").toLowerCase().includes(ql)) : all;

  useEffect(() => {setSel(0);}, [q]);

  function run(i) {if (i && i.action) i.action();onClose();}

  function onKey(e) {
    if (e.key === "ArrowDown") {e.preventDefault();setSel((s) => Math.min(s + 1, results.length - 1));} else
    if (e.key === "ArrowUp") {e.preventDefault();setSel((s) => Math.max(s - 1, 0));} else
    if (e.key === "Enter") {e.preventDefault();run(results[sel]);}
  }

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "#05060588", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", paddingTop: "12vh" }}>
      <div onClick={(e) => e.stopPropagation()} onKeyDown={onKey} style={{ width: 580, maxHeight: "62vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 16, boxShadow: "0 24px 80px #000a", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="row gap-3" style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <Icon name="search" cls="ic-lg" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients, pages, or run a command…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--ink)", font: "400 15px var(--sans)" }} />
          <span className="kbd">esc</span>
        </div>
        <div style={{ overflowY: "auto", padding: 8 }}>
          {results.length === 0 && <div style={{ padding: "24px", textAlign: "center", color: "var(--mute)", fontSize: 13 }}>No results for "{q}"</div>}
          {results.map((i, idx) =>
          <button key={idx} onClick={() => run(i)} onMouseEnter={() => setSel(idx)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", borderRadius: 10,
            border: "none", cursor: "pointer", textAlign: "left",
            background: idx === sel ? "var(--bg-active)" : "transparent", color: "var(--ink)"
          }}>
              {i.color ?
            <span style={{ width: 24, height: 24, borderRadius: 7, background: i.color, flexShrink: 0 }}></span> :
            <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: "var(--bg-2)", color: "var(--mute)", flexShrink: 0 }}><Icon name={i.icon} cls="ic-sm" /></span>}
              <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{i.label}</span>
                {i.sub && <span style={{ fontSize: 11, color: "var(--mute)" }}>{i.sub}</span>}
              </div>
              <span className="chip chip-dim" style={{ fontSize: 10 }}>{i.type}</span>
            </button>
          )}
        </div>
      </div>
    </div>);

}

// ---------- Quick Add ----------
function QuickAdd({ open, onClose, onNewLead, onNewClient, onNewTask, go }) {
  const nav = (page) => () => { onClose(); go && go({ page }); };
  const items = [
  { icon: "inbox", label: "Lead", desc: "Capture & dispatch research", color: "var(--lime)", action: onNewLead, primary: true },
  { icon: "users", label: "Client", desc: "Onboard a new business", color: "var(--teal)", action: onNewClient },
  { icon: "checkSquare", label: "Task", desc: "Add to your queue", color: "var(--teal)", action: onNewTask },
  { icon: "megaphone", label: "Campaign", desc: "Launch ads", color: "var(--violet)", action: nav("marketing") },
  { icon: "doc", label: "Page", desc: "New doc in master DB", color: "var(--blue)", action: nav("docs") },
  { icon: "folder", label: "Resource", desc: "Reusable asset", color: "var(--amber)", action: nav("resources") },
  { icon: "target", label: "Objective", desc: "Set a goal", color: "var(--red)", action: nav("objectives") }];

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "#05060588", backdropFilter: "blur(4px)", display: "grid", placeItems: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 24px 80px #000a", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ font: "600 15px var(--sans)" }}>Quick Add</span>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: 20 }}>
          {items.map((i) =>
          <button key={i.label} onClick={() => { if (i.action) i.action(); else onClose(); }} className="panel" style={{ padding: 16, textAlign: "left", cursor: "pointer", display: "flex", gap: 12, alignItems: "center", background: i.primary ? "#cfff3a10" : "var(--bg-1)", borderColor: i.primary ? "#cfff3a3a" : "var(--line)" }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = i.primary ? "#cfff3a66" : "var(--line-2)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = i.primary ? "#cfff3a3a" : "var(--line)"}>
              <span style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--bg-2)", color: i.color, border: "1px solid var(--line)", flexShrink: 0 }}><Icon name={i.icon} /></span>
              <div className="col" style={{ gap: 1 }}>
                <span style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: "15px", color: "#FFFFFF" }}>{i.label}</span>
                <span style={{ fontSize: 11, color: "var(--mute)" }}>{i.desc}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>);

}

// ---------- AI Panel ----------
const AI_SUGGESTIONS = [
"Which clients need my attention today?",
"Why did Greenway Fitness ROAS drop?",
"Summarise this week across all clients",
"Who's ready for an upsell?"];

const AI_REPLIES = {
  default: "I'm watching all 9 businesses in real time. Greenway Fitness is your priority — ROAS fell to 2.4x and 7 calls went missed this week. Kelly Detailing is your standout: +58% leads MoM. Want me to draft the Greenway retention plan?",
  "which clients need my attention today?": "Three need you today:\n\n• Greenway Fitness — ROAS 2.4x, retention call due\n• Kelly Detailing — 5 missed calls, chatbot misrouting\n• Boyne Joinery — still on Starter, upsell call Wed\n\nThe other six are healthy and running on autopilot.",
  "why did greenway fitness roas drop?": "Greenway's ROAS dropped from 4.1x to 2.4x over 14 days. Main drivers:\n\n• Ad frequency hit 4.8 — audience fatigue\n• Landing page conversion fell to 2.1%\n• 7 inbound calls missed, no booking\n\nI'd refresh creative, widen the audience, and check the missed-call text-back flow. Want me to queue those tasks?",
  "summarise this week across all clients": "Portfolio this week: 385 leads (+22%), €7.8k MRR, avg health 79.\n\nWins: O'Sullivan 7.2x ROAS, Riverside +32 reviews.\nRisks: Greenway at-risk, Kelly missed calls.\n\nNet: strong week, one fire to put out.",
  "who's ready for an upsell?": "Two strong upsell candidates:\n\n• Boyne Joinery — consistent demand on Starter, no ads running yet. Ideal Growth upgrade (+€698/mo).\n• Burke Landscaping — healthy on Growth, capacity for Domination content package.\n\nWant me to prep talking points from their numbers?"
};

function AIPanel({ open, onClose }) {
  const [msgs, setMsgs] = useState([{ role: "ai", text: AI_REPLIES.default }]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);
  useEffect(() => {if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;}, [msgs]);

  function send(text) {
    const t = (text || input).trim();
    if (!t) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: t }]);
    setTimeout(() => {
      const reply = AI_REPLIES[t.toLowerCase()] || AI_REPLIES.default;
      setMsgs((m) => [...m, { role: "ai", text: reply }]);
    }, 420);
  }

  if (!open) return null;
  return (
    <aside style={{ borderLeft: "1px solid var(--line)", background: "linear-gradient(180deg, #0d0f0d, #0a0b0a)", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <div className="row between" style={{ padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-2">
          <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="sparkle" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 0 }}>
            <span style={{ font: "600 13px var(--sans)" }}>Boost</span>
            <span className="row gap-2" style={{ fontSize: 10.5, color: "var(--mute)" }}><span className="live-dot" style={{ width: 5, height: 5 }}></span>watching 9 businesses</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {msgs.map((m, i) =>
        <div key={i} className="fadeup" style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
            {m.role === "ai" && <div className="row gap-2" style={{ marginBottom: 6, color: "var(--mute)", fontSize: 10.5 }}><Icon name="sparkle" cls="ic-sm" />Boost</div>}
            <div style={{
            padding: "11px 14px", borderRadius: 14, fontSize: 12.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
            background: m.role === "user" ? "var(--lime)" : "var(--bg-2)",
            color: m.role === "user" ? "#0a0a0a" : "var(--ink-2)",
            border: m.role === "user" ? "none" : "1px solid var(--line)",
            borderBottomRightRadius: m.role === "user" ? 4 : 14,
            borderBottomLeftRadius: m.role === "ai" ? 4 : 14,
            fontWeight: m.role === "user" ? 500 : 400
          }}>{m.text}</div>
          </div>
        )}
      </div>

      <div style={{ padding: 14, borderTop: "1px solid var(--line)" }}>
        <div className="col gap-2" style={{ marginBottom: 10 }}>
          {AI_SUGGESTIONS.map((s, i) =>
          <button key={i} onClick={() => send(s)} style={{
            textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer",
            background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)", font: "500 12px var(--sans)",
            transition: "border-color .12s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#cfff3a55"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--line)"}>{s}</button>
          )}
        </div>
        <div className="row gap-2" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 12, padding: "6px 6px 6px 12px" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter") send();}} placeholder="Ask about any business…" style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--ink)", font: "400 12.5px var(--sans)" }} />
          <button onClick={() => send()} className="btn btn-primary" style={{ width: 32, height: 32, padding: 0, justifyContent: "center" }}><Icon name="arrowR" cls="ic-sm" /></button>
        </div>
      </div>
    </aside>);

}

Object.assign(window, { CommandPalette, QuickAdd, AIPanel });