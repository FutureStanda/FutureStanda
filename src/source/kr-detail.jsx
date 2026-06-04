// Key Result detail drawer — click a KR to measure it (manual / tasks / live KPI),
// link tasks, bind a business metric, and log checkpoints.

function KRDetail({ target, onClose, onEditTask }) {
  const store = useObjectives();
  useTasks(); // re-render when tasks change
  const M = window.BIZBOOST_KPIS;
  if (!target) return null;
  const o = store.get(target.objId);
  if (!o) return null;
  const idx = target.idx;
  const kr = (o.keyResults || [])[idx];
  if (!kr) return null;

  const measure = kr.measure || "manual";
  const disp = store.krDisplay(kr);
  const ratio = disp.ratio;

  const set = patch => store.patchKR(o.id, idx, patch);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "#04050577", backdropFilter: "blur(3px)" }}></div>
      <div className="slide-in-r col" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "94vw", background: "var(--elev)", borderLeft: "1px solid var(--line-2)", boxShadow: "-20px 0 60px #0009" }}>

        {/* header */}
        <div className="col gap-3" style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div className="row between">
            <span className="eyebrow" style={{ margin: 0 }}>Key result</span>
            <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
          </div>
          <textarea value={kr.kr} onChange={e => set({ kr: e.target.value })} rows={2}
            style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--ink)", font: "600 18px var(--sans)", letterSpacing: "-0.01em", lineHeight: 1.25 }} />
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <Ring value={ratio} size={46} stroke={5} label={Math.round(ratio * 100) + "%"} />
            <div className="col" style={{ gap: 2 }}>
              <span className="num" style={{ font: "600 15px var(--sans)" }}>{disp.cur} <span style={{ color: "var(--mute-2)", fontWeight: 400, fontSize: 13 }}>/ {disp.tgt}</span></span>
              <span className="row gap-2" style={{ fontSize: 11, color: "var(--mute)" }}>
                {disp.live && <span className="live-dot"></span>}
                {disp.live ? "Auto-tracked, live" : measure === "tasks" ? "Driven by linked tasks" : "Set manually"}
              </span>
            </div>
          </div>
        </div>

        <div className="col gap-4" style={{ flex: 1, overflowY: "auto", padding: 18 }}>

          {/* measure selector */}
          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>How is this measured?</span>
            <div className="row gap-2">
              {[["manual", "edit", "Manual"], ["tasks", "checkSquare", "Tasks"], ["metric", "pulse", "Live KPI"]].map(([v, ic, l]) => (
                <button key={v} onClick={() => set({ measure: v })} className="col gap-2" style={{
                  flex: 1, padding: "11px 8px", borderRadius: 11, cursor: "pointer", alignItems: "center",
                  background: measure === v ? "var(--lime)" : "var(--bg-2)",
                  border: "1px solid " + (measure === v ? "var(--lime)" : "var(--line)"),
                  color: measure === v ? "#0a0a0a" : "var(--ink-2)"
                }}>
                  <Icon name={ic} cls="ic-sm" /><span style={{ font: "600 12px var(--sans)" }}>{l}</span>
                </button>
              ))}
            </div>
          </div>

          {measure === "manual" && <KRManual kr={kr} set={set} />}
          {measure === "tasks" && <KRTasks o={o} idx={idx} kr={kr} store={store} onEditTask={onEditTask} />}
          {measure === "metric" && <KRMetric kr={kr} set={set} M={M} store={store} />}

          {/* checkpoints */}
          <KRCheckpoints o={o} idx={idx} kr={kr} store={store} disp={disp} />
        </div>

        {/* footer */}
        <div className="row between" style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <button onClick={() => { store.removeKR(o.id, idx); onClose(); }} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--red)", font: "500 12.5px var(--sans)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="trash" cls="ic-sm" />Delete key result</button>
          <button onClick={onClose} className="btn btn-primary" style={{ height: 32 }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ---- Manual measure ----
function KRManual({ kr, set }) {
  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "9px 11px", outline: "none", boxSizing: "border-box" };
  const pct = Math.round((kr.progress || 0) * 100);
  return (
    <div className="col gap-3">
      <div className="row gap-2">
        <div className="col gap-2 flex-1"><label style={lblS}>Current</label><input value={kr.current || ""} onChange={e => set({ current: e.target.value })} style={inp} placeholder="2" /></div>
        <div className="col gap-2 flex-1"><label style={lblS}>Target</label><input value={kr.target || ""} onChange={e => set({ target: e.target.value })} style={inp} placeholder="4" /></div>
      </div>
      <div className="col gap-2">
        <div className="row between"><label style={lblS}>Progress</label><span className="num" style={{ fontSize: 12, color: "var(--lime)", fontWeight: 600 }}>{pct}%</span></div>
        <input type="range" min="0" max="100" value={pct} onChange={e => set({ progress: +e.target.value / 100 })} className="kr-range" style={{ width: "100%" }} />
      </div>
    </div>
  );
}

// ---- Tasks measure ----
function KRTasks({ o, idx, kr, store, onEditTask }) {
  const T = window.TaskStore;
  const [picker, setPicker] = useState(false);
  const linkedIds = kr.taskIds || [];
  const all = T.all();
  const linked = all.filter(t => linkedIds.includes(t.id));
  const done = linked.filter(t => t.status === "done").length;
  // candidates: tasks linked to this objective but not yet to this KR, then everything else
  const objTasks = all.filter(t => t.objective === o.id && !linkedIds.includes(t.id));
  const others = all.filter(t => t.objective !== o.id && !linkedIds.includes(t.id));

  return (
    <div className="col gap-3">
      <div className="panel" style={{ padding: "10px 12px", background: "var(--bg-1)" }}>
        <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Progress = <b style={{ color: "var(--ink)" }}>{done}/{linked.length || 0}</b> linked tasks done. Tick tasks to attach them to this result.</span>
      </div>

      {linked.length > 0 && (
        <div className="col gap-2">
          {linked.map(t => <KRTaskRow key={t.id} t={t} linked onToggleLink={() => store.linkTaskToKR(o.id, idx, t.id)} onToggleDone={() => T.toggle(t.id)} onEdit={onEditTask} />)}
        </div>
      )}

      {!picker ? (
        <button onClick={() => setPicker(true)} className="btn" style={{ height: 32, justifyContent: "center" }}><Icon name="link" cls="ic-sm" />Link tasks</button>
      ) : (
        <div className="panel col gap-2" style={{ padding: 10, background: "var(--bg-1)" }}>
          <div className="row between"><span className="eyebrow" style={{ margin: 0 }}>Attach tasks</span><button onClick={() => setPicker(false)} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", fontSize: 11 }}>Done</button></div>
          <button onClick={() => { const t = T.add({ title: "New task", objective: o.id, client: o.client || null }); store.linkTaskToKR(o.id, idx, t.id); }} className="btn btn-ghost" style={{ height: 28, justifyContent: "flex-start" }}><Icon name="plus" cls="ic-sm" />Create & link a new task</button>
          {objTasks.length > 0 && <span style={{ fontSize: 10, color: "var(--mute-2)", marginTop: 4 }}>From this objective</span>}
          {objTasks.map(t => <KRTaskRow key={t.id} t={t} onToggleLink={() => store.linkTaskToKR(o.id, idx, t.id)} />)}
          {others.length > 0 && <span style={{ fontSize: 10, color: "var(--mute-2)", marginTop: 4 }}>Other tasks</span>}
          {others.slice(0, 8).map(t => <KRTaskRow key={t.id} t={t} onToggleLink={() => store.linkTaskToKR(o.id, idx, t.id)} />)}
        </div>
      )}
    </div>
  );
}

function KRTaskRow({ t, linked, onToggleLink, onToggleDone, onEdit }) {
  const c = t.client ? getClient(t.client) : null;
  const isDone = t.status === "done";
  return (
    <div className="row gap-2" style={{ padding: "7px 9px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line)", alignItems: "center" }}>
      {linked && onToggleDone && (
        <button onClick={onToggleDone} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, cursor: "pointer", border: "1.5px solid " + (isDone ? "var(--lime)" : "var(--line-2)"), background: isDone ? "var(--lime)" : "transparent", display: "grid", placeItems: "center", color: "#0a0a0a" }}>{isDone && <Icon name="check" cls="ic-sm" />}</button>
      )}
      <span className="truncate" style={{ flex: 1, fontSize: 12, color: "var(--ink-2)", textDecoration: isDone ? "line-through" : "none" }}>{t.title}</span>
      {c && <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color, flexShrink: 0 }}></span>}
      <button onClick={onToggleLink} className="btn-ghost" style={{ height: 22, padding: "0 7px", border: "1px solid " + (linked ? "var(--line-2)" : "var(--lime)"), borderRadius: 6, cursor: "pointer", color: linked ? "var(--mute)" : "var(--lime)", fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>{linked ? "Unlink" : "Link"}</button>
    </div>
  );
}

// ---- Metric measure ----
function KRMetric({ kr, set, M, store }) {
  const [picker, setPicker] = useState(!kr.metric);
  const metric = kr.metric ? M.get(kr.metric) : null;
  const live = metric ? metric.get() : 0;
  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--mono)", padding: "9px 11px", outline: "none", boxSizing: "border-box" };
  const groups = [...new Set(M.list.map(m => m.group))];

  return (
    <div className="col gap-3">
      {metric && !picker ? (
        <div className="panel" style={{ padding: 14, borderColor: "#cfff3a33", background: "#cfff3a0a" }}>
          <div className="row between">
            <div className="row gap-2"><Icon name={metric.icon} cls="ic-sm" /><span style={{ font: "600 13px var(--sans)" }}>{metric.label}</span></div>
            <button onClick={() => setPicker(true)} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", fontSize: 11 }}>Change</button>
          </div>
          <div className="row gap-3" style={{ marginTop: 10, alignItems: "baseline" }}>
            <span className="num" style={{ font: "700 26px var(--sans)", color: "var(--lime)" }}>{metric.format(live)}</span>
            <span className="row gap-2" style={{ fontSize: 11, color: "var(--mute)" }}><span className="live-dot"></span>live now</span>
          </div>
        </div>
      ) : (
        <div className="panel col gap-2" style={{ padding: 10, background: "var(--bg-1)", maxHeight: 230, overflowY: "auto" }}>
          <span className="eyebrow" style={{ margin: 0 }}>Bind to a business metric</span>
          {groups.map(g => (
            <div key={g} className="col gap-1">
              <span style={{ fontSize: 10, color: "var(--mute-2)", marginTop: 4 }}>{g}</span>
              {M.list.filter(m => m.group === g).map(m => (
                <button key={m.id} onClick={() => { set({ metric: m.id, startNum: kr.startNum != null ? kr.startNum : m.get() }); setPicker(false); }} className="row between" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + (kr.metric === m.id ? "var(--lime)" : "var(--line)"), background: kr.metric === m.id ? "#cfff3a12" : "var(--bg-2)", cursor: "pointer" }}>
                  <span className="row gap-2" style={{ color: "var(--ink-2)", fontSize: 12 }}><Icon name={m.icon} cls="ic-sm" />{m.label}</span>
                  <span className="num" style={{ fontSize: 12, color: "var(--mute)" }}>{m.format(m.get())}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {metric && !picker && (
        <div className="row gap-2">
          <div className="col gap-2 flex-1"><label style={lblS}>Baseline (start)</label><input value={kr.startNum != null ? kr.startNum : ""} onChange={e => set({ startNum: e.target.value })} style={inp} placeholder="0" inputMode="numeric" /></div>
          <div className="col gap-2 flex-1"><label style={lblS}>Target</label><input value={kr.targetNum != null ? kr.targetNum : ""} onChange={e => set({ targetNum: e.target.value })} style={inp} placeholder="100" inputMode="numeric" /></div>
        </div>
      )}
      {metric && !picker && (
        <span style={{ fontSize: 11, color: "var(--mute-2)", lineHeight: 1.4 }}>Progress fills from <b style={{ color: "var(--mute)" }}>{metric.format(+kr.startNum || 0)}</b> → <b style={{ color: "var(--mute)" }}>{metric.format(+kr.targetNum || 0)}</b> as <b style={{ color: "var(--mute)" }}>{metric.label}</b> moves. Updates by itself.</span>
      )}
    </div>
  );
}

// ---- Checkpoints / history ----
function KRCheckpoints({ o, idx, kr, store, disp }) {
  const [note, setNote] = useState("");
  const cps = kr.checkpoints || [];
  function add() {
    if (!note.trim()) return;
    store.addCheckpoint(o.id, idx, { value: disp.cur, note: note.trim() });
    setNote("");
  }
  return (
    <div className="col gap-2" style={{ borderTop: "1px solid var(--line)", paddingTop: 16 }}>
      <span className="eyebrow" style={{ margin: 0 }}>Checkpoints</span>
      <div className="row gap-2">
        <input value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Log an update or note…" style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 12.5px var(--sans)", padding: "9px 11px", outline: "none" }} />
        <button onClick={add} className="btn btn-ghost" style={{ height: 36, flexShrink: 0 }}><Icon name="plus" cls="ic-sm" /></button>
      </div>
      {cps.length > 0 && (
        <div className="col" style={{ position: "relative", marginTop: 4 }}>
          <div style={{ position: "absolute", left: 5, top: 8, bottom: 8, width: 1, background: "var(--line)" }}></div>
          {cps.map((cp, i) => (
            <div key={i} className="row gap-3" style={{ padding: "7px 0", position: "relative" }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: "var(--bg-3)", border: "2px solid var(--lime)", flexShrink: 0, marginTop: 2, zIndex: 1 }}></span>
              <div className="col" style={{ gap: 1, flex: 1 }}>
                <span style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.4 }}>{cp.note}</span>
                <span className="row gap-2" style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{cp.at}{cp.value && <React.Fragment>· <span className="num">{cp.value}</span></React.Fragment>}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const lblS = { fontSize: 11, color: "var(--ink-2)", fontWeight: 500 };

Object.assign(window, { KRDetail });
