// Clients — multi-business roster. Card grid + table toggle, filters.

function ClientCard({ c, go }) {
  return (
    <button onClick={() => go({ page: "client", id: c.id })} className="panel" style={{
      padding: 16, textAlign: "left", cursor: "pointer", border: "1px solid var(--line)",
      background: "var(--bg-1)", transition: "border-color .15s, transform .15s", display: "block", width: "100%"
    }}
    onMouseEnter={(e) => {e.currentTarget.style.borderColor = "var(--line-2)";e.currentTarget.style.transform = "translateY(-2px)";}}
    onMouseLeave={(e) => {e.currentTarget.style.borderColor = "var(--line)";e.currentTarget.style.transform = "none";}}>
      {/* header */}
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <Avatar client={c} size="avatar-lg" />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span className="truncate" style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "#FFFFFF" }}>{c.name}</span>
            <span style={{ font: "500 11.5px var(--sans)", color: "var(--mute)" }}>{c.city} · {c.niche}</span>
          </div>
        </div>
        <HealthPill score={c.health} />
      </div>

      {/* flag */}
      {c.flag &&
      <div className="chip" style={{ marginBottom: 12,
        background: c.flag === "At risk" ? "#ff6b5c1c" : c.flag === "Top performer" ? "#cfff3a1c" : "#ffb5471c",
        color: c.flag === "At risk" ? "var(--red)" : c.flag === "Top performer" ? "var(--lime)" : "var(--amber)",
        borderColor: "transparent" }}>
          <span className="dot"></span>{c.flag}
        </div>
      }

      {/* mini metrics */}
      <div className="row" style={{ gap: 0, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "12px 0", marginBottom: 12 }}>
        <MiniMetric label="Leads" value={c.leads30} delta={c.leadsΔ} />
        <div style={{ width: 1, background: "var(--line)" }}></div>
        <MiniMetric label="Booked" value={c.bookings30} delta={c.bookingsΔ} />
        <div style={{ width: 1, background: "var(--line)" }}></div>
        <MiniMetric label="ROAS" value={c.roas ? c.roas.toFixed(1) + "x" : "—"} />
      </div>

      {/* footer */}
      <div className="row between">
        <PlanBadge plan={c.plan} />
        <div className="row gap-2" style={{ color: "var(--mute)", fontSize: 11 }}>
          <Icon name="clock" cls="ic-sm" />{c.lastTouch}
        </div>
      </div>
    </button>);

}

function MiniMetric({ label, value, delta }) {
  return (
    <div className="col" style={{ gap: 3, flex: 1, alignItems: "center" }}>
      <span className="num" style={{ fontWeight: 600, fontSize: 17, color: "#FFFFFF" }}>{value}</span>
      <div className="row gap-2" style={{ alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "var(--mute)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        {delta != null && delta !== 0 && <span style={{ fontSize: 10, fontWeight: 600, color: delta > 0 ? "var(--lime)" : "var(--red)" }}>{delta > 0 ? "↑" : "↓"}</span>}
      </div>
    </div>);

}

function ClientRow({ c, go }) {
  return (
    <button onClick={() => go({ page: "client", id: c.id })} style={{
      display: "grid", gridTemplateColumns: "2.2fr 1fr 0.8fr 0.8fr 0.7fr 0.9fr 0.6fr", gap: 12, alignItems: "center",
      width: "100%", padding: "12px 16px", border: "none", borderBottom: "1px solid var(--line)",
      background: "transparent", cursor: "pointer", textAlign: "left", transition: "background .12s"
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <div className="row gap-3" style={{ minWidth: 0 }}>
        <Avatar client={c} />
        <div className="col" style={{ gap: 1, minWidth: 0 }}>
          <span className="truncate" style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "#FFFFFF" }}>{c.name}</span>
          <span style={{ font: "500 11px var(--sans)", color: "var(--mute)" }}>{c.city} · {c.niche}</span>
        </div>
      </div>
      <div><PlanBadge plan={c.plan} /></div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13 }}>{c.leads30}<span style={{ color: "var(--mute-2)", fontWeight: 400, fontSize: 11 }}> lds</span></div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13 }}>{c.bookings30}</div>
      <div className="num" style={{ fontWeight: 600, fontSize: 13, color: c.roas >= 5 ? "var(--lime)" : "var(--ink)" }}>{c.roas ? c.roas.toFixed(1) + "x" : "—"}</div>
      <div className="row gap-2"><div className="prog" style={{ width: 50 }}><i style={{ width: c.health + "%", background: c.health < 65 ? "var(--red)" : c.health < 80 ? "var(--amber)" : "var(--lime)" }}></i></div><span className="num" style={{ fontSize: 12, color: "var(--mute)" }}>{c.health}</span></div>
      <div className="row" style={{ justifyContent: "flex-end" }}>{c.flag && <span className="dot" style={{ color: c.flag === "At risk" ? "var(--red)" : "var(--lime)" }}></span>}</div>
    </button>);

}

function Clients({ go, onNewClient }) {
  const D = window.BIZBOOST_DATA;
  const [view, setView] = useState("grid");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("health");

  const filters = ["All", "Domination", "Growth", "Starter", "At risk"];
  let list = D.clients.filter((c) => {
    if (filter === "All") return true;
    if (filter === "At risk") return c.health < 65 || c.flag === "At risk";
    return c.plan === filter;
  });
  list = [...list].sort((a, b) => {
    if (sort === "health") return b.health - a.health;
    if (sort === "leads") return b.leads30 - a.leads30;
    if (sort === "revenue") return b.revenue30 - a.revenue30;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="col gap-4" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">Portfolio · {D.clients.length} businesses</div>
          <div className="h-display" style={{ fontSize: 38, width: "133px" }}>Clients</div>
        </div>
        <div className="row gap-2">
          <Segmented options={[{ value: "grid", label: "Grid" }, { value: "table", label: "Table" }]} value={view} onChange={setView} />
          <button onClick={onNewClient} className="btn btn-primary"><Icon name="plus" cls="ic-sm" />Add client</button>
        </div>
      </div>

      {/* filter bar */}
      <div className="row between">
        <div className="row gap-2">
          {filters.map((f) =>
          <button key={f} onClick={() => setFilter(f)} className="chip" style={{
            height: 30, cursor: "pointer",
            background: filter === f ? "var(--lime)" : "var(--bg-2)",
            color: filter === f ? "#0a0a0a" : "var(--ink-2)",
            borderColor: filter === f ? "var(--lime)" : "var(--line)",
            fontWeight: filter === f ? 600 : 500
          }}>{f}{f === "At risk" && <span className="dot" style={{ color: filter === f ? "#0a0a0a" : "var(--red)" }}></span>}</button>
          )}
        </div>
        <div className="row gap-2" style={{ color: "var(--mute)" }}>
          <Icon name="filter" cls="ic-sm" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{
            background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--ink-2)",
            borderRadius: 999, height: 30, padding: "0 12px", font: "500 12px var(--sans)", cursor: "pointer"
          }}>
            <option value="health">Sort: Health</option>
            <option value="leads">Sort: Leads</option>
            <option value="revenue">Sort: Revenue</option>
            <option value="name">Sort: Name</option>
          </select>
        </div>
      </div>

      {/* content */}
      {view === "grid" ?
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {list.map((c, i) => <div key={c.id} className="fadeup" style={{ animationDelay: i * 0.03 + "s" }}><ClientCard c={c} go={go} /></div>)}
        </div> :

      <div className="panel" style={{ overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 0.8fr 0.8fr 0.7fr 0.9fr 0.6fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
            {["Business", "Plan", "Leads", "Booked", "ROAS", "Health", ""].map((h, i) =>
          <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
          )}
          </div>
          {list.map((c) => <ClientRow key={c.id} c={c} go={go} />)}
        </div>
      }
    </div>);

}

window.Clients = Clients;