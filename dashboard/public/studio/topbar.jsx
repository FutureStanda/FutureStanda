// Top bar — breadcrumb / page title, live status, actions, AI toggle

function Topbar({ route, go, crumb, onCmdK, onToggleAI, aiOpen }) {
  const D = window.BIZBOOST_DATA;
  return (
    <header style={{
      height: 56, flexShrink: 0,
      borderBottom: "1px solid var(--line)",
      background: "linear-gradient(180deg, #0e100e, #0b0c0b)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", gap: 16,
      backdropFilter: "blur(8px)"
    }}>
      {/* breadcrumb */}
      <div className="row gap-2" style={{ minWidth: 0 }}>
        {crumb.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ color: "var(--dim)", fontSize: 13 }}>/</span>}
            <button onClick={c.onClick} disabled={!c.onClick} style={{
              background: "none", border: "none", cursor: c.onClick ? "pointer" : "default", padding: 0,
              font: (i === crumb.length - 1 ? 600 : 500) + " 14px var(--sans)",
              color: i === crumb.length - 1 ? "var(--ink)" : "var(--mute)",
            }}>{c.label}</button>
          </React.Fragment>
        ))}
      </div>

      {/* center: live status */}
      <div className="row gap-3" style={{ flex: 1, justifyContent: "center" }}>
        <div className="row gap-2 chip" style={{ height: 28, background: "var(--bg-2)", borderColor: "var(--line)" }}>
          <span className="live-dot"></span>
          <span style={{ color: "var(--ink-2)", fontSize: 11.5 }}>Live · synced 2m ago</span>
        </div>
      </div>

      {/* actions */}
      <div className="row gap-2">
        <button onClick={onCmdK} className="btn" title="Command (⌘K)">
          <Icon name="command" cls="ic-sm" />
          <span className="kbd" style={{ border: "none", background: "transparent", padding: 0 }}>⌘K</span>
        </button>
        <button className="btn" style={{ width: 32, padding: 0, justifyContent: "center", position: "relative" }} title="Notifications">
          <Icon name="bell" cls="ic-sm" />
          <span style={{ position: "absolute", top: 6, right: 7, width: 6, height: 6, borderRadius: 3, background: "var(--lime)" }}></span>
        </button>
        <button onClick={onToggleAI} className={aiOpen ? "btn btn-primary" : "btn"} style={{ paddingLeft: 10 }}>
          <Icon name="sparkle" cls="ic-sm" />
          Ask Boost
        </button>
      </div>
    </header>
  );
}

window.Topbar = Topbar;
