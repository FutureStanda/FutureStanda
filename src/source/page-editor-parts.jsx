// Notion-style page editor — block document, slash menu, inline toolbar, AI panel.

// ---------- styles (injected once) ----------
function injectPageStyles() {
  if (document.getElementById("pg-styles")) return;
  const s = document.createElement("style");
  s.id = "pg-styles";
  s.textContent = `
  .pg-wrap { --pg-ink:#F1F3EE; --pg-mute:#8E938A; --pg-bg:transparent; --pg-line:#232723;
    --pg-red:#FF6B5C; --pg-green:#4FE3C1; --pg-amber:#FFB547; --pg-co:#161916; --pg-cob:#2C312C;
    --pg-body: var(--sans); }
  .pg-wrap[data-theme="paper"] { --pg-ink:#2b2620; --pg-mute:#9a9384; --pg-bg:#fbf7ec; --pg-line:#e7dfc4;
    --pg-red:#c0392b; --pg-green:#2f8f5b; --pg-amber:#c8852a; --pg-co:#f6f1dd; --pg-cob:#e7dfc4;
    --pg-body: Georgia, 'Times New Roman', serif; }
  .pg-doc { color: var(--pg-ink); font-family: var(--pg-body); }
  .rt { outline:none; line-height:1.6; }
  .rt:empty:before { content: attr(data-ph); color: var(--pg-mute); opacity:.6; pointer-events:none; }
  .rt b, .rt strong { font-weight:700; }
  .pg-block { position:relative; }
  .pg-handle { position:absolute; left:-44px; top:2px; display:flex; gap:1px; opacity:0; transition:opacity .12s; }
  .pg-block:hover .pg-handle { opacity:1; }
  .pg-hbtn { width:20px; height:22px; border:none; background:transparent; cursor:pointer; color:var(--pg-mute); border-radius:5px; display:grid; place-items:center; }
  .pg-hbtn:hover { background:rgba(127,127,127,.16); color:var(--pg-ink); }
  .pg-co { background:var(--pg-co); border:1px solid var(--pg-cob); border-radius:10px; padding:13px 15px; display:flex; gap:11px; }
  .pg-co[data-c="green"] { border-left:3px solid var(--pg-green); }
  .pg-co[data-c="red"] { border-left:3px solid var(--pg-red); }
  .pg-co[data-c="amber"] { border-left:3px solid var(--pg-amber); }
  .pg-co[data-c="lime"] { border-left:3px solid #CFFF3A; }
  .pg-co[data-c="blue"] { border-left:3px solid #5BCEFA; }
  .pg-toolbar { position:fixed; z-index:200; display:flex; gap:1px; background:#1A1E1A; border:1px solid #2C312C; border-radius:9px; padding:4px; box-shadow:0 10px 30px #000a; }
  .pg-tb { width:28px; height:28px; border:none; background:transparent; color:#D4D7CE; cursor:pointer; border-radius:6px; font:600 13px var(--sans); display:grid; place-items:center; }
  .pg-tb:hover { background:#262A22; }
  .pg-sw { width:18px; height:18px; border-radius:5px; cursor:pointer; border:1px solid #3a3f36; }
  `;
  document.head.appendChild(s);
}

// ---------- contentEditable rich text (uncontrolled) ----------
function RichText({ html, onChange, onKeyDown, onFocusBlock, placeholder, style, className, elRef }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && ref.current.innerHTML !== (html || "")) ref.current.innerHTML = html || ""; }, []);
  return (
    <div ref={el => { ref.current = el; if (elRef) elRef(el); }} contentEditable suppressContentEditableWarning
      className={"rt " + (className || "")} data-ph={placeholder || ""} style={style}
      onInput={e => onChange(e.currentTarget.innerHTML)}
      onKeyDown={onKeyDown} onFocus={onFocusBlock} />
  );
}

// ---------- block type menu (slash + "+") ----------
const BLOCK_TYPES = [
  { type: "text", label: "Text", icon: "doc", hint: "Plain paragraph" },
  { type: "h1", label: "Heading 1", icon: "hash", hint: "Big section" },
  { type: "h2", label: "Heading 2", icon: "hash", hint: "Medium section" },
  { type: "h3", label: "Heading 3", icon: "hash", hint: "Small section" },
  { type: "bullet", label: "Bulleted list", icon: "list", hint: "• item" },
  { type: "numbered", label: "Numbered list", icon: "list", hint: "1. item" },
  { type: "todo", label: "To-do", icon: "checkSquare", hint: "Checkbox" },
  { type: "toggle", label: "Toggle", icon: "chevR", hint: "Collapsible" },
  { type: "callout", label: "Callout", icon: "bell", hint: "Highlighted box" },
  { type: "quote", label: "Quote", icon: "msg", hint: "Indented quote" },
  { type: "divider", label: "Divider", icon: "list", hint: "Horizontal line" },
  { type: "subpage", label: "Sub-page", icon: "doc", hint: "Page inside this page" },
  { type: "ai", label: "Ask AI to write…", icon: "sparkle", hint: "Generate with AI" }
];

function BlockMenu({ onPick, onClose, anchor }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const ref = useRef(null);
  useEffect(() => { setTimeout(() => ref.current && ref.current.focus(), 20); }, []);
  const items = BLOCK_TYPES.filter(t => t.label.toLowerCase().includes(q.toLowerCase()));
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }}></div>
      <div className="panel" style={{ position: "absolute", zIndex: 61, top: anchor || 28, left: 0, width: 260, padding: 6, background: "var(--elev)", border: "1px solid var(--line-2)", boxShadow: "0 16px 50px #000a", maxHeight: 320, overflow: "auto" }}>
        <input ref={ref} value={q} onChange={e => { setQ(e.target.value); setSel(0); }}
          onKeyDown={e => {
            if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
            else if (e.key === "Enter") { e.preventDefault(); items[sel] && onPick(items[sel].type); }
            else if (e.key === "Escape") onClose();
          }}
          placeholder="Filter blocks…" style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", font: "400 12.5px var(--sans)", padding: "8px 10px", outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
        {items.map((t, i) => (
          <button key={t.type} onMouseEnter={() => setSel(i)} onClick={() => onPick(t.type)} style={{
            display: "flex", gap: 10, alignItems: "center", width: "100%", padding: "7px 9px", borderRadius: 7, border: "none",
            background: i === sel ? "var(--bg-active)" : "transparent", cursor: "pointer", textAlign: "left"
          }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--bg-2)", color: t.type === "ai" ? "var(--lime)" : "var(--mute)", border: "1px solid var(--line)" }}><Icon name={t.icon} cls="ic-sm" /></span>
            <div className="col" style={{ gap: 0, minWidth: 0 }}>
              <span style={{ font: "600 12px var(--sans)", color: "var(--ink)" }}>{t.label}</span>
              <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{t.hint}</span>
            </div>
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}

// ---------- inline format toolbar ----------
function useInlineToolbar(wrapRef) {
  const [tb, setTb] = useState(null);
  useEffect(() => {
    function onUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setTb(null); return; }
      const node = sel.anchorNode;
      if (!node || !wrapRef.current || !wrapRef.current.contains(node.nodeType === 3 ? node.parentNode : node)) { setTb(null); return; }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      if (!r.width) { setTb(null); return; }
      setTb({ x: r.left + r.width / 2, y: r.top - 44 });
    }
    document.addEventListener("mouseup", onUp);
    document.addEventListener("keyup", onUp);
    return () => { document.removeEventListener("mouseup", onUp); document.removeEventListener("keyup", onUp); };
  }, []);
  return [tb, setTb];
}

function InlineToolbar({ tb, onCmd, onColor }) {
  if (!tb) return null;
  const colors = [["#CFFF3A", "lime"], ["#4FE3C1", "green"], ["#FF6B5C", "red"], ["#FFB547", "amber"]];
  return (
    <div className="pg-toolbar" style={{ left: Math.max(80, tb.x - 90), top: Math.max(8, tb.y) }} onMouseDown={e => e.preventDefault()}>
      <button className="pg-tb" onClick={() => onCmd("bold")} style={{ fontWeight: 800 }}>B</button>
      <button className="pg-tb" onClick={() => onCmd("italic")} style={{ fontStyle: "italic" }}>i</button>
      <button className="pg-tb" onClick={() => onCmd("strikeThrough")} style={{ textDecoration: "line-through" }}>S</button>
      <div style={{ width: 1, background: "#2C312C", margin: "0 3px" }}></div>
      <button className="pg-tb" onClick={() => onColor(null)} title="Default" style={{ color: "#8E938A" }}>A</button>
      {colors.map(([c]) => <button key={c} className="pg-tb" onClick={() => onColor(c)} style={{ padding: 0 }}><span className="pg-sw" style={{ background: c }}></span></button>)}
    </div>
  );
}

window.__PageEditorParts = { injectPageStyles, RichText, BlockMenu, useInlineToolbar, InlineToolbar, BLOCK_TYPES };
