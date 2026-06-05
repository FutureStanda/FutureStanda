// Tasks — cross-portfolio work. List + kanban. TaskLine shared with client detail.

function PriorityDot({ p }) {
  const m = { P0: "var(--red)", P1: "var(--amber)", P2: "var(--mute)" };
  return <span title={p} style={{ width: 7, height: 7, borderRadius: 2, background: m[p], flexShrink: 0 }}></span>;
}

function TaskLine({ t, onToggle, onEdit, onDelete }) {
  const D = window.BIZBOOST_DATA;
  const c = t.client ? getClient(t.client) : null;
  const obj = t.objective ? (D.objectives || []).find(o => o.id === t.objective) : null;
  const done = t.status === "done";
  const [hover, setHover] = useState(false);
  const catColor = { Ads: "chip-violet", Content: "chip-teal", Account: "chip-amber", Sales: "chip-lime", Reputation: "chip-amber", Web: "chip-teal", Strategy: "chip-violet", Internal: "chip-dim" };
  const statusMap = { todo: ["var(--mute)", "To do"], doing: ["var(--amber)", "In progress"], done: ["var(--lime)", "Done"] };
  const [sc, sl] = statusMap[t.status] || statusMap.todo;
  return (
    <div className="row gap-3" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)", alignItems: "center", opacity: done ? 0.5 : 1, transition: "opacity .2s" }}>
      <button onClick={() => (onToggle ? onToggle() : window.TaskStore.toggle(t.id))} style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: "pointer",
        border: "1.5px solid " + (done ? "var(--lime)" : "var(--line-2)"),
        background: done ? "var(--lime)" : "transparent",
        display: "grid", placeItems: "center", color: "#0a0a0a"
      }}>{done && <Icon name="check" cls="ic-sm" />}</button>
      <PriorityDot p={t.priority} />
      <span onClick={() => onEdit && onEdit(t)} style={{ flex: 1, fontSize: 13, color: "var(--ink-2)", textDecoration: done ? "line-through" : "none", minWidth: 0, cursor: onEdit ? "pointer" : "default" }} className="truncate">{t.title}</span>
      {hover && onDelete && <button onClick={() => onDelete(t.id)} className="btn-ghost" style={{ width: 22, height: 22, border: "none", borderRadius: 6, cursor: "pointer", color: "var(--mute-2)", display: "grid", placeItems: "center", flexShrink: 0 }} title="Delete"><Icon name="trash" cls="ic-sm" /></button>}
      {hover && onEdit && <button onClick={() => onEdit(t)} className="btn-ghost" style={{ width: 22, height: 22, border: "none", borderRadius: 6, cursor: "pointer", color: "var(--mute-2)", display: "grid", placeItems: "center", flexShrink: 0 }} title="Edit"><Icon name="edit" cls="ic-sm" /></button>}
      {obj && <span className="chip chip-dim" title={obj.title} style={{ flexShrink: 0, maxWidth: 130 }}><Icon name="target" cls="ic-sm" /><span className="truncate">{obj.title.split(" ").slice(0, 3).join(" ")}…</span></span>}
      {c && <span className="row gap-2" style={{ flexShrink: 0 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }}></span><span style={{ fontSize: 11.5, color: "var(--mute)" }}>{c.name.split(" ")[0]}</span></span>}
      <span className="chip" style={{ flexShrink: 0, background: "transparent", borderColor: "var(--line)", color: sc }}><span style={{ width: 6, height: 6, borderRadius: 99, background: sc }}></span>{sl}</span>
      <span className={"chip " + (catColor[t.category] || "chip-dim")} style={{ flexShrink: 0 }}>{t.category}</span>
      <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 52, justifyContent: "center" }}>{t.due}</span>
    </div>
  );
}

function TaskListView({ list, setComposer, store }) {
  const [showDone, setShowDone] = useState(false);
  const active = list.filter(t => t.status !== "done");
  const done = list.filter(t => t.status === "done");
  return (
    <div className="col gap-2">
      {active.length ? active.map(t => <TaskLine key={t.id} t={t} onEdit={setComposer} onDelete={id => store.remove(id)} />)
        : <div className="panel" style={{ padding: 30, textAlign: "center", color: "var(--mute)" }}>Nothing active here. <button onClick={() => setComposer({})} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>Add one →</button></div>}

      {done.length > 0 && (
        <div className="col gap-2" style={{ marginTop: 10 }}>
          <button onClick={() => setShowDone(s => !s)} className="row gap-2" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mute)", font: "600 12px var(--sans)", padding: "4px 2px", width: "fit-content" }}>
            <span style={{ display: "inline-flex", transform: showDone ? "rotate(90deg)" : "none", transition: "transform .15s" }}><Icon name="chevR" cls="ic-sm" /></span>
            <Icon name="check" cls="ic-sm" />Completed · {done.length}
            <span className="chip chip-dim" style={{ fontSize: 9.5 }}>archived</span>
          </button>
          {showDone && <div className="col gap-2">{done.map(t => <TaskLine key={t.id} t={t} onEdit={setComposer} onDelete={id => store.remove(id)} />)}</div>}
        </div>
      )}
    </div>
  );
}

function Tasks({ go, onNewTask }) {
  const store = useTasks();
  const D = window.BIZBOOST_DATA;
  const [view, setView] = useState("workspace");
  const [filter, setFilter] = useState("All");
  const [composer, setComposer] = useState(null); // null | {} | task

  const allTasks = store.all();
  const cats = ["All", "P0", "Ads", "Account", "Content", "Sales"];
  let list = allTasks.filter(t => {
    if (filter === "All") return true;
    if (filter === "P0") return t.priority === "P0";
    return t.category === filter;
  });

  const cols = [
    { id: "todo", label: "To do", color: "var(--mute)" },
    { id: "doing", label: "In progress", color: "var(--amber)" },
    { id: "done", label: "Done", color: "var(--lime)" }
  ];

  const openCount = allTasks.filter(t => t.status !== "done").length;
  const p0 = allTasks.filter(t => t.priority === "P0" && t.status !== "done").length;

  return (
    <div className="col gap-4" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">{openCount} open · {p0} urgent</div>
          <div className="h-display" style={{ fontSize: 38 }}>Tasks</div>
        </div>
        <div className="row gap-2">
          <Segmented options={[{ value: "workspace", label: "Workspace" }, { value: "list", label: "List" }, { value: "board", label: "Board" }]} value={view} onChange={setView} />
          <button onClick={() => setComposer({})} className="btn btn-primary"><Icon name="plus" cls="ic-sm" />New task</button>
        </div>
      </div>

      {view !== "workspace" && (
      <div className="row gap-2">
        {cats.map(f => (
          <button key={f} onClick={() => setFilter(f)} className="chip" style={{
            height: 30, cursor: "pointer",
            background: filter === f ? "var(--lime)" : "var(--bg-2)",
            color: filter === f ? "#0a0a0a" : "var(--ink-2)",
            borderColor: filter === f ? "var(--lime)" : "var(--line)",
            fontWeight: filter === f ? 600 : 500
          }}>{f === "P0" && <span className="dot" style={{ color: filter === f ? "#0a0a0a" : "var(--red)" }}></span>}{f}</button>
        ))}
      </div>
      )}

      {view === "workspace" ? (
        <TasksWorkspace store={store} setComposer={setComposer} />
      ) : view === "list" ? (
        <TaskListView list={list} setComposer={setComposer} store={store} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "flex-start" }}>
          {cols.map(col => {
            const items = list.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="panel" style={{ padding: 14 }}>
                <div className="row between" style={{ marginBottom: 12 }}>
                  <span className="row gap-2" style={{ font: "600 12.5px var(--sans)" }}><span className="dot" style={{ color: col.color }}></span>{col.label}</span>
                  <span className="chip chip-dim">{items.length}</span>
                </div>
                <div className="col gap-2">
                  {items.map(t => {
                    const c = t.client ? getClient(t.client) : null;
                    const ci = cols.findIndex(x => x.id === col.id);
                    return (
                      <div key={t.id} className="col gap-2 task-card" style={{ padding: 12, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                        <div className="row gap-2" style={{ alignItems: "flex-start" }}>
                          <PriorityDot p={t.priority} />
                          <span onClick={() => setComposer(t)} style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4, flex: 1, cursor: "pointer" }}>{t.title}</span>
                        </div>
                        <div className="row between">
                          {c ? <span className="row gap-2"><span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }}></span><span style={{ fontSize: 11, color: "var(--mute)" }}>{c.name.split(" ")[0]}</span></span> : <span className="chip chip-dim">Internal</span>}
                          <div className="row gap-2" style={{ alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--mute-2)" }}>{t.due}</span>
                            <div className="row" style={{ gap: 2 }}>
                              {ci > 0 && <button onClick={() => store.move(t.id, cols[ci - 1].id)} className="mv-btn" title={"Move to " + cols[ci - 1].label}><Icon name="chevL" cls="ic-sm" /></button>}
                              {ci < cols.length - 1 && <button onClick={() => store.move(t.id, cols[ci + 1].id)} className="mv-btn" title={"Move to " + cols[ci + 1].label}><Icon name="chevR" cls="ic-sm" /></button>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={() => setComposer({ status: col.id })} className="row gap-2" style={{ width: "100%", justifyContent: "center", padding: "8px 0", background: "none", border: "1px dashed var(--line-2)", borderRadius: 9, cursor: "pointer", color: "var(--mute)", font: "500 11.5px var(--sans)" }}><Icon name="plus" cls="ic-sm" />Add</button>
                  {!items.length && <div style={{ fontSize: 12, color: "var(--mute-2)", textAlign: "center", padding: "8px 0" }}>Nothing here</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskComposer open={!!composer} initial={composer} onClose={() => setComposer(null)} />
    </div>
  );
}

Object.assign(window, { Tasks, TaskLine, PriorityDot });
