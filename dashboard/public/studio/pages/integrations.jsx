// Integrations — connected data sources across the portfolio.

function Integrations({ go }) {
  const D = window.BIZBOOST_DATA;
  const connected = D.integrations.filter(i => i.status === "connected").length;
  const stMap = {
    connected: { chip: "chip-lime", label: "Connected" },
    partial: { chip: "chip-amber", label: "Partial" },
    disconnected: { chip: "chip-dim", label: "Not connected" }
  };
  return (
    <div className="col gap-4" style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">{connected} of {D.integrations.length} connected</div>
          <div className="h-display" style={{ fontSize: 38 }}>Integrations</div>
        </div>
        <button className="btn"><Icon name="plus" cls="ic-sm" />Browse all</button>
      </div>

      <div className="panel" style={{ padding: 18, background: "linear-gradient(120deg, #14180d, transparent 60%)", borderColor: "#cfff3a2e" }}>
        <div className="row gap-3">
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}><Icon name="link" cls="ic-lg" /></span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: "600 14px var(--sans)" }}>Everything flows into one place</span>
            <span style={{ fontSize: 12.5, color: "var(--mute)" }}>Connect a source once and it syncs for every client that uses it — no per-account setup.</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {D.integrations.map(i => {
          const st = stMap[i.status];
          return (
            <div key={i.id} className="panel" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
              <span style={{ width: 42, height: 42, borderRadius: 11, display: "grid", placeItems: "center", background: i.color + "22", color: i.color, font: "700 18px var(--sans)", flexShrink: 0, border: "1px solid " + i.color + "33" }}>{i.icon}</span>
              <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                <span style={{ font: "600 13.5px var(--sans)" }}>{i.name}</span>
                <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{i.status === "disconnected" ? "Available to connect" : `Active on ${i.connectedTo} ${i.connectedTo === 1 ? "client" : "clients"}`}</span>
              </div>
              {i.status === "disconnected"
                ? <button className="btn" style={{ height: 30 }}>Connect</button>
                : <span className={"chip " + st.chip}><span className="dot"></span>{st.label}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.Integrations = Integrations;
