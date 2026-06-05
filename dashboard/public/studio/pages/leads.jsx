// Leads page — pipeline, upcoming meetings, process map, table + lead detail.

function ResearchBadge({ status }) {
  const map = {
    complete: { c: "chip-lime", l: "Dossier ready", i: "check" },
    running:  { c: "chip-violet", l: "Researching", i: "sparkle" },
    queued:   { c: "chip-dim", l: "Queued", i: "clock" }
  };
  const m = map[status] || map.queued;
  return <span className={"chip " + m.c}><Icon name={m.i} cls="ic-sm" />{m.l}</span>;
}

// ---------- Pipeline (kanban) ----------
function LeadPipeline({ leads, openLead }) {
  const L = window.BIZBOOST_LEADS;
  const stages = L.stages.filter(s => s.id !== "lost");
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length}, minmax(190px, 1fr))`, gap: 12, alignItems: "flex-start", overflowX: "auto" }}>
      {stages.map(st => {
        const items = leads.filter(l => l.stage === st.id);
        return (
          <div key={st.id} className="panel" style={{ padding: 12, background: "var(--bg-1)" }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="row gap-2" style={{ font: "600 12px var(--sans)" }}><span style={{ width: 8, height: 8, borderRadius: 3, background: st.color }}></span>{st.label}</span>
              <span className="chip chip-dim">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map(l => (
                <button key={l.id} onClick={() => openLead(l.id)} className="col gap-2" style={{
                  padding: 12, borderRadius: 11, background: "var(--bg-2)", border: "1px solid var(--line)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "border-color .12s"
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = l.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>
                  <div className="row between">
                    <span className="row gap-2" style={{ minWidth: 0 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: l.color, color: "#0a0a0a", display: "grid", placeItems: "center", font: "700 10px var(--sans)", flexShrink: 0 }}>{l.business[0]}</span>
                      <span className="truncate" style={{ font: "600 12.5px var(--sans)", color: "#fff" }}>{l.business}</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--mute)" }}>{l.person} · {l.niche}</span>
                  <div className="row between" style={{ marginTop: 2 }}>
                    <span className="row gap-2" style={{ fontSize: 10.5, color: "var(--mute-2)" }}><Icon name="calendar" cls="ic-sm" />{l.meetingIn}</span>
                    <span className="num" style={{ fontSize: 11, fontWeight: 600, color: "var(--lime)" }}>€{l.value}</span>
                  </div>
                  {l.stage === "researching" && <ResearchBadge status={l.research} />}
                </button>
              ))}
              {!items.length && <div style={{ fontSize: 11, color: "var(--mute-2)", textAlign: "center", padding: "14px 0" }}>—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- Meetings ----------
function LeadMeetings({ leads, openLead }) {
  const upcoming = leads.filter(l => !["won", "lost"].includes(l.stage) && l.meetingIn !== "done")
    .sort((a, b) => a.priority - b.priority);
  return (
    <div className="col gap-4">
      <div className="panel" style={{ padding: 16, background: "linear-gradient(120deg, #0e1a1f, transparent 60%)", borderColor: "#229ED944" }}>
        <div className="row gap-3">
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "#229ED9", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="msg" cls="ic-lg" /></span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: "600 13.5px var(--sans)" }}>Telegram reminders are on</span>
            <span style={{ fontSize: 12, color: "var(--mute)" }}>You'll get pinged 1 hour and 10 minutes before every call below — no meeting slips.</span>
          </div>
          <span className="chip chip-lime" style={{ marginLeft: "auto" }}><span className="dot"></span>Connected</span>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ font: "600 14px var(--sans)" }}>Upcoming discovery calls</span>
        </div>
        {upcoming.map((l, i) => (
          <button key={l.id} onClick={() => openLead(l.id)} style={{
            display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "14px 18px",
            border: "none", borderBottom: i < upcoming.length - 1 ? "1px solid var(--line)" : "none",
            background: "transparent", cursor: "pointer", textAlign: "left", transition: "background .12s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <div className="col" style={{ alignItems: "center", width: 64, flexShrink: 0, gap: 2 }}>
              <span className="num" style={{ font: "600 17px var(--sans)", color: l.color }}>{l.meetingAt.split("·")[1] || ""}</span>
              <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{l.meetingAt.split("·")[0]}</span>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "var(--line)" }}></div>
            <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ font: "600 13.5px var(--sans)", color: "#fff" }}>{l.business}</span>
              <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{l.person} · {l.niche} · {l.area}</span>
            </div>
            <span className="chip chip-dim">{l.meetingIn}</span>
            <div className="row gap-2">
              {l.introSent && <span className="chip chip-lime" title="Intro sent"><Icon name="check" cls="ic-sm" />Intro</span>}
              <ResearchBadge status={l.research} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- Process map ----------
function ProcessMap() {
  const steps = [
    { n: "01", t: "Capture", c: "#5BCEFA", icon: "plus", d: "Click New Lead, fill the intake — contact, their world, and the qualifying gold.", tags: ["Quick Add", "Intake form"] },
    { n: "02", t: "Automations fire", c: "#25D366", icon: "bolt", d: "One submit triggers 5 systems at once — nothing done by hand.", tags: ["Saved to DB", "Telegram", "Intro msg"] },
    { n: "03", t: "Research agent", c: "#8B7CFF", icon: "sparkle", d: "Deep-mode scan: audit, competitors, Meta Ad Library, US-niche plays, gap → goal.", tags: ["47 sources", "Deep mode"] },
    { n: "04", t: "Auto-prep", c: "#CFFF3A", icon: "doc", d: "A custom meeting brief + proposal draft built from their answers and the research.", tags: ["Brief", "Proposal draft"] },
    { n: "05", t: "Meeting", c: "#FFB547", icon: "phone", d: "Walk in with their competition pulled apart and a plan. Telegram reminded you.", tags: ["Reminded", "Pitched"] },
    { n: "06", t: "Delivery", c: "#3FE0A8", icon: "shield", d: "Won → onboarding → their own command centre live. Lead becomes a client.", tags: ["Onboard", "Dashboard live"] }
  ];
  return (
    <div className="col gap-4">
      <div className="panel" style={{ padding: 20 }}>
        <PanelHead title="Lead capture → delivery" sub="The full machine, end to end" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {steps.map((s, i) => (
            <div key={i} className="col gap-3" style={{ padding: 16, borderRadius: 14, background: "var(--bg-2)", border: "1px solid var(--line)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -6, font: "700 56px var(--sans)", color: s.c, opacity: 0.08, letterSpacing: "-0.04em" }}>{s.n}</div>
              <div className="row gap-2">
                <span style={{ width: 32, height: 32, borderRadius: 9, background: s.c, color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={s.icon} cls="ic-sm" /></span>
                <div className="col" style={{ gap: 0 }}>
                  <span className="eyebrow" style={{ color: s.c }}>Step {s.n}</span>
                  <span style={{ font: "600 14px var(--sans)" }}>{s.t}</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>{s.d}</span>
              <div className="row gap-2" style={{ flexWrap: "wrap", marginTop: "auto" }}>
                {s.tags.map(tg => <span key={tg} className="chip chip-dim">{tg}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Table ----------
function LeadTable({ leads, openLead }) {
  const stageColor = id => (window.BIZBOOST_LEADS.stages.find(s => s.id === id) || {}).color;
  const stageLabel = id => (window.BIZBOOST_LEADS.stages.find(s => s.id === id) || {}).label;
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr", gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg-2)" }}>
        {["Business", "Contact", "Stage", "Meeting", "Value", "Research"].map((h, i) => <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>)}
      </div>
      {leads.map(l => (
        <button key={l.id} onClick={() => openLead(l.id)} style={{
          display: "grid", gridTemplateColumns: "1.6fr 1.2fr 0.9fr 1fr 0.9fr 1fr", gap: 12, alignItems: "center",
          width: "100%", padding: "12px 16px", border: "none", borderBottom: "1px solid var(--line)",
          background: "transparent", cursor: "pointer", textAlign: "left"
        }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: l.color, color: "#0a0a0a", display: "grid", placeItems: "center", font: "700 11px var(--sans)", flexShrink: 0 }}>{l.business[0]}</span>
            <div className="col" style={{ minWidth: 0 }}>
              <span className="truncate" style={{ font: "600 13px var(--sans)", color: "#fff" }}>{l.business}</span>
              <span style={{ fontSize: 11, color: "var(--mute)" }}>{l.niche}</span>
            </div>
          </div>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{l.person}</span>
          <span className="chip" style={{ width: "fit-content", background: stageColor(l.stage) + "22", color: stageColor(l.stage), borderColor: stageColor(l.stage) + "44" }}>{stageLabel(l.stage)}</span>
          <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{l.meetingAt}</span>
          <span className="num" style={{ fontSize: 13, fontWeight: 600, color: "var(--lime)" }}>€{l.value}</span>
          <ResearchBadge status={l.research} />
        </button>
      ))}
    </div>
  );
}

// ---------- Lead detail ----------
function LeadDetail({ id, back }) {
  useLeads();
  const lead = window.BIZBOOST_LEADS.leads.find(l => l.id === id);
  const [tab, setTab] = useState("research");
  const [stageOpen, setStageOpen] = useState(false);
  if (!lead) return <div style={{ color: "var(--mute)" }}>Lead not found.</div>;

  const qual = [
    ["Current client process", lead.process],
    ["Dream client", lead.dream],
    ["What's slowing growth", lead.blockers],
    ["What hitting the goal changes", lead.change],
    ["Why now", lead.whynow]
  ];

  return (
    <div className="col gap-4" style={{ maxWidth: 1080, margin: "0 auto", paddingBottom: 60 }}>
      <button onClick={back} className="btn btn-ghost" style={{ width: "fit-content", height: 28, paddingLeft: 6 }}><Icon name="chevL" cls="ic-sm" />Back to leads</button>

      {/* header */}
      <div className="panel" style={{ padding: 20, background: `linear-gradient(120deg, ${lead.color}14, transparent 55%)`, borderColor: lead.color + "33" }}>
        <div className="row between" style={{ alignItems: "flex-start" }}>
          <div className="row gap-4" style={{ minWidth: 0 }}>
            <span style={{ width: 50, height: 50, borderRadius: 14, background: lead.color, color: "#0a0a0a", display: "grid", placeItems: "center", font: "700 22px var(--sans)", flexShrink: 0 }}>{lead.business[0]}</span>
            <div className="col" style={{ gap: 6, minWidth: 0 }}>
              <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ font: "600 21px var(--sans)", letterSpacing: "-0.02em", color: "#fff" }}>{lead.business}</span>
                <span className="chip chip-dim">{lead.niche}</span>
                <ResearchBadge status={lead.research} />
              </div>
              <div className="row gap-3" style={{ color: "var(--mute)", fontSize: 12.5, flexWrap: "wrap" }}>
                <span className="row gap-2"><Icon name="users" cls="ic-sm" />{lead.person}</span>
                <span className="row gap-2"><Icon name="mail" cls="ic-sm" />{lead.email}</span>
                <span className="row gap-2"><Icon name="phone" cls="ic-sm" />{lead.phone}</span>
                <span className="row gap-2"><Icon name="pin" cls="ic-sm" />{lead.area}</span>
              </div>
            </div>
          </div>
          <div className="row gap-2">
            <div style={{ position: "relative" }}>
              <button onClick={() => setStageOpen(o => !o)} className="btn" style={{ borderColor: lead.color + "66", color: lead.color }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: lead.color }}></span>
                {(window.BIZBOOST_LEADS.stages.find(s => s.id === lead.stage) || {}).label || "Stage"}
                <Icon name="chevD" cls="ic-sm" />
              </button>
              {stageOpen && (
                <React.Fragment>
                  <div onClick={() => setStageOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }}></div>
                  <div className="panel" style={{ position: "absolute", top: 40, left: 0, zIndex: 41, width: 200, padding: 6, background: "var(--elev)", border: "1px solid var(--line-2)", boxShadow: "0 16px 50px #000a" }}>
                    <span className="eyebrow" style={{ display: "block", padding: "4px 8px" }}>Set status</span>
                    {window.BIZBOOST_LEADS.stages.map(s => {
                      const on = lead.stage === s.id;
                      return (
                        <button key={s.id} onClick={() => { window.LeadStore.setStage(lead.id, s.id); setStageOpen(false); }} className="row gap-2" style={{ width: "100%", padding: "8px 9px", borderRadius: 8, border: "none", background: on ? "var(--bg-active)" : "transparent", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={e => { if (!on) e.currentTarget.style.background = "var(--bg-2)"; }}
                          onMouseLeave={e => { if (!on) e.currentTarget.style.background = "transparent"; }}>
                          <span style={{ width: 8, height: 8, borderRadius: 99, background: s.color, flexShrink: 0 }}></span>
                          <span style={{ font: "500 12.5px var(--sans)", color: on ? "#fff" : "var(--ink-2)", flex: 1 }}>{s.label}</span>
                          {on && <Icon name="check" cls="ic-sm" />}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              )}
            </div>
            <button className="btn"><Icon name="msg" cls="ic-sm" />Message</button>
            <button className="btn btn-primary"><Icon name="doc" cls="ic-sm" />Build proposal</button>
          </div>
        </div>
        {/* meeting + automation status strip */}
        <div className="row gap-2" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line)", flexWrap: "wrap" }}>
          <span className="chip"><Icon name="calendar" cls="ic-sm" />{lead.meetingAt}</span>
          <span className="chip" style={{ color: "#229ED9", borderColor: "#229ED944" }}><Icon name="msg" cls="ic-sm" />Telegram reminder set</span>
          {lead.introSent ? <span className="chip chip-lime"><Icon name="check" cls="ic-sm" />Intro sent</span> : <span className="chip chip-amber"><Icon name="clock" cls="ic-sm" />Intro pending</span>}
          <span className="chip chip-lime" style={{ marginLeft: "auto" }}>€{lead.value} · {lead.package}</span>
        </div>
      </div>

      {/* tabs */}
      <div className="row gap-2" style={{ borderBottom: "1px solid var(--line)" }}>
        {[["research", "Research dossier"], ["intake", "Intake answers"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "8px 4px", marginRight: 14,
            font: (tab === v ? 600 : 500) + " 13px var(--sans)", color: tab === v ? "var(--ink)" : "var(--mute)",
            borderBottom: "2px solid " + (tab === v ? "var(--lime)" : "transparent"), marginBottom: -1
          }}>{l}</button>
        ))}
      </div>

      {tab === "research" ? (
        lead.research === "complete" ? <Dossier lead={lead} /> : <ResearchRunning lead={lead} />
      ) : (
        <div className="panel" style={{ padding: 20 }}>
          <PanelHead title="What they told you" sub="Captured at intake" />
          <div className="col gap-3">
            <div className="row gap-3" style={{ flexWrap: "wrap" }}>
              <InfoBit label="Google" value={lead.google} />
              <InfoBit label="Socials" value={lead.socials} />
              <InfoBit label="Services" value={lead.services} wide />
            </div>
            <div className="divider"></div>
            {qual.map(([q, a], i) => (
              <div key={i} className="col gap-2" style={{ padding: "12px 14px", borderRadius: 11, background: i === 1 || i === 4 ? "#cfff3a0a" : "var(--bg-2)", border: "1px solid " + (i === 1 || i === 4 ? "#cfff3a2a" : "var(--line)") }}>
                <span className="eyebrow" style={{ color: i === 1 || i === 4 ? "var(--lime)" : "var(--mute)" }}>{q}</span>
                <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBit({ label, value, wide }) {
  return (
    <div className="col gap-1" style={{ flex: wide ? "1 1 100%" : "1", minWidth: 0 }}>
      <span className="eyebrow">{label}</span>
      <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{value || "—"}</span>
    </div>
  );
}

// ---------- Page shell ----------
function Leads({ go, onNewLead, sub }) {
  const L = window.BIZBOOST_LEADS;
  const [view, setView] = useState("pipeline");
  const [openId, setOpenId] = useState(null);

  // allow deep-link via sub (e.g. open a lead from elsewhere)
  useEffect(() => { if (sub && sub.leadId) setOpenId(sub.leadId); }, [sub]);

  if (openId) return <LeadDetail id={openId} back={() => setOpenId(null)} />;

  const leads = L.leads;
  const liveCount = leads.filter(l => !["won", "lost"].includes(l.stage)).length;
  const meetingsCount = leads.filter(l => !["won", "lost"].includes(l.stage) && l.meetingIn !== "done").length;
  const researching = leads.filter(l => l.research === "running" || l.research === "queued").length;

  return (
    <div className="col gap-4" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">{liveCount} in pipeline · {meetingsCount} meetings booked · {researching} researching</div>
          <div className="h-display" style={{ fontSize: 38 }}>Leads</div>
        </div>
        <button onClick={onNewLead} className="btn btn-primary" style={{ height: 36 }}><Icon name="plus" cls="ic-sm" />New lead</button>
      </div>

      <div className="row between">
        <Segmented
          options={[{ value: "pipeline", label: "Pipeline" }, { value: "meetings", label: "Meetings" }, { value: "process", label: "Process map" }, { value: "table", label: "All leads" }]}
          value={view} onChange={setView} />
        {view !== "process" && <span style={{ fontSize: 11.5, color: "var(--mute)" }} className="row gap-2"><span className="live-dot"></span>Telegram synced</span>}
      </div>

      {view === "pipeline" && <LeadPipeline leads={leads} openLead={setOpenId} />}
      {view === "meetings" && <LeadMeetings leads={leads} openLead={setOpenId} />}
      {view === "process" && <ProcessMap />}
      {view === "table" && <LeadTable leads={leads} openLead={setOpenId} />}
    </div>
  );
}

window.Leads = Leads;
