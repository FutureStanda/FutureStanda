// PageView — the full Notion-style page. Uses window.__PageEditorParts.

// ---------- synced-block store ----------
function syncedStore() {
  if (!window.__bbSynced) {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("bb_synced") || "{}"); } catch (e) {}
    window.__bbSynced = Object.assign({}, window.BIZBOOST_PAGES.synced, saved);
  }
  return window.__bbSynced;
}
function saveSynced() { try { localStorage.setItem("bb_synced", JSON.stringify(window.__bbSynced)); } catch (e) {} }

// ---------- load / save a page doc ----------
function loadDoc(pageId, title) {
  try { const s = localStorage.getItem("bb_page_" + pageId); if (s) return JSON.parse(s); } catch (e) {}
  const P = window.BIZBOOST_PAGES;
  const base = P.pages[pageId] || P.starter(title);
  return JSON.parse(JSON.stringify(base));
}
function saveDoc(pageId, doc) { try { localStorage.setItem("bb_page_" + pageId, JSON.stringify(doc)); } catch (e) {} }

const CALLOUT_COLORS = [["plain", "—"], ["green", "Green"], ["amber", "Amber"], ["red", "Red"], ["lime", "Lime"], ["blue", "Blue"]];

function PageView({ pageId, go, back, openSub }) {
  const Parts = window.__PageEditorParts;
  const { RichText, BlockMenu, useInlineToolbar, InlineToolbar } = Parts;
  const D = window.BIZBOOST_DATA;
  const meta = D.pages.find(p => p.id === pageId) || { title: "Untitled", emoji: "📄" };

  const [doc, setDoc] = useState(() => loadDoc(pageId, meta.title));
  const [title, setTitle] = useState(() => { const d = loadDoc(pageId, meta.title); return d.title || meta.title; });
  const [focusId, setFocusId] = useState(null);
  const [menu, setMenu] = useState(null); // { index }
  const [aiOpen, setAiOpen] = useState(false);
  const [, bump] = useState(0);
  const wrapRef = useRef(null);
  const elMap = useRef({});
  const [tb, setTb] = useInlineToolbar(wrapRef);

  useEffect(() => { Parts.injectPageStyles(); }, []);
  useEffect(() => { const d = loadDoc(pageId, meta.title); setDoc(d); setTitle(d.title || meta.title); }, [pageId]);
  useEffect(() => { saveDoc(pageId, doc); }, [doc]);
  useEffect(() => { if (focusId && elMap.current[focusId]) { const el = elMap.current[focusId]; el.focus(); placeCaretEnd(el); setFocusId(null); } });

  function update(fn) { setDoc(d => { const nd = { ...d, blocks: fn(d.blocks.slice()) }; return nd; }); }
  function setBlock(id, patch) { update(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)); }
  function setHtml(id, html) { update(bs => bs.map(b => b.id === id ? { ...b, html } : b)); }

  function addAfter(index, type) {
    const P = window.BIZBOOST_PAGES;
    let nb;
    if (type === "divider") nb = { id: P.uid(), type: "divider" };
    else if (type === "callout") nb = { id: P.uid(), type: "callout", color: "plain", emoji: "💡", html: "" };
    else if (type === "toggle") nb = { id: P.uid(), type: "toggle", open: true, html: "", body: "" };
    else if (type === "todo") nb = { id: P.uid(), type: "todo", checked: false, html: "" };
    else if (type === "subpage") { const sid = "sub_" + P.uid(); createSubPage(sid); nb = { id: P.uid(), type: "subpage", pageId: sid, icon: "📄", title: "Untitled sub-page" }; }
    else nb = { id: P.uid(), type, html: "" };
    update(bs => { bs.splice(index + 1, 0, nb); return bs; });
    if (nb.type !== "divider" && nb.type !== "subpage") setFocusId(nb.id);
    return nb;
  }

  function createSubPage(sid) {
    if (!D.pages.find(p => p.id === sid)) D.pages.push({ id: sid, title: "Untitled sub-page", emoji: "📄", section: meta.section || "Sub-pages", updated: "just now", parent: pageId });
  }

  function removeBlock(id) {
    update(bs => {
      const i = bs.findIndex(b => b.id === id);
      if (i > 0) { const prev = bs[i - 1]; if (prev.html != null) setTimeout(() => setFocusId(prev.id), 0); }
      return bs.filter(b => b.id !== id);
    });
  }
  function changeType(id, type) {
    if (type === "ai") { setAiOpen(true); setMenu(null); return; }
    if (type === "divider") { update(bs => bs.map(b => b.id === id ? { id: b.id, type: "divider" } : b)); setMenu(null); return; }
    if (type === "subpage") { const P = window.BIZBOOST_PAGES; const sid = "sub_" + P.uid(); createSubPage(sid); update(bs => bs.map(b => b.id === id ? { id: b.id, type: "subpage", pageId: sid, icon: "📄", title: "Untitled sub-page" } : b)); setMenu(null); return; }
    update(bs => bs.map(b => b.id === id ? { ...b, type, color: type === "callout" ? (b.color || "plain") : b.color, emoji: type === "callout" ? (b.emoji || "💡") : b.emoji, open: type === "toggle" ? true : b.open, body: type === "toggle" ? (b.body || "") : b.body } : b));
    setMenu(null);
  }

  function onKey(e, b, index) {
    if (e.key === "Enter" && !e.shiftKey && b.type !== "toggle") {
      e.preventDefault();
      const t = (b.type === "bullet" || b.type === "numbered" || b.type === "todo") ? b.type : "text";
      addAfter(index, t);
    } else if (e.key === "Backspace") {
      const el = elMap.current[b.id];
      if (el && (el.innerHTML === "" || el.innerHTML === "<br>")) { e.preventDefault(); removeBlock(b.id); }
    } else if (e.key === "/" ) {
      const el = elMap.current[b.id];
      if (el && el.textContent === "") { e.preventDefault(); setMenu({ index, forId: b.id }); }
    }
  }

  function applyCmd(cmd) { document.execCommand(cmd, false); }
  function applyColor(c) {
    if (c) document.execCommand("foreColor", false, c);
    else document.execCommand("foreColor", false, getComputedStyle(wrapRef.current).getPropertyValue("--pg-ink") || "#F1F3EE");
    // persist: find focused block and save its html
    const sel = window.getSelection();
    let node = sel && sel.anchorNode; node = node && (node.nodeType === 3 ? node.parentNode : node);
    const blockEl = node && node.closest && node.closest("[data-bid]");
    if (blockEl) { const id = blockEl.getAttribute("data-bid"); const rt = blockEl.querySelector(".rt"); if (rt) setHtml(id, rt.innerHTML); }
  }

  const numIndex = {};
  let run = 0;
  doc.blocks.forEach((b, i) => { if (b.type === "numbered") { run += 1; numIndex[b.id] = run; } else run = 0; });

  const isPaper = doc.theme === "paper";

  return (
    <div className="pg-wrap" data-theme={doc.theme} ref={wrapRef} style={{ minHeight: "100%", background: isPaper ? "var(--pg-bg)" : "transparent", borderRadius: 16, margin: isPaper ? "-8px 0" : 0 }}>
      <InlineToolbar tb={tb} onCmd={applyCmd} onColor={applyColor} />

      <div className="pg-doc" style={{ maxWidth: aiOpen ? 720 : 820, margin: "0 auto", padding: isPaper ? "30px 56px 80px" : "8px 56px 80px", transition: "max-width .2s" }}>
        {/* breadcrumb / toolbar */}
        <div className="row between" style={{ marginBottom: 22 }}>
          <button onClick={back} className="btn btn-ghost" style={{ height: 28, paddingLeft: 6, color: "var(--pg-mute)" }}><Icon name="chevL" cls="ic-sm" />Pages</button>
          <div className="row gap-2">
            <button onClick={() => { const t = doc.theme === "paper" ? "dark" : "paper"; setDoc(d => ({ ...d, theme: t })); }} className="btn" style={{ height: 28, background: isPaper ? "#efe9d4" : "var(--bg-2)", color: isPaper ? "#2b2620" : "var(--ink)", borderColor: isPaper ? "#e0d8bd" : "var(--line)" }}>
              <Icon name={isPaper ? "eye" : "doc"} cls="ic-sm" />{isPaper ? "Paper" : "Dark"}
            </button>
            <button onClick={() => setAiOpen(o => !o)} className={aiOpen ? "btn btn-primary" : "btn"} style={{ height: 28 }}><Icon name="sparkle" cls="ic-sm" />AI</button>
          </div>
        </div>

        {/* icon + title */}
        <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 10 }}>{meta.emoji}</div>
        <input value={title} onChange={e => { setTitle(e.target.value); meta.title = e.target.value; setDoc(d => ({ ...d, title: e.target.value })); }} placeholder="Untitled"
          style={{ width: "100%", background: "none", border: "none", outline: "none", color: "var(--pg-ink)", font: "700 38px var(--pg-body)", letterSpacing: "-0.01em", marginBottom: 18, padding: 0 }} />

        {/* blocks */}
        <div className="col" style={{ gap: 3 }}>
          {doc.blocks.map((b, i) => (
            <BlockRow key={b.id} b={b} index={i} num={numIndex[b.id]} isPaper={isPaper}
              elRef={el => { if (el) elMap.current[b.id] = el; }}
              setHtml={setHtml} setBlock={setBlock} onKey={onKey} removeBlock={removeBlock}
              onPlus={() => setMenu({ index: i, forId: b.id })}
              onMenu={() => setMenu({ index: i, forId: b.id, transform: true })}
              openSub={openSub} bump={() => bump(x => x + 1)} RichText={RichText} setFocusId={setFocusId} addAfter={addAfter} />
          ))}
        </div>

        {/* add at end */}
        <button onClick={() => addAfter(doc.blocks.length - 1, "text")} className="row gap-2" style={{ marginTop: 12, padding: "8px 6px", background: "none", border: "none", cursor: "text", color: "var(--pg-mute)", font: "400 14px var(--pg-body)", width: "100%", textAlign: "left" }}>
          <Icon name="plus" cls="ic-sm" />Click to add, or press / for blocks
        </button>

        {menu && (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: -8 }}>
              <BlockMenu anchor={0} onClose={() => setMenu(null)} onPick={type => {
                if (menu.transform) changeType(menu.forId, type);
                else { if (type === "ai") { setAiOpen(true); } else { const el = elMap.current[menu.forId]; if (el && el.textContent === "" && !menu.transform) changeType(menu.forId, type); else addAfter(menu.index, type); } }
                setMenu(null);
              }} />
            </div>
          </div>
        )}
      </div>

      {aiOpen && <PageAI doc={doc} title={title} onClose={() => setAiOpen(false)} onInsert={(blocks) => update(bs => bs.concat(blocks))} />}
    </div>
  );
}

// ---------- one block ----------
function BlockRow({ b, index, num, isPaper, elRef, setHtml, setBlock, onKey, removeBlock, onPlus, onMenu, openSub, bump, RichText, setFocusId, addAfter }) {
  const D = window.BIZBOOST_DATA;
  const handle = (
    <div className="pg-handle">
      <button className="pg-hbtn" onClick={onPlus} title="Add block"><Icon name="plus" cls="ic-sm" /></button>
      <button className="pg-hbtn" onClick={onMenu} title="Turn into / delete"><Icon name="dots" cls="ic-sm" /></button>
    </div>
  );

  if (b.type === "divider") return (
    <div className="pg-block" data-bid={b.id} style={{ padding: "10px 0" }}>{handle}<div style={{ height: 1, background: "var(--pg-line)" }}></div></div>
  );

  if (b.type === "synced") {
    const store = syncedStore();
    const sb = store[b.syncId] || { html: "", color: "plain", emoji: "🔗" };
    return (
      <div className="pg-block" data-bid={b.id}>{handle}
        <div className="pg-co" data-c={sb.color} style={{ position: "relative", boxShadow: "inset 2px 0 0 #8B7CFF" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{sb.emoji}</span>
          <div style={{ flex: 1 }}>
            <RichText html={sb.html} placeholder="Synced block…" style={{ flex: 1, color: "var(--pg-ink)", fontSize: 14 }}
              onChange={html => { store[b.syncId] = { ...sb, html }; saveSynced(); bump(); }} elRef={elRef}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); } }} />
            <span className="row gap-2" style={{ marginTop: 6, fontSize: 9.5, color: "#8B7CFF" }}><Icon name="refresh" cls="ic-sm" />Synced · edits update everywhere</span>
          </div>
        </div>
      </div>
    );
  }

  if (b.type === "subpage") {
    const target = D.pages.find(p => p.id === b.pageId);
    return (
      <div className="pg-block" data-bid={b.id}>{handle}
        <button onClick={() => openSub(b.pageId)} style={{ display: "flex", gap: 10, alignItems: "center", width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid var(--pg-line)", background: "transparent", cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: 18 }}>{(target && target.emoji) || b.icon}</span>
          <span style={{ font: "600 14px var(--pg-body)", color: "var(--pg-ink)", textDecoration: "underline", textDecorationColor: "var(--pg-line)" }}>{(target && target.title) || b.title}</span>
          <Icon name="arrowUpR" cls="ic-sm" />
        </button>
      </div>
    );
  }

  if (b.type === "toggle") {
    return (
      <div className="pg-block" data-bid={b.id}>{handle}
        <div className="row gap-2" style={{ alignItems: "flex-start" }}>
          <button onClick={() => setBlock(b.id, { open: !b.open })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--pg-mute)", padding: "4px 0", marginTop: 2 }}>
            <span style={{ display: "inline-flex", transform: b.open ? "rotate(90deg)" : "none", transition: "transform .15s" }}><Icon name="chevR" cls="ic-sm" /></span>
          </button>
          <div style={{ flex: 1 }}>
            <RichText html={b.html} placeholder="Toggle title" style={{ fontWeight: 600, color: "var(--pg-ink)", fontSize: 15 }} elRef={elRef}
              onChange={h => setHtml(b.id, h)} onKeyDown={e => onKey(e, b, index)} />
            {b.open && (
              <div style={{ marginTop: 6, paddingLeft: 4, borderLeft: "2px solid var(--pg-line)", paddingLeft: 12 }}>
                <RichText html={b.body} placeholder="Empty toggle. Click to write." style={{ color: "var(--pg-ink)", opacity: .92, fontSize: 14 }}
                  onChange={h => setBlock(b.id, { body: h })} onKeyDown={e => { if (e.key === "Backspace") { const el = e.currentTarget; if (el.innerHTML === "" || el.innerHTML === "<br>") { /* keep */ } } }} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (b.type === "callout") {
    return (
      <div className="pg-block" data-bid={b.id}>{handle}
        <div className="pg-co" data-c={b.color}>
          <button onClick={() => {
            const order = ["💡", "🎯", "🚀", "📲", "💳", "🛡️", "🏆", "🎉", "📅", "👋", "🧱", "💭", "✍️"];
            const ni = (order.indexOf(b.emoji) + 1) % order.length; setBlock(b.id, { emoji: order[ni] });
          }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0, lineHeight: 1.5, padding: 0 }} title="Change icon">{b.emoji}</button>
          <div style={{ flex: 1 }}>
            <RichText html={b.html} placeholder="Callout…" style={{ color: "var(--pg-ink)", fontSize: 14 }} elRef={elRef}
              onChange={h => setHtml(b.id, h)} onKeyDown={e => onKey(e, b, index)} />
            <div className="row gap-2" style={{ marginTop: 8 }}>
              {CALLOUT_COLORS.map(([c, lbl]) => (
                <button key={c} onClick={() => setBlock(b.id, { color: c })} title={lbl} style={{ width: 14, height: 14, borderRadius: 4, cursor: "pointer", border: b.color === c ? "2px solid var(--pg-ink)" : "1px solid var(--pg-line)", background: c === "plain" ? "var(--pg-co)" : c === "lime" ? "#CFFF3A" : c === "blue" ? "#5BCEFA" : "var(--pg-" + c + ")" }}></button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // text-like
  const styleMap = {
    h1: { font: "700 30px var(--pg-body)", letterSpacing: "-0.01em", margin: "16px 0 2px" },
    h2: { font: "700 23px var(--pg-body)", letterSpacing: "-0.01em", margin: "14px 0 2px" },
    h3: { font: "700 18px var(--pg-body)", margin: "10px 0 2px" },
    text: { font: "400 15px var(--pg-body)", lineHeight: 1.65 },
    quote: { font: "400 15px var(--pg-body)", fontStyle: "italic", borderLeft: "3px solid var(--pg-line)", paddingLeft: 14, color: "var(--pg-ink)" }
  };
  const st = { color: "var(--pg-ink)", ...(styleMap[b.type] || styleMap.text) };

  if (b.type === "bullet" || b.type === "numbered" || b.type === "todo") {
    return (
      <div className="pg-block" data-bid={b.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>{handle}
        {b.type === "todo" ? (
          <button onClick={() => setBlock(b.id, { checked: !b.checked })} style={{ width: 17, height: 17, marginTop: 3, borderRadius: 5, flexShrink: 0, cursor: "pointer", border: "1.5px solid " + (b.checked ? "var(--pg-green)" : "var(--pg-mute)"), background: b.checked ? "var(--pg-green)" : "transparent", display: "grid", placeItems: "center", color: isPaper ? "#fff" : "#0a0a0a" }}>{b.checked && <Icon name="check" cls="ic-sm" />}</button>
        ) : b.type === "numbered" ? (
          <span style={{ minWidth: 18, textAlign: "right", color: "var(--pg-mute)", font: "400 15px var(--pg-body)", marginTop: 1, flexShrink: 0 }}>{num}.</span>
        ) : (
          <span style={{ color: "var(--pg-ink)", fontSize: 18, lineHeight: 1.2, marginTop: 1, flexShrink: 0 }}>•</span>
        )}
        <RichText html={b.html} placeholder="List item" style={{ flex: 1, ...st, textDecoration: b.checked ? "line-through" : "none", opacity: b.checked ? .55 : 1 }} elRef={elRef}
          onChange={h => setHtml(b.id, h)} onKeyDown={e => onKey(e, b, index)} />
      </div>
    );
  }

  return (
    <div className="pg-block" data-bid={b.id}>{handle}
      <RichText html={b.html} placeholder={b.type === "text" ? "Type, or press / for blocks" : (b.type[0] === "h" ? "Heading" : "Quote")} style={st} elRef={elRef}
        onChange={h => setHtml(b.id, h)} onKeyDown={e => onKey(e, b, index)} />
    </div>
  );
}

window.PageView = PageView;
