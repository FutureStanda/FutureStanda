// Objective composer — create / edit an objective with dynamic key results.

function ObjectiveComposer({ open, onClose, initial, onSaved }) {
  const isEdit = initial && initial.id;
  const blank = () => ({ title: "", owner: "Bartek", current: "", target: "", keyResults: [{ kr: "", current: "", target: "", progress: 0 }], ...(initial || {}) });
  const [f, setF] = useState(blank);
  const titleRef = useRef(null);
  useEffect(() => { if (open) { setF(blank()); setTimeout(() => titleRef.current && titleRef.current.focus(), 30); } }, [open]);
  if (!open) return null;

  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const owners = ["Bartek", "Niamh", "Team"];
  const modes = [
    ["kr", "Key results", "Average of KR sliders"],
    ["tasks", "Linked tasks", "% of tasks completed"],
    ["manual", "Manual", "Set it yourself"]
  ];

  function setKR(i, key, val) {
    setF(s => {
      const krs = s.keyResults.map((k, idx) => idx === i ? { ...k, [key]: key === "progress" ? Math.max(0, Math.min(1, val)) : val } : k);
      return { ...s, keyResults: krs };
    });
  }
  function addKR() { setF(s => ({ ...s, keyResults: [...s.keyResults, { kr: "", current: "", target: "", progress: 0 }] })); }
  function removeKR(i) { setF(s => ({ ...s, keyResults: s.keyResults.filter((_, idx) => idx !== i) })); }

  const overall = (() => {
    const krs = (f.keyResults || []).filter(k => k.kr.trim());
    if (!krs.length) return 0;
    return krs.reduce((a, k) => a + (k.progress || 0), 0) / krs.length;
  })();

  function save() {
    if (!f.title.trim()) { titleRef.current && titleRef.current.focus(); return; }
    const clean = { ...f, keyResults: (f.keyResults || []).filter(k => k.kr.trim()).map(k => ({ kr: k.kr.trim(), current: k.current || "0", target: k.target || "—", progress: k.progress || 0 })) };
    if (isEdit) window.ObjectiveStore.patch(initial.id, clean);
    else window.ObjectiveStore.add(clean);
    onSaved && onSaved();
    onClose();
  }

  const lbl = { fontSize: 11, color: "var(--ink-2)", fontWeight: 500, marginBottom: 6, display: "block" };
  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none", boxSizing: "border-box" };
  const onF = e => e.target.style.borderColor = "#cfff3a66";
  const onB = e => e.target.style.borderColor = "var(--line)";
  const small = { ...inp, padding: "7px 9px", fontSize: 12 };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 130, background: "#04050588", backdropFilter: "blur(6px)", display: "grid", placeItems: "center" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{ width: 580, maxHeight: "90vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000b", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-2">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="target" cls="ic-sm" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>{isEdit ? "Edit objective" : "New objective"}</span>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" cls="ic-sm" /></button>
        </div>

        <div style={{ overflowY: "auto", padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={lbl}>Objective</span>
            <input ref={titleRef} value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Cross €100k MRR by end of Q3" onFocus={onF} onBlur={onB}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }} style={{ ...inp, font: "600 15px var(--sans)" }} />
          </div>

          <div className="row gap-3" style={{ marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <span style={lbl}>Owner</span>
              <select value={f.owner} onChange={e => set("owner", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                {owners.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ width: 120 }}>
              <span style={lbl}>Current</span>
              <input value={f.current} onChange={e => set("current", e.target.value)} placeholder="€72.4k" onFocus={onF} onBlur={onB} style={inp} />
            </div>
            <div style={{ width: 120 }}>
              <span style={lbl}>Target</span>
              <input value={f.target} onChange={e => set("target", e.target.value)} placeholder="€100k" onFocus={onF} onBlur={onB} style={inp} />
            </div>
          </div>

          {/* progress mode */}
          <div style={{ marginBottom: 18 }}>
            <span style={lbl}>Measure progress by</span>
            <div className="row gap-2">
              {modes.map(([v, l, sub]) => {
                const on = (f.progressMode || "kr") === v;
                return (
                  <button key={v} onClick={() => set("progressMode", v)} style={{
                    flex: 1, textAlign: "left", padding: "9px 11px", borderRadius: 10, cursor: "pointer",
                    background: on ? "#cfff3a12" : "var(--bg-2)", border: "1px solid " + (on ? "#cfff3a55" : "var(--line)")
                  }}>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <span style={{ width: 14, height: 14, borderRadius: 99, flexShrink: 0, border: "1.5px solid " + (on ? "var(--lime)" : "var(--line-3)"), display: "grid", placeItems: "center" }}>{on && <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--lime)" }}></span>}</span>
                      <span style={{ font: "600 12px var(--sans)", color: on ? "var(--ink)" : "var(--ink-2)" }}>{l}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--mute)", marginTop: 3, paddingLeft: 22 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
            {(f.progressMode || "kr") === "manual" && (
              <div className="row gap-2" style={{ alignItems: "center", marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "var(--bg-1)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Set progress</span>
                <input type="range" min="0" max="100" value={Math.round((f.progress || 0) * 100)} onChange={e => set("progress", e.target.value / 100)} style={{ flex: 1, accentColor: "var(--lime)" }} />
                <span className="num" style={{ width: 42, textAlign: "right", color: "var(--lime)", fontWeight: 700 }}>{Math.round((f.progress || 0) * 100)}%</span>
              </div>
            )}
          </div>

          {/* key results */}
          <div className="row between" style={{ marginBottom: 10 }}>
            <span className="eyebrow" style={{ margin: 0 }}>Key results</span>
            <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--mute)" }}>Overall <span className="num" style={{ color: "var(--lime)", fontWeight: 700 }}>{Math.round(overall * 100)}%</span></span>
          </div>
          <div className="col gap-2">
            {f.keyResults.map((k, i) => (
              <div key={i} className="col gap-2" style={{ padding: 11, borderRadius: 10, background: "var(--bg-1)", border: "1px solid var(--line)" }}>
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <input value={k.kr} onChange={e => setKR(i, "kr", e.target.value)} placeholder={"Key result " + (i + 1) + " — e.g. Sign 4 new Domination clients"} onFocus={onF} onBlur={onB} style={{ ...small, flex: 1 }} />
                  {f.keyResults.length > 1 && <button onClick={() => removeKR(i)} className="btn-ghost" style={{ width: 26, height: 26, border: "none", borderRadius: 7, cursor: "pointer", color: "var(--mute-2)", display: "grid", placeItems: "center", flexShrink: 0 }} title="Remove"><Icon name="trash" cls="ic-sm" /></button>}
                </div>
                <div className="row gap-2" style={{ alignItems: "center" }}>
                  <input value={k.current} onChange={e => setKR(i, "current", e.target.value)} placeholder="now (2)" onFocus={onF} onBlur={onB} style={{ ...small, width: 90 }} />
                  <span style={{ color: "var(--mute-2)", fontSize: 12 }}>/</span>
                  <input value={k.target} onChange={e => setKR(i, "target", e.target.value)} placeholder="goal (4)" onFocus={onF} onBlur={onB} style={{ ...small, width: 90 }} />
                  <div className="row gap-2" style={{ flex: 1, alignItems: "center", paddingLeft: 6 }}>
                    <input type="range" min="0" max="100" value={Math.round((k.progress || 0) * 100)} onChange={e => setKR(i, "progress", e.target.value / 100)} style={{ flex: 1, accentColor: "var(--lime)" }} />
                    <span className="num" style={{ width: 38, textAlign: "right", fontSize: 12, color: "var(--ink-2)" }}>{Math.round((k.progress || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addKR} className="btn btn-ghost" style={{ height: 30, marginTop: 10 }}><Icon name="plus" cls="ic-sm" />Add key result</button>
        </div>

        <div className="row between" style={{ padding: "13px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <span style={{ fontSize: 11, color: "var(--mute-2)" }}>⌘↵ to save</span>
          <div className="row gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={save} className="btn btn-primary"><Icon name="check" cls="ic-sm" />{isEdit ? "Save changes" : "Create objective"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ObjectiveComposer });
