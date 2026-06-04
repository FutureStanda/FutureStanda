// Pages — master database grid + Notion-style editor with nav stack for sub-pages.

function Docs({ go }) {
  const D = window.BIZBOOST_DATA;
  const [stack, setStack] = useState([]); // page ids; empty = grid

  if (stack.length) {
    const pageId = stack[stack.length - 1];
    return (
      <PageView key={pageId} pageId={pageId} go={go}
        back={() => setStack(s => s.slice(0, -1))}
        openSub={(id) => setStack(s => [...s, id])} />
    );
  }

  function newPage() {
    const id = "p_" + Math.random().toString(36).slice(2, 8);
    D.pages.unshift({ id, title: "Untitled", emoji: "📄", section: "Drafts", updated: "just now" });
    setStack([id]);
  }

  const visible = D.pages.filter(p => !p.parent);
  const sections = [...new Set(visible.map(p => p.section))];

  return (
    <div className="col gap-4" style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">Master database · {visible.length} pages</div>
          <div className="h-display" style={{ fontSize: 38 }}>Pages</div>
        </div>
        <button onClick={newPage} className="btn btn-primary"><Icon name="plus" cls="ic-sm" />New page</button>
      </div>

      {sections.map(sec => (
        <div key={sec} className="col gap-3">
          <div className="eyebrow">{sec}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {visible.filter(p => p.section === sec).map(p => (
              <button key={p.id} onClick={() => setStack([p.id])} className="panel" style={{ padding: 16, textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center", width: "100%" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line-2)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>
                <span style={{ fontSize: 22, width: 40, height: 40, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--bg-2)", border: "1px solid var(--line)" }}>{p.emoji}</span>
                <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                  <span className="truncate" style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "#FFFFFF" }}>{p.title}</span>
                  <span style={{ fontSize: 11.5, color: "var(--mute)" }}>Edited {p.updated}</span>
                </div>
                <Icon name="chevR" cls="ic-sm" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

window.Docs = Docs;
