// Resource store (persistent) + create modal + viewer/editor drawer.

(function () {
  const KEY = "bb_resources_v1";
  const listeners = new Set();
  function loadSaved() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  let saved = loadSaved();
  saved.created = saved.created || [];
  saved.patches = saved.patches || {};
  saved.deleted = saved.deleted || [];
  function persist() { localStorage.setItem(KEY, JSON.stringify(saved)); listeners.forEach(f => f()); }

  const Store = {
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    all() {
      const seed = (window.BIZBOOST_DATA.resources || []).filter(r => !saved.deleted.includes(r.id));
      const merged = [...saved.created, ...seed].map(r => saved.patches[r.id] ? { ...r, ...saved.patches[r.id] } : r);
      return merged;
    },
    get(id) { return this.all().find(r => r.id === id); },
    create(r) {
      const id = "res_" + Date.now().toString(36);
      const full = { id, updated: "just now", owner: "Bartek", body: "", ...r };
      saved.created.unshift(full); persist(); return full;
    },
    patch(id, p) {
      const isCreated = saved.created.some(r => r.id === id);
      if (isCreated) saved.created = saved.created.map(r => r.id === id ? { ...r, ...p, updated: "just now" } : r);
      else saved.patches[id] = { ...(saved.patches[id] || {}), ...p, updated: "just now" };
      persist();
    },
    remove(id) {
      if (saved.created.some(r => r.id === id)) saved.created = saved.created.filter(r => r.id !== id);
      else if (!saved.deleted.includes(id)) saved.deleted.push(id);
      delete saved.patches[id]; persist();
    }
  };
  function useResources() {
    const [, f] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => Store.subscribe(f), []);
    return Store;
  }
  window.ResourceStore = Store;
  window.useResources = useResources;
})();

const RES_TYPES = ["Script", "Creative", "SOP", "Sequence", "Doc", "Templates", "Deck", "Playbook", "Brand"];
const RES_TAGS = ["Sales", "Ads", "Ops", "Reputation", "Account", "Strategy", "Brand"];
const RES_TYPE_ICON = { Script: "doc", Creative: "layers", SOP: "checkSquare", Sequence: "mail", Doc: "doc", Templates: "copy", Deck: "grid", Playbook: "doc", Brand: "sparkle" };
const RES_TAG_COLOR = { Sales: "chip-lime", Ads: "chip-violet", Ops: "chip-teal", Reputation: "chip-amber", Account: "chip-blue", Strategy: "chip-violet", Brand: "chip-dim" };

// ---------- create / edit modal ----------
function ResourceModal({ open, initial, onClose, onSaved }) {
  const store = useResources();
  const editing = initial && initial.id;
  const [f, setF] = useState({ title: "", type: "Doc", tag: "Ops", body: "" });
  const ref = useRef(null);
  useEffect(() => {
    if (open) { setF({ title: "", type: "Doc", tag: "Ops", body: "", ...(initial || {}) }); setTimeout(() => ref.current && ref.current.focus(), 30); }
  }, [open]);
  if (!open) return null;
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const ready = f.title.trim();

  function save() {
    if (!ready) return;
    if (editing) { store.patch(initial.id, { title: f.title.trim(), type: f.type, tag: f.tag, body: f.body }); onSaved && onSaved(store.get(initial.id)); }
    else { const r = store.create({ title: f.title.trim(), type: f.type, tag: f.tag, body: f.body }); onSaved && onSaved(r); }
    onClose();
  }

  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10, color: "var(--ink)", font: "400 14px var(--sans)", padding: "11px 13px", outline: "none", boxSizing: "border-box" };
  const onF = e => e.target.style.borderColor = "#cfff3a66"; const onB = e => e.target.style.borderColor = "var(--line)";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 150, background: "#04050588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 580, maxHeight: "88vh", background: "var(--elev)", border: "1px solid var(--line-2)", borderRadius: 18, boxShadow: "0 30px 90px #000c", overflow: "hidden" }}>
        <div className="row between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)" }}>
          <div className="row gap-3"><span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name={RES_TYPE_ICON[f.type] || "doc"} cls="ic-sm" /></span><span style={{ font: "600 15px var(--sans)" }}>{editing ? "Edit resource" : "New resource"}</span></div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>
        </div>
        <div className="col gap-4" style={{ padding: 22, overflowY: "auto" }}>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>Title</label>
            <input ref={ref} value={f.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Discovery-call script v2" onFocus={onF} onBlur={onB} style={inp} />
          </div>
          <div className="row gap-3">
            <div className="col gap-2 flex-1">
              <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>Type</label>
              <select value={f.type} onChange={e => set("type", e.target.value)} onFocus={onF} onBlur={onB} style={{ ...inp, cursor: "pointer" }}>{RES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div className="col gap-2 flex-1">
              <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>Tag</label>
              <select value={f.tag} onChange={e => set("tag", e.target.value)} onFocus={onF} onBlur={onB} style={{ ...inp, cursor: "pointer" }}>{RES_TAGS.map(t => <option key={t} value={t}>{t}</option>)}</select>
            </div>
          </div>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>Content</label>
            <textarea value={f.body} onChange={e => set("body", e.target.value)} placeholder="Write the script, checklist, SOP, templates…" onFocus={onF} onBlur={onB} rows={9} style={{ ...inp, resize: "vertical", minHeight: 150, lineHeight: 1.55, fontFamily: "var(--sans)" }} />
          </div>
        </div>
        <div className="row between" style={{ padding: "13px 22px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <button onClick={onClose} className="btn">Cancel</button>
          <button onClick={save} disabled={!ready} className="btn btn-primary" style={{ opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}><Icon name="check" cls="ic-sm" />{editing ? "Save changes" : "Create resource"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- viewer drawer ----------
function ResourceViewer({ id, onClose, onEdit, onDelete }) {
  const store = useResources();
  const [copied, setCopied] = useState(false);
  if (!id) return null;
  const r = store.get(id);
  if (!r) return null;

  function copy() {
    try { navigator.clipboard.writeText(r.body || ""); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="adr-overlay" onClick={onClose}>
      <div className="adr-sheet slide-in-r" onClick={e => e.stopPropagation()} style={{ width: 540 }}>
        <div className="adr-head">
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--bg-2)", color: "var(--lime)", border: "1px solid var(--line-2)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={RES_TYPE_ICON[r.type] || "doc"} /></span>
            <div className="col" style={{ gap: 3, minWidth: 0 }}>
              <span className="adr-title" style={{ fontSize: 17 }}>{r.title}</span>
              <span className="row gap-2" style={{ flexWrap: "wrap" }}>
                <span className={"chip " + (RES_TAG_COLOR[r.tag] || "chip-dim")}>{r.tag}</span>
                <span className="adr-sub">{r.type} · {r.owner} · {r.updated}</span>
              </span>
            </div>
          </div>
          <button onClick={onClose} className="adr-close"><Icon name="x" /></button>
        </div>
        <div className="adr-body">
          {r.body ? (
            <div className="col gap-3">
              <div className="row between">
                <span className="adr-sec-t">Content</span>
                <button onClick={copy} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: copied ? "var(--lime)" : "var(--mute)", font: "600 11.5px var(--sans)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name={copied ? "check" : "copy"} cls="ic-sm" />{copied ? "Copied" : "Copy"}
                </button>
              </div>
              <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>{r.body}</div>
            </div>
          ) : (
            <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", padding: "40px 0" }}>
              <span style={{ width: 44, height: 44, borderRadius: 13, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--mute)", display: "grid", placeItems: "center" }}><Icon name="doc" /></span>
              <span style={{ fontSize: 13, color: "var(--mute)" }}>No content yet.</span>
              <button onClick={() => onEdit(r)} className="btn" style={{ height: 32, marginTop: 4 }}><Icon name="edit" cls="ic-sm" />Add content</button>
            </div>
          )}
        </div>
        <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
          <button onClick={() => { onDelete(r.id); onClose(); }} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--red)", font: "500 12.5px var(--sans)", display: "flex", alignItems: "center", gap: 6 }}><Icon name="trash" cls="ic-sm" />Delete</button>
          <button onClick={() => onEdit(r)} className="btn btn-primary" style={{ height: 32 }}><Icon name="edit" cls="ic-sm" />Edit</button>
        </div>
      </div>
    </div>
  );
}

window.ResourceModal = ResourceModal;
window.ResourceViewer = ResourceViewer;
window.RES_TYPE_ICON = RES_TYPE_ICON;
window.RES_TAG_COLOR = RES_TAG_COLOR;
