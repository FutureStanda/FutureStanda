// Admin-side deep drill-downs (dark/lime theme). Reuses the lead dataset from the portal.
// Topics: 'stat' (portfolio metric → client breakdown), 'brief' (a brief item → deep view),
//         'clientMetric' (one client's metric → records).

function adrMoney(n) { return n >= 1000 ? "€" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : "€" + Math.round(n); }

function AdminDrill({ topic, onClose, go, onTask }) {
  const [record, setRecord] = useState(null);
  useEffect(() => { setRecord(null); }, [topic]);
  if (!topic) return null;
  const D = window.BIZBOOST_DATA;

  let head, body;

  // ---------- portfolio stat → per-client contribution ----------
  if (topic.type === "stat") {
    const key = topic.key;
    const getVal = c => key === "mrr" ? c.mrr : key === "leads" ? c.leads30 : key === "revenue" ? c.revenue30 : c.health;
    const fmt = v => key === "mrr" || key === "revenue" ? adrMoney(v) : key === "health" ? v : v;
    const rows = [...D.clients].map(c => ({ c, v: getVal(c) })).sort((a, b) => b.v - a.v);
    const total = key === "health" ? Math.round(rows.reduce((a, r) => a + r.v, 0) / rows.length) : rows.reduce((a, r) => a + r.v, 0);
    const max = Math.max(...rows.map(r => r.v), 1);
    head = { title: topic.label, sub: (key === "health" ? "Avg " + total : fmt(total)) + " across " + rows.length + " clients" };
    body = (
      <React.Fragment>
        <div className="adr-stat-hero">
          <span className="adr-stat-big">{key === "health" ? total : fmt(total)}</span>
          <span className="adr-stat-lbl">{topic.label} · this month</span>
        </div>
        <div className="adr-sec">
          <span className="adr-sec-t">{key === "health" ? "Lowest first — who needs attention" : "Who's contributing"}</span>
          <div className="col gap-2">
            {(key === "health" ? [...rows].reverse() : rows).map(({ c, v }) => (
              <button key={c.id} className="adr-row" onClick={() => { onClose(); go({ page: "client", id: c.id }); }}>
                <span className="adr-dot" style={{ background: c.color }}></span>
                <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
                  <div className="row between"><span className="adr-row-t">{c.name}</span><span className="num adr-row-v">{fmt(v)}</span></div>
                  <div className="adr-bar"><i style={{ width: (v / max * 100) + "%", background: key === "health" ? (v < 65 ? "var(--red)" : v < 80 ? "var(--amber)" : "var(--lime)") : c.color }}></i></div>
                </div>
                <Icon name="chevR" cls="ic-sm" />
              </button>
            ))}
          </div>
        </div>
      </React.Fragment>
    );
  }

  // ---------- brief item → deep view ----------
  else if (topic.type === "brief") {
    const it = topic.item;
    const c = it.client ? getClient(it.client) : null;
    const toneColor = topic.tone === "lime" ? "var(--lime)" : topic.tone === "red" ? "var(--red)" : "var(--amber)";
    head = { title: topic.toneLabel, sub: c ? c.name : "Portfolio", tone: toneColor };
    // metric readout
    const readout = [];
    if (c) {
      if (it.metric === "roas") { readout.push(["ROAS", (c.roas || 0).toFixed(1) + "×"]); readout.push(["Ad spend", adrMoney(c.adSpend || 0)]); readout.push(["Leads · 30d", c.leads30]); }
      else if (it.metric === "leads") { readout.push(["Leads · 30d", c.leads30]); readout.push(["Change", (c.leadsΔ >= 0 ? "+" : "") + Math.round(c.leadsΔ * 100) + "%"]); readout.push(["Bookings", c.bookings30]); }
      else if (it.metric === "reviews") { readout.push(["Rating", c.reviews.rating]); readout.push(["New · 30d", "+" + c.reviews.new30]); readout.push(["Total", c.reviews.count]); }
      else if (it.metric === "missed") { readout.push(["Missed calls", c.missedCalls]); readout.push(["Leads · 30d", c.leads30]); readout.push(["Health", c.health]); }
      else if (it.metric === "plan") { readout.push(["Plan", c.plan]); readout.push(["MRR", adrMoney(c.mrr)]); readout.push(["Leads · 30d", c.leads30]); }
      else { readout.push(["Health", c.health]); readout.push(["Leads", c.leads30]); readout.push(["MRR", adrMoney(c.mrr)]); }
    }
    body = (
      <React.Fragment>
        <div className="adr-brief-hero" style={{ borderColor: toneColor + "44", background: toneColor + "10" }}>
          <span style={{ color: toneColor, flexShrink: 0, marginTop: 1 }}><Icon name={topic.icon} cls="ic-sm" /></span>
          <span className="adr-brief-t">{it.t}</span>
        </div>
        {c && (
          <button className="adr-client-card" onClick={() => { onClose(); go({ page: "client", id: c.id }); }}>
            <Avatar client={c} />
            <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
              <span className="adr-row-t">{c.name}</span>
              <span className="adr-row-d">{c.city} · {c.niche} · {c.plan}</span>
            </div>
            <Icon name="chevR" cls="ic-sm" />
          </button>
        )}
        {readout.length > 0 && (
          <div className="adr-readout">
            {readout.map(([l, v], i) => <div key={i} className="adr-ro-cell"><span className="adr-ro-v">{v}</span><span className="adr-ro-l">{l}</span></div>)}
          </div>
        )}
        <div className="adr-sec">
          <span className="adr-sec-t">What this means</span>
          <p className="adr-why">{it.why}</p>
        </div>
        <div className="adr-sec">
          <span className="adr-sec-t">Recommended next step</span>
          <div className="adr-action" style={{ borderColor: toneColor + "44" }}>
            <span className="row gap-2" style={{ minWidth: 0 }}><span style={{ color: toneColor, flexShrink: 0 }}><Icon name="bolt" cls="ic-sm" /></span><span className="adr-row-t">{it.action}</span></span>
            {it.actionKind === "task" && <button className="adr-btn" style={{ background: toneColor }} onClick={() => { onTask && onTask({ title: it.action + (c ? " — " + c.name : ""), client: it.client || null, priority: it.urgent ? "P0" : "P1", due: "Today", category: it.metric === "roas" || it.metric === "ads" ? "Ads" : it.metric === "reviews" ? "Reputation" : it.metric === "plan" ? "Sales" : "Account" }); onClose(); }}><Icon name="plus" cls="ic-sm" />Create task</button>}
            {it.actionKind === "tasks" && <button className="adr-btn" style={{ background: toneColor }} onClick={() => { onClose(); go({ page: "tasks" }); }}>Open<Icon name="arrowR" cls="ic-sm" /></button>}
            {it.actionKind === "client" && c && <button className="adr-btn" style={{ background: toneColor }} onClick={() => { onClose(); go({ page: "client", id: c.id }); }}>Open<Icon name="arrowR" cls="ic-sm" /></button>}
          </div>
        </div>
      </React.Fragment>
    );
  }

  // ---------- client metric → records (reuse portal lead dataset) ----------
  else if (topic.type === "clientMetric") {
    const c = getClient(topic.clientId);
    const metric = topic.metric;
    const leads = window.buildPortalLeads ? window.buildPortalLeads(c, "var(--lime)") : [];
    const SM = window.PORTAL_STATUS_META || {};
    if (record) {
      head = { title: record.name, sub: record.svc + " · " + record.area, back: true };
      body = <AdminRecord l={record} />;
    } else if (metric === "leads") {
      const counts = { all: leads.length, won: 0, booked: 0, quoted: 0, lost: 0, new: 0 };
      leads.forEach(l => counts[l.status]++);
      head = { title: c.name + " · Leads", sub: c.leads30 + " this month · " + (c.leadsΔ >= 0 ? "+" : "") + Math.round(c.leadsΔ * 100) + "%" };
      body = (
        <div className="adr-sec">
          <span className="adr-sec-t">Every lead · tap to open</span>
          <div className="col gap-2">
            {leads.map(l => {
              const sm = SM[l.status] || { label: l.status, color: "var(--mute)" };
              return (
                <button key={l.id} className="adr-row" onClick={() => setRecord(l)}>
                  <span className="adr-av" style={{ background: l.srcColor + "22", color: l.srcColor }}>{l.name[0]}</span>
                  <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}><span className="adr-row-t">{l.name}</span><span className="adr-row-d">{l.svc} · via {l.src}</span></div>
                  <span className="adr-pill" style={{ color: sm.color, borderColor: sm.color + "55" }}>{sm.label}</span>
                  <Icon name="chevR" cls="ic-sm" />
                </button>
              );
            })}
          </div>
        </div>
      );
    } else if (metric === "reviews") {
      head = { title: c.name + " · Reviews", sub: c.reviews.rating + "★ · " + c.reviews.count + " total" };
      const won = leads.filter(l => l.status === "won").slice(0, 6);
      body = (
        <div className="adr-sec">
          <span className="adr-sec-t">Recent reviewers</span>
          <div className="col gap-2">
            {won.map(l => (
              <div key={l.id} className="adr-review">
                <div className="row between"><span className="adr-row-t">{l.name}</span><span style={{ color: "#FFC53D", fontSize: 12 }}>{"★★★★★"}</span></div>
                <p className="adr-review-t">"{l.reviewText}"</p>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      // revenue / bookings / roas → won jobs
      const won = leads.filter(l => l.status === "won");
      head = { title: c.name + " · " + (metric === "revenue" ? "Revenue" : metric === "bookings" ? "Jobs" : "Ad performance"), sub: metric === "revenue" ? adrMoney(c.revenue30) + " this month" : metric === "bookings" ? c.bookings30 + " booked" : (c.roas || 0).toFixed(1) + "× ROAS" };
      body = (
        <div className="adr-sec">
          <span className="adr-sec-t">Jobs won · tap to open</span>
          <div className="col gap-2">
            {won.map(l => (
              <button key={l.id} className="adr-row" onClick={() => setRecord(l)}>
                <span className="adr-av" style={{ background: "var(--lime)22", color: "var(--lime)" }}><Icon name="check" cls="ic-sm" /></span>
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}><span className="adr-row-t">{l.name}</span><span className="adr-row-d">{l.svc} · {l.ago}</span></div>
                <span className="num" style={{ color: "var(--lime)", fontWeight: 700 }}>{adrMoney(l.value)}</span>
                <Icon name="chevR" cls="ic-sm" />
              </button>
            ))}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="adr-overlay" onClick={onClose}>
      <div className="adr-sheet slide-in-r" onClick={e => e.stopPropagation()}>
        <div className="adr-head">
          {head.back ? (
            <button className="adr-back" onClick={() => setRecord(null)}><Icon name="chevL" cls="ic-sm" />Back</button>
          ) : (
            <div className="col" style={{ gap: 3, minWidth: 0 }}>
              <span className="adr-title" style={head.tone ? { color: head.tone } : {}}>{head.title}</span>
              <span className="adr-sub">{head.sub}</span>
            </div>
          )}
          <button className="adr-close" onClick={onClose}><Icon name="x" /></button>
        </div>
        <div className="adr-body">{body}</div>
        <div className="adr-foot"><span className="row gap-2"><span className="live-dot"></span>Live data · pulled from connected accounts</span></div>
      </div>
    </div>
  );
}

// admin record (lead deep view) — reuses portal timeline builder
function AdminRecord({ l }) {
  const SM = window.PORTAL_STATUS_META || {};
  const sm = SM[l.status] || { label: l.status, color: "var(--mute)", icon: "inbox" };
  const tl = window.buildPortalTimeline ? window.buildPortalTimeline(l, adrMoney) : [];
  return (
    <React.Fragment>
      <div className="adr-rec-hero">
        <span className="adr-rec-av" style={{ background: l.srcColor + "26", color: l.srcColor }}>{l.name[0]}</span>
        <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
          <span className="adr-rec-name">{l.name}</span>
          <span className="adr-row-d">{l.svc} · {l.area}</span>
        </div>
        <span className="adr-pill" style={{ color: sm.color, borderColor: sm.color + "66", background: sm.color + "14" }}>{sm.label}</span>
      </div>
      <div className="adr-readout">
        <a className="adr-ro-cell adr-link" href={"tel:" + l.phone.replace(/\s/g, "")}><span className="adr-ro-v" style={{ fontSize: 13 }}>{l.phone}</span><span className="adr-ro-l">Phone</span></a>
        <div className="adr-ro-cell"><span className="adr-ro-v" style={{ fontSize: 13, color: l.srcColor }}>{l.src}</span><span className="adr-ro-l">Source</span></div>
        <div className="adr-ro-cell"><span className="adr-ro-v">{adrMoney(l.value)}</span><span className="adr-ro-l">{l.status === "won" ? "Job value" : l.status === "lost" ? "Missed" : "Quote"}</span></div>
      </div>
      <div className="adr-sec">
        <span className="adr-sec-t">The enquiry</span>
        <div className="adr-quote">"{l.enquiry}"</div>
      </div>
      <div className="adr-sec">
        <span className="adr-sec-t">Full journey</span>
        <div className="adr-timeline">
          {tl.map((e, i) => (
            <div key={i} className="adr-tl-row">
              <div className="adr-tl-line"><span className="adr-tl-dot" style={{ background: e.c }}><Icon name={e.icon} cls="ic-sm" /></span>{i < tl.length - 1 && <span className="adr-tl-bar"></span>}</div>
              <div className="col" style={{ gap: 2, paddingBottom: 15, flex: 1 }}>
                <div className="row between"><span className="adr-row-t">{e.t}</span><span className="adr-row-d">{e.when}</span></div>
                <span className="adr-row-d">{e.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

window.AdminDrill = AdminDrill;
