// Objective AI Coach — reads the objective's KRs, linked tasks & pace, gives analysis, chats.

function buildObjectiveContext(o) {
  const S = window.ObjectiveStore, T = window.TaskStore;
  const tp = S.taskProgress(o.id);
  const tasks = T ? T.forObjective(o.id) : [];
  const mode = o.progressMode || "kr";
  const prog = Math.round(S.liveProgress(o) * 100);
  const krLines = (o.keyResults || []).map(k => `- ${k.kr}: ${k.current}/${k.target} (${Math.round((k.progress || 0) * 100)}%)`).join("\n");
  const taskLines = tasks.map(t => `- [${t.status === "done" ? "x" : " "}] ${t.title} (${t.priority}, due ${t.due}${t.client ? ", " + t.client : ""})`).join("\n");
  return { tp, tasks, mode, prog, krLines, taskLines,
    text: `Objective: ${o.title}\nOwner: ${o.owner}\nProgress: ${prog}% (measured by ${mode})\nCurrent/Target: ${o.current || "—"} / ${o.target || "—"}\n\nKey results:\n${krLines || "none"}\n\nLinked tasks (${tp.done}/${tp.total} done):\n${taskLines || "none"}` };
}

// Deterministic, data-driven analysis (fallback + instant insights)
function localAnalysis(o, kind) {
  const { tp, tasks, mode, prog, krLines } = buildObjectiveContext(o);
  const open = tasks.filter(t => t.status !== "done");
  const urgent = open.filter(t => t.priority === "P0");
  const krs = o.keyResults || [];
  const laggingKR = krs.filter(k => (k.progress || 0) < 0.5);
  const doneKR = krs.filter(k => (k.progress || 0) >= 1);
  const L = [];

  if (kind === "assess") {
    L.push(`**${prog}% complete** — measured by ${mode === "tasks" ? "task completion" : mode === "manual" ? "manual estimate" : "key results"}.`);
    if (mode === "tasks") L.push(`You've closed **${tp.done} of ${tp.total}** linked tasks. ${tp.total === 0 ? "No tasks linked yet — link some to start tracking." : open.length ? `${open.length} still open${urgent.length ? `, ${urgent.length} of them urgent` : ""}.` : "Everything linked is done — time to mark this objective complete or add the next milestone."}`);
    else {
      if (doneKR.length) L.push(`✅ Landed: ${doneKR.map(k => k.kr).join("; ")}.`);
      if (laggingKR.length) L.push(`⚠️ Behind: ${laggingKR.map(k => `${k.kr} (${Math.round((k.progress || 0) * 100)}%)`).join("; ")}.`);
      if (tp.total) L.push(`Supporting work: ${tp.done}/${tp.total} linked tasks done.`);
    }
    const verdict = prog >= 80 ? "On the home straight — protect the momentum." : prog >= 50 ? "Solid progress, but the back half is where these stall. Keep the cadence." : prog >= 25 ? "Early — the next two weeks decide whether this lands on time." : "Barely started. Needs a forcing function this week.";
    L.push(`**Read:** ${verdict}`);
  }
  if (kind === "blockers") {
    if (urgent.length) L.push(`🔴 **${urgent.length} urgent task${urgent.length > 1 ? "s" : ""} open** — these are the bottleneck:\n${urgent.map(t => `   • ${t.title} (due ${t.due})`).join("\n")}`);
    if (laggingKR.length && mode !== "tasks") L.push(`📉 **Lagging key results:** ${laggingKR.map(k => k.kr).join("; ")}. Each needs at least one concrete task driving it.`);
    const krNoTask = mode !== "tasks" && laggingKR.length && tp.total === 0;
    if (krNoTask) L.push(`⛓️ The objective has lagging KRs but **zero linked tasks** — nothing is actually moving it. Add tasks.`);
    if (!urgent.length && !laggingKR.length) L.push(`No hard blockers detected. ${open.length ? `${open.length} task${open.length > 1 ? "s" : ""} in flight — keep them unblocked.` : "Pipeline's clear."}`);
  }
  if (kind === "next") {
    if (urgent.length) L.push(`1. Clear the urgent: **${urgent[0].title}** (due ${urgent[0].due}).`);
    const next = open.filter(t => t.priority !== "P0").slice(0, 2);
    next.forEach((t, i) => L.push(`${(urgent.length ? 2 : 1) + i}. ${t.title} — ${t.due}.`));
    if (mode !== "tasks" && laggingKR.length) L.push(`${L.length + 1}. Add a task to push **${laggingKR[0].kr}** off ${Math.round((laggingKR[0].progress || 0) * 100)}%.`);
    if (!open.length && tp.total > 0) L.push(`All linked tasks are done. Either close this objective or add the next milestone.`);
    if (!open.length && tp.total === 0) L.push(`Start by breaking this into 3–4 tasks and linking them here.`);
  }
  return L.join("\n\n");
}

function ObjectiveCoach({ objective: o, onClose, onEditTask, go }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const hasAI = typeof window !== "undefined" && window.claude && window.claude.complete;

  useEffect(() => { setMsgs([]); setInput(""); }, [o && o.id]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [msgs, busy]);
  if (!o) return null;

  const ctx = buildObjectiveContext(o);

  async function ask(text, localKind) {
    setMsgs(m => [...m, { role: "user", text }]);
    setBusy(true);
    let reply = "";
    if (hasAI) {
      try {
        reply = await window.claude.complete(
          `You are an elite operations coach for a marketing agency owner. Be sharp, specific and brief (under 140 words). Use the real data. Don't pad.\n\n${ctx.text}\n\nQuestion: ${text}`
        );
      } catch (e) { reply = ""; }
    }
    if (!reply) reply = localKind ? localAnalysis(o, localKind) : localAnalysis(o, "assess");
    setMsgs(m => [...m, { role: "ai", text: reply }]);
    setBusy(false);
  }

  const quick = [
    ["Assess progress", "How are we doing on this objective?", "assess"],
    ["What's blocking it?", "What's blocking this objective?", "blockers"],
    ["What should I do next?", "What should I do next to move this?", "next"]
  ];

  return (
    <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, maxWidth: "92vw", zIndex: 140, background: "var(--elev)", borderLeft: "1px solid var(--line-2)", boxShadow: "-20px 0 60px #0008", display: "flex", flexDirection: "column" }} className="slide-in-r">
      {/* header */}
      <div className="col gap-3" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
        <div className="row between">
          <div className="row gap-2">
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,var(--lime),#9ad400)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="sparkle" cls="ic-sm" /></span>
            <div className="col">
              <span style={{ font: "600 13.5px var(--sans)" }}>Objective Coach</span>
              <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{hasAI ? "Live AI" : "Analysing your data"}</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
        </div>
        {/* objective summary */}
        <div className="panel" style={{ padding: 12, background: "var(--bg-1)" }}>
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <Ring value={ctx.prog / 100} size={42} stroke={4} label={ctx.prog + "%"} />
            <div className="col" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ font: "600 12.5px var(--sans)" }}>{o.title}</span>
              <span style={{ fontSize: 11, color: "var(--mute)" }}>{ctx.tp.done}/{ctx.tp.total} tasks · by {ctx.mode === "tasks" ? "tasks" : ctx.mode === "manual" ? "manual" : "key results"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="col gap-3" style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        {msgs.length === 0 && (
          <div className="col gap-2" style={{ color: "var(--mute)", fontSize: 12.5, lineHeight: 1.5 }}>
            <span>Ask me anything about <b style={{ color: "var(--ink-2)" }}>{o.title}</b> — I can read its key results, linked tasks and pace.</span>
            <span style={{ color: "var(--mute-2)" }}>Try a quick analysis below, or type your own question.</span>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            <div style={{
              padding: "10px 13px", borderRadius: 13, fontSize: 12.5, lineHeight: 1.55, whiteSpace: "pre-wrap",
              background: m.role === "user" ? "var(--lime)" : "var(--bg-2)",
              color: m.role === "user" ? "#0a0a0a" : "var(--ink-2)",
              border: m.role === "user" ? "none" : "1px solid var(--line)",
              fontWeight: m.role === "user" ? 500 : 400
            }} dangerouslySetInnerHTML={{ __html: mdInline(m.text) }}></div>
          </div>
        ))}
        {busy && <div style={{ alignSelf: "flex-start" }}><div className="row gap-2" style={{ padding: "10px 13px", borderRadius: 13, background: "var(--bg-2)", border: "1px solid var(--line)" }}><span className="live-dot"></span><span style={{ fontSize: 12, color: "var(--mute)" }}>Thinking…</span></div></div>}
      </div>

      {/* quick chips */}
      <div className="row gap-2" style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
        {quick.map(([label, q, kind]) => (
          <button key={kind} onClick={() => !busy && ask(q, kind)} className="chip" style={{ cursor: busy ? "default" : "pointer", background: "var(--bg-2)", borderColor: "var(--line)", color: "var(--ink-2)", height: 28 }}>{label}</button>
        ))}
      </div>

      {/* input */}
      <div className="row gap-2" style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the coach…"
          onKeyDown={e => { if (e.key === "Enter" && input.trim() && !busy) { ask(input.trim()); setInput(""); } }}
          style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#cfff3a66"} onBlur={e => e.target.style.borderColor = "var(--line)"} />
        <button onClick={() => { if (input.trim() && !busy) { ask(input.trim()); setInput(""); } }} className="btn btn-primary" style={{ width: 38, height: 38, padding: 0, justifyContent: "center" }}><Icon name="arrowR" cls="ic-sm" /></button>
      </div>
    </div>
  );
}

// minimal inline markdown: **bold**, line breaks already handled by pre-wrap
function mdInline(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, '<b style="color:var(--ink)">$1</b>');
}

Object.assign(window, { ObjectiveCoach });
