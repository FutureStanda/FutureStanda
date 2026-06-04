// Left navigation rail — Notion-style with toggle sections + master databases

function NavRow({ icon, label, active, onClick, trailing, indent, emoji }) {
  return (
    <button onClick={onClick} className="sb-row" style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      height: 32, padding: indent ? "0 10px 0 30px" : "0 10px", borderRadius: 8,
      border: "none", cursor: "pointer", textAlign: "left",
      background: active ? "var(--bg-active)" : "transparent",
      color: active ? "var(--ink)" : "var(--ink-2)",
      transition: "background .12s ease, color .12s ease",
      position: "relative"
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      {active && <span style={{ position: "absolute", left: -10, top: 8, bottom: 8, width: 3, borderRadius: 3, background: "var(--lime)" }}></span>}
      {emoji ? <span style={{ width: 16, textAlign: "center", fontSize: 14, flexShrink: 0 }}>{emoji}</span> : <Icon name={icon} />}
      <span className="sb-text truncate" style={{ flex: 1, font: (active ? 600 : 500) + " 13px var(--sans)" }}>{label}</span>
      {trailing != null && <span className="sb-trail">{trailing}</span>}
    </button>
  );
}

function SectionToggle({ label, open, onToggle, action }) {
  return (
    <div className="row between sb-section-label" style={{ padding: "0 10px", height: 26, marginTop: 4 }}>
      <button onClick={onToggle} className="row gap-2 sb-toggle" style={{
        background: "none", border: "none", cursor: "pointer", padding: 0,
        color: "var(--mute-2)", font: "600 10.5px var(--sans)", letterSpacing: "0.12em", textTransform: "uppercase"
      }}>
        <span style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s ease", display: "inline-flex" }}>
          <Icon name="chevR" cls="ic-sm" />
        </span>
        {label}
      </button>
      {action}
    </div>
  );
}

function Sidebar({ route, go, onQuickAdd, collapsed, setCollapsed }) {
  const D = window.BIZBOOST_DATA;
  const [openWork, setOpenWork] = useState(true);
  const [openClients, setOpenClients] = useState(true);
  const [openDB, setOpenDB] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const pendingTotal = D.tasks.filter(t => t.status !== "done").length;

  return (
    <aside style={{
      background: "linear-gradient(180deg, #0d0f0d, #0a0b0a)",
      borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      height: "100vh", overflow: "hidden"
    }}>
      {/* workspace header */}
      <div className="sb-workspace" style={{ padding: "14px 12px 10px" }}>
        <button onClick={() => go({ page: "briefing" })} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 10, textAlign: "left"
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: "var(--lime)", color: "#0a0a0a",
            display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)"
          }}>
            <Icon name="bolt" cls="ic-lg" />
          </div>
          <div className="sb-workspace-meta col" style={{ gap: 1, minWidth: 0 }}>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <span style={{ font: "600 14px var(--sans)", letterSpacing: "-0.01em", color: "var(--lime)", textShadow: "0 0 18px " + "var(--lime-soft)" }}>BizBoost</span>
            </div>
            <span style={{ font: "500 11px var(--sans)", color: "var(--mute)" }}>Command Centre</span>
          </div>
        </button>
      </div>

      {/* search / cmdk trigger */}
      <div className="sb-workspace" style={{ padding: "2px 12px 10px" }}>
        <button onClick={onQuickAdd} className="sb-row" style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", height: 34,
          padding: "0 10px", borderRadius: 9, cursor: "pointer", textAlign: "left",
          background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--mute)"
        }}>
          <Icon name="search" />
          <span className="sb-text" style={{ flex: 1, fontSize: 12.5 }}>Search or jump to…</span>
          <span className="sb-trail kbd">⌘K</span>
        </button>
      </div>

      {/* scroll area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 12px 12px" }}>
        {/* quick add */}
        <button onClick={onQuickAdd} className="sb-quickadd sb-row" style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%", height: 34, marginBottom: 8,
          padding: "0 10px", borderRadius: 9, cursor: "pointer", textAlign: "left",
          background: "var(--lime-soft)", border: "1px solid #cfff3a3a", color: "var(--lime)", fontWeight: 600
        }}>
          <Icon name="plus" />
          <span className="sb-text sb-quickadd-label" style={{ fontSize: 12.5 }}>Quick Add</span>
        </button>

        {/* WORKSPACE */}
        <SectionToggle label="Workspace" open={openWork} onToggle={() => setOpenWork(!openWork)} />
        {openWork && (
          <div className="col" style={{ gap: 1, marginBottom: 8 }}>
            <NavRow icon="home" label="Briefing" active={route.page === "briefing"} onClick={() => go({ page: "briefing" })} />
            <NavRow icon="users" label="Clients" active={route.page === "clients" || route.page === "client"} onClick={() => go({ page: "clients" })}
              trailing={<span className="chip chip-dim" style={{ height: 18, padding: "0 6px" }}>{D.clients.length}</span>} />
            <NavRow icon="inbox" label="Leads" active={route.page === "leads"} onClick={() => go({ page: "leads" })}
              trailing={<span className="chip chip-lime" style={{ height: 18, padding: "0 6px" }}>{(window.BIZBOOST_LEADS ? window.BIZBOOST_LEADS.leads.filter(l => !["won","lost"].includes(l.stage)).length : 0)}</span>} />
            <NavRow icon="checkSquare" label="Tasks" active={route.page === "tasks"} onClick={() => go({ page: "tasks" })}
              trailing={<span className="chip chip-lime" style={{ height: 18, padding: "0 6px" }}>{pendingTotal}</span>} />
            <NavRow icon="megaphone" label="Marketing" active={route.page === "marketing"} onClick={() => go({ page: "marketing" })} />
            <NavRow icon="target" label="Objectives" active={route.page === "objectives"} onClick={() => go({ page: "objectives" })} />
            <NavRow icon="refresh" label="Automations" active={route.page === "automations"} onClick={() => go({ page: "automations" })} />
            <NavRow icon="sparkle" label="Agents" active={route.page === "agents"} onClick={() => go({ page: "agents" })} />
            <NavRow icon="plug" label="Integrations" active={route.page === "integrations"} onClick={() => go({ page: "integrations" })} />
          </div>
        )}

        {/* CLIENTS quick list */}
        <SectionToggle label="Pinned clients" open={openClients} onToggle={() => setOpenClients(!openClients)} />
        {openClients && (
          <div className="col" style={{ gap: 1, marginBottom: 8 }}>
            {D.clients.slice(0, 5).map(c => (
              <button key={c.id} onClick={() => go({ page: "client", id: c.id })} className="sb-row" style={{
                display: "flex", alignItems: "center", gap: 9, width: "100%", height: 30,
                padding: "0 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
                background: route.id === c.id ? "var(--bg-active)" : "transparent",
                color: route.id === c.id ? "var(--ink)" : "var(--ink-2)"
              }}
                onMouseEnter={e => { if (route.id !== c.id) e.currentTarget.style.background = "var(--bg-2)"; }}
                onMouseLeave={e => { if (route.id !== c.id) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, flexShrink: 0 }}></span>
                <span className="sb-text truncate" style={{ flex: 1, fontSize: 12.5 }}>{c.name}</span>
                {c.flag === "At risk" && <span className="sb-trail dot" style={{ color: "var(--red)" }}></span>}
              </button>
            ))}
          </div>
        )}

        {/* MASTER DATABASES */}
        <SectionToggle label="Master databases" open={openDB} onToggle={() => setOpenDB(!openDB)} />
        {openDB && (
          <div className="col" style={{ gap: 1 }}>
            <NavRow icon="folder" label="Resources" active={route.page === "resources"} onClick={() => go({ page: "resources" })} />
            <NavRow icon="doc" label="Pages" active={route.page === "docs"} onClick={() => go({ page: "docs" })} />
            <NavRow emoji="📘" label="Playbooks" active={false} onClick={() => go({ page: "resources" })} />
            <NavRow emoji="💷" label="Pricing & guarantees" active={false} onClick={() => go({ page: "docs" })} />
          </div>
        )}
      </div>

      {/* footer — user + collapse */}
      <div className="sb-workspace" style={{ borderTop: "1px solid var(--line)", padding: "10px 12px", position: "relative" }}>
        {menuOpen && <AccountMenu onClose={() => setMenuOpen(false)} go={go} />}
        <div className="row between">
          <button onClick={() => setMenuOpen(o => !o)} className="row gap-2 sb-acct" style={{ minWidth: 0, flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "4px 6px", borderRadius: 8 }}>
            <span className="avatar" style={{ background: "#cfff3a" }}>B</span>
            <div className="sb-workspace-meta col" style={{ gap: 0, minWidth: 0 }}>
              <span className="truncate" style={{ font: "600 12.5px var(--sans)" }}>Bartek</span>
              <span style={{ font: "500 10.5px var(--sans)", color: "var(--mute)" }}>Founder · Max</span>
            </div>
            <span className="sb-trail" style={{ color: "var(--mute-2)", marginLeft: "auto" }}><Icon name="chevD" cls="ic-sm" /></span>
          </button>
          <button onClick={() => setCollapsed(!collapsed)} className="btn-ghost sb-trail" style={{
            width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center", border: "none", cursor: "pointer", color: "var(--mute)", flexShrink: 0
          }} title="Collapse sidebar">
            <Icon name="collapse" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function AccountMenu({ onClose, go }) {
  const item = (icon, label, sub, onClick, right) => (
    <button onClick={() => { onClose(); onClick && onClick(); }} className="acct-item">
      <Icon name={icon} cls="ic-sm" /><span style={{ flex: 1 }}>{label}</span>
      {right && <span style={{ color: "var(--mute-2)", fontSize: 11 }}>{right}</span>}
    </button>
  );
  return (
    <React.Fragment>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60 }}></div>
      <div className="acct-menu">
        <div className="acct-head">
          <span className="avatar" style={{ background: "#cfff3a", width: 30, height: 30 }}>B</span>
          <div className="col" style={{ gap: 1, minWidth: 0 }}>
            <span className="truncate" style={{ font: "600 12.5px var(--sans)" }}>bartekstanda@icloud.com</span>
            <span style={{ fontSize: 10.5, color: "var(--lime)" }}>STANDA · Max plan</span>
          </div>
        </div>
        <div className="acct-sec">
          {item("settings", "Settings", null, () => go({ page: "integrations" }), "⌘,")}
          {item("globe", "Language", null, null, "EN ›")}
          {item("shield", "Get help", null, null)}
        </div>
        <div className="acct-div"></div>
        <div className="acct-sec">
          {item("bolt", "Upgrade plan", null, null)}
          {item("plug", "Get apps & extensions", null, null)}
          {item("star", "Refer & earn credit", null, null)}
          {item("sparkle", "What's new", null, null)}
        </div>
        <div className="acct-div"></div>
        <div className="acct-sec">
          {item("x", "Log out", null, null)}
        </div>
      </div>
    </React.Fragment>
  );
}

window.Sidebar = Sidebar;
