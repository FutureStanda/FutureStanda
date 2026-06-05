// Objectives — agency-level OKRs, now with linked tasks (relation to Tasks).

function Objectives({ go }) {
  const store = useObjectives();
  const taskStore = useTasks();
  const [compose, setCompose] = useState(null);   // task composer
  const [objCompose, setObjCompose] = useState(null); // objective composer
  const [coach, setCoach] = useState(null); // AI coach target objective
  const [krTarget, setKrTarget] = useState(null); // { objId, idx } for KR drawer
  const objectives = store.all();

  return (
    <div className="col gap-4" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 60 }}>
      <TaskComposer open={!!compose} initial={compose} onClose={() => setCompose(null)} />
      <ObjectiveComposer open={!!objCompose} initial={objCompose} onClose={() => setObjCompose(null)} />
      <ObjectiveCoach objective={coach} onClose={() => setCoach(null)} onEditTask={setCompose} go={go} />
      <KRDetail target={krTarget} onClose={() => setKrTarget(null)} onEditTask={setCompose} />
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">Q3 2026 · {objectives.length} objectives</div>
          <div className="h-display" style={{ fontSize: 38 }}>Objectives</div>
        </div>
        <button onClick={() => setObjCompose({})} className="btn btn-primary"><Icon name="plus" cls="ic-sm" />New objective</button>
      </div>

      {objectives.length === 0 && (
        <div className="panel" style={{ padding: 40, textAlign: "center", color: "var(--mute)" }}>
          No objectives yet. <button onClick={() => setObjCompose({})} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>Set your first one →</button>
        </div>
      )}

      <div className="col gap-3">
        {objectives.map((o, idx) => {
          const linked = taskStore.forObjective(o.id);
          const doneCount = linked.filter(t => t.status === "done").length;
          const mode = o.progressMode || "kr";
          const prog = store.liveProgress(o);
          const modeMeta = { kr: ["target", "Key results"], tasks: ["checkSquare", "Tasks"], manual: ["edit", "Manual"] }[mode];
          return (
            <div key={o.id} className="panel fadeup" style={{ padding: 20, animationDelay: (idx * 0.05) + "s" }}>
              <div className="row between" style={{ marginBottom: 16, alignItems: "flex-start" }}>
                <div className="row gap-3" style={{ minWidth: 0 }}>
                  <Ring value={prog} size={52} stroke={5} label={Math.round(prog * 100) + "%"} />
                  <div className="col" style={{ gap: 4 }}>
                    <span style={{ font: "600 16px var(--sans)", letterSpacing: "-0.01em" }}>{o.title}</span>
                    <div className="row gap-2" style={{ color: "var(--mute)", fontSize: 12, flexWrap: "wrap" }}>
                      <span className="row gap-2"><span className="avatar avatar-sm">{(o.owner || "B")[0]}</span>{o.owner}</span>
                      {(o.current || o.target) && <React.Fragment><span>·</span><span className="num">{o.current || "—"} / {o.target || "—"}</span></React.Fragment>}
                      <span>·</span>
                      <span className="row gap-2" title={"Progress measured by " + modeMeta[1]}><Icon name={modeMeta[0]} cls="ic-sm" />{mode === "tasks" ? doneCount + "/" + linked.length + " tasks done" : modeMeta[1]}</span>
                    </div>
                  </div>
                </div>
                <div className="row gap-2" style={{ flexShrink: 0 }}>
                  <button onClick={() => setCoach(o)} className="btn btn-ghost" style={{ height: 30 }}><Icon name="sparkle" cls="ic-sm" />Coach</button>
                  <ObjMenu onEdit={() => setObjCompose(o)} onDelete={() => store.remove(o.id)} />
                </div>
              </div>

              {/* key results */}
              <div className="col gap-2" style={{ paddingLeft: 4 }}>
                <div className="row between" style={{ marginBottom: 2 }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Key results</span>
                  <button onClick={() => store.addKR(o.id, {})} className="btn btn-ghost" style={{ height: 24, fontSize: 11 }}><Icon name="plus" cls="ic-sm" />Add key result</button>
                </div>
                {(o.keyResults || []).map((kr, i) => {
                  const d = store.krDisplay(kr);
                  const m = kr.measure || "manual";
                  const mMeta = { manual: ["edit", "Manual", "var(--mute)"], tasks: ["checkSquare", "Tasks", "var(--teal)"], metric: ["pulse", "Live", "var(--lime)"] }[m];
                  return (
                    <button key={i} onClick={() => setKrTarget({ objId: o.id, idx: i })} className="kr-row col gap-2" style={{
                      width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 11,
                      background: "var(--bg-2)", border: "1px solid var(--line)", cursor: "pointer"
                    }}>
                      <div className="row between" style={{ fontSize: 12.5, gap: 10 }}>
                        <span className="row gap-2" style={{ color: "var(--ink-2)", minWidth: 0 }}>
                          <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: "1px solid " + (d.ratio >= 1 ? "var(--lime)" : "var(--line-2)"), background: d.ratio >= 1 ? "var(--lime)" : "transparent", display: "grid", placeItems: "center", color: "#0a0a0a" }}>
                            {d.ratio >= 1 && <Icon name="check" cls="ic-sm" />}
                          </span>
                          <span className="truncate">{kr.kr}</span>
                        </span>
                        <span className="row gap-2" style={{ flexShrink: 0 }}>
                          <span className="chip" style={{ background: "transparent", borderColor: "var(--line)", color: mMeta[2], height: 20, fontSize: 9.5 }}>
                            {d.live && <span className="live-dot" style={{ width: 5, height: 5 }}></span>}<Icon name={mMeta[0]} cls="ic-sm" />{mMeta[1]}
                          </span>
                          <span className="num" style={{ color: "var(--mute)", fontWeight: 600 }}>{d.cur} <span style={{ color: "var(--mute-2)", fontWeight: 400 }}>/ {d.tgt}</span></span>
                          <Icon name="chevR" cls="ic-sm" />
                        </span>
                      </div>
                      <div className="prog" style={{ marginLeft: 24 }}><i style={{ width: (d.ratio * 100) + "%", background: d.ratio >= 1 ? "var(--lime)" : mMeta[2] }}></i></div>
                    </button>
                  );
                })}
                {(o.keyResults || []).length === 0 && <span style={{ fontSize: 12, color: "var(--mute-2)", padding: "4px 0" }}>No key results yet — add one to measure this objective.</span>}
              </div>

              {/* linked tasks relation */}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                <div className="row between" style={{ marginBottom: linked.length ? 10 : 0 }}>
                  <span className="eyebrow" style={{ margin: 0 }}>Linked tasks</span>
                  <button onClick={() => setCompose({ objective: o.id })} className="btn btn-ghost" style={{ height: 26, fontSize: 11.5 }}><Icon name="plus" cls="ic-sm" />Add task</button>
                </div>
                {linked.length ? (
                  <div className="col gap-2">
                    {linked.map(t => <ObjectiveTaskRow key={t.id} t={t} store={taskStore} onEdit={setCompose} go={go} />)}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--mute-2)", padding: "6px 0" }}>No tasks linked yet — add one to drive this objective forward.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ObjectiveTaskRow({ t, store, onEdit, go }) {
  const c = t.client ? getClient(t.client) : null;
  const done = t.status === "done";
  const statusMap = { todo: ["var(--mute)", "To do"], doing: ["var(--amber)", "In progress"], done: ["var(--lime)", "Done"] };
  const [sc, sl] = statusMap[t.status] || statusMap.todo;
  return (
    <div className="row gap-3" style={{ padding: "8px 11px", borderRadius: 9, background: "var(--bg-2)", border: "1px solid var(--line)", alignItems: "center", opacity: done ? 0.55 : 1 }}>
      <button onClick={() => store.toggle(t.id)} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: "1.5px solid " + (done ? "var(--lime)" : "var(--line-2)"), background: done ? "var(--lime)" : "transparent", display: "grid", placeItems: "center", color: "#0a0a0a" }}>{done && <Icon name="check" cls="ic-sm" />}</button>
      <span onClick={() => onEdit(t)} className="truncate" style={{ flex: 1, fontSize: 12.5, color: "var(--ink-2)", textDecoration: done ? "line-through" : "none", cursor: "pointer" }}>{t.title}</span>
      {c && <span className="row gap-2" style={{ flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }}></span><span style={{ fontSize: 11, color: "var(--mute)" }}>{c.name.split(" ")[0]}</span></span>}
      <span className="chip" style={{ flexShrink: 0, background: "transparent", borderColor: "var(--line)", color: sc }}><span style={{ width: 6, height: 6, borderRadius: 99, background: sc }}></span>{sl}</span>
      <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 50, justifyContent: "center" }}>{t.due}</span>
    </div>
  );
}

function ObjMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="dots" cls="ic-sm" /></button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }}></div>
          <div className="panel" style={{ position: "absolute", top: 34, right: 0, zIndex: 31, width: 150, padding: 5, background: "var(--elev)", border: "1px solid var(--line-2)", boxShadow: "0 16px 50px #000a" }}>
            <button onClick={() => { setOpen(false); onEdit(); }} className="menu-row" style={menuRow}><Icon name="edit" cls="ic-sm" />Edit objective</button>
            <button onClick={() => { setOpen(false); onDelete(); }} className="menu-row" style={{ ...menuRow, color: "var(--red)" }}><Icon name="trash" cls="ic-sm" />Delete</button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}
const menuRow = { display: "flex", gap: 9, alignItems: "center", width: "100%", padding: "8px 9px", borderRadius: 7, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", color: "var(--ink-2)", font: "500 12.5px var(--sans)" };

window.Objectives = Objectives;
