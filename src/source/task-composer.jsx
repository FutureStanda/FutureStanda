// Task composer — create / edit a task.

function TaskComposer({ open, onClose, initial, onSaved }) {
  const D = window.BIZBOOST_DATA;
  const isEdit = initial && initial.id;
  const [f, setF] = useState(() => ({
    title: "", client: null, priority: "P2", category: "Account", due: "Today", status: "todo", assignee: "Bartek", objective: null,
    ...(initial || {})
  }));
  const titleRef = useRef(null);
  useEffect(() => { if (open) { setF({ title: "", client: null, priority: "P2", category: "Account", due: "Today", status: "todo", assignee: "Bartek", objective: null, ...(initial || {}) }); setTimeout(() => titleRef.current && titleRef.current.focus(), 30); } }, [open]);
  if (!open) return null;

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const cats = ["Ads", "Content", "Account", "Sales", "Reputation", "Web", "Strategy", "Internal"];
  const dues = ["Today", "Tomorrow", "Mon", "Tue", "Wed", "Thu", "Fri", "Next week"];
  const assignees = ["Bartek", "Niamh", "Auto"];
  const statuses = [["todo", "To do", "var(--mute)"], ["doing", "In progress", "var(--amber)"], ["done", "Done", "var(--lime)"]];
  const objectives = D.objectives || [];

  function save() {
    if (!f.title.trim()) { titleRef.current && titleRef.current.focus(); return; }
    if (isEdit) window.TaskStore.patch(initial.id, f);
    else window.TaskStore.add(f);
    onSaved && onSaved();
    onClose();
  }

  const lbl = { fontSize: 11, color: "var(--ink-2)", fontWeight: 500, marginBottom: 6, display: "block" };
  const pill = (active) => ({ height: 30, cursor: "pointer", background: active ? "var(--lime)" : "var(--bg-2)", color: active ? "#0a0a0a" : "var(--ink-2)", borderColor: active ? "var(--lime)" : "var(--line)", fontWeight: active ? 600 : 500 });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "#04050588", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{ width: 520, maxHeight: "88vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000b", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-2">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="checkSquare" cls="ic-sm" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>{isEdit ? "Edit task" : "New task"}</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 20 }}>
          <input ref={titleRef} value={f.title} onChange={e => set("title", e.target.value)} onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }}
            placeholder="What needs doing?" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)", font: "500 15px var(--sans)", padding: "12px 14px", outline: "none", boxSizing: "border-box", marginBottom: 18 }}
            onFocus={e => e.target.style.borderColor = "#cfff3a66"} onBlur={e => e.target.style.borderColor = "var(--line)"} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <span style={lbl}>Client</span>
              <select value={f.client || ""} onChange={e => set("client", e.target.value || null)} style={selStyle()}>
                <option value="">Internal · no client</option>
                {D.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <span style={lbl}>Assignee</span>
              <select value={f.assignee} onChange={e => set("assignee", e.target.value)} style={selStyle()}>
                {assignees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={lbl}>Status</span>
            <div className="row gap-2">
              {statuses.map(([v, l, col]) => (
                <button key={v} onClick={() => set("status", v)} className="chip" style={pill(f.status === v)}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: f.status === v ? "#0a0a0a" : col }}></span>{l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={lbl}>Priority</span>
            <div className="row gap-2">
              {["P0", "P1", "P2"].map(p => (
                <button key={p} onClick={() => set("priority", p)} className="chip" style={pill(f.priority === p)}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: f.priority === p ? "#0a0a0a" : (p === "P0" ? "var(--red)" : p === "P1" ? "var(--amber)" : "var(--mute)") }}></span>
                  {p === "P0" ? "Urgent" : p === "P1" ? "High" : "Normal"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={lbl}>Link to objective <span style={{ color: "var(--mute-2)", fontWeight: 400 }}>· optional</span></span>
            <select value={f.objective || ""} onChange={e => set("objective", e.target.value || null)} style={selStyle()}>
              <option value="">No objective</option>
              {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={lbl}>Category</span>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {cats.map(c => <button key={c} onClick={() => set("category", c)} className="chip" style={pill(f.category === c)}>{c}</button>)}
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={lbl}>Due</span>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {dues.map(d => <button key={d} onClick={() => set("due", d)} className="chip" style={pill(f.due === d)}>{d}</button>)}
            </div>
          </div>
        </div>

        <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>⌘↵ to save</span>
          <div className="row gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={save} className="btn btn-primary"><Icon name="check" cls="ic-sm" />{isEdit ? "Save" : "Add task"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function selStyle() {
  return { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none", cursor: "pointer", colorScheme: "dark", boxSizing: "border-box" };
}

window.TaskComposer = TaskComposer;
