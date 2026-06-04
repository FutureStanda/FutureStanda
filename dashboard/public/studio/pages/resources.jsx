// Resources — master database of reusable assets (the Notion replacement).

function Resources({ go }) {
  const store = useResources();
  const all = store.all();
  const [tag, setTag] = useState("All");
  const [view, setView] = useState(null);     // resource id being viewed
  const [edit, setEdit] = useState(null);      // {} new, or resource for edit
  const tags = ["All", ...new Set(all.map(r => r.tag))];
  const list = all.filter(r => tag === "All" || r.tag === tag);

  const typeIcon = window.RES_TYPE_ICON;
  const tagColor = window.RES_TAG_COLOR;

  return (
    <div className="col gap-4" style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 60 }}>
      <ResourceModal open={!!edit} initial={edit} onClose={() => setEdit(null)} onSaved={(r) => { if (r) setView(r.id); }} />
      <ResourceViewer id={view} onClose={() => setView(null)} onEdit={(r) => { setView(null); setEdit(r); }} onDelete={(id) => store.remove(id)} />

      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">Master database · {all.length} assets</div>
          <div className="h-display" style={{ fontSize: 38 }}>Resources</div>
        </div>
        <button onClick={() => setEdit({})} className="btn btn-primary"><Icon name="plus" cls="ic-sm" />New resource</button>
      </div>

      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {tags.map(t => (
          <button key={t} onClick={() => setTag(t)} className="chip" style={{
            height: 30, cursor: "pointer",
            background: tag === t ? "var(--lime)" : "var(--bg-2)",
            color: tag === t ? "#0a0a0a" : "var(--ink-2)",
            borderColor: tag === t ? "var(--lime)" : "var(--line)",
            fontWeight: tag === t ? 600 : 500
          }}>{t}</button>
        ))}
      </div>

      <div className="panel" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 0.9fr 0.4fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
          {["Name", "Type", "Tag", "Updated", ""].map((h, i) => <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>)}
        </div>
        {list.map(r => (
          <div key={r.id} onClick={() => setView(r.id)} style={{ display: "grid", gridTemplateColumns: "2.4fr 1fr 1fr 0.9fr 0.4fr", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--line)", alignItems: "center", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div className="row gap-3" style={{ minWidth: 0 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--bg-2)", color: "var(--lime)", border: "1px solid var(--line)", flexShrink: 0 }}><Icon name={typeIcon[r.type] || "doc"} cls="ic-sm" /></span>
              <span className="truncate" style={{ font: "500 13px var(--sans)", color: "var(--ink)" }}>{r.title}</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>{r.type}</span>
            <span className={"chip " + (tagColor[r.tag] || "chip-dim")} style={{ width: "fit-content" }}>{r.tag}</span>
            <span style={{ fontSize: 11.5, color: "var(--mute-2)" }}>{r.updated}</span>
            <button onClick={(e) => { e.stopPropagation(); setEdit(r); }} className="btn-ghost" style={{ width: 26, height: 26, border: "none", borderRadius: 7, cursor: "pointer", color: "var(--mute-2)", display: "grid", placeItems: "center", justifySelf: "end" }} title="Edit"><Icon name="edit" cls="ic-sm" /></button>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 30, textAlign: "center", color: "var(--mute)", fontSize: 13 }}>No resources in this tag. <button onClick={() => setEdit({ tag: tag === "All" ? "Ops" : tag })} style={{ background: "none", border: "none", color: "var(--lime)", cursor: "pointer", font: "inherit" }}>Add one →</button></div>}
      </div>
    </div>
  );
}

window.Resources = Resources;
