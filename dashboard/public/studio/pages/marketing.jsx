// Marketing — portfolio-wide campaign performance + content calendar.

function Marketing({ go }) {
  const D = window.BIZBOOST_DATA;
  const withAds = D.clients.filter(c => c.adSpend > 0);
  const totalSpend = withAds.reduce((a, c) => a + c.adSpend, 0);
  const totalLeads = withAds.reduce((a, c) => a + c.leads30, 0);
  const avgRoas = (withAds.reduce((a, c) => a + c.roas, 0) / withAds.length).toFixed(1);

  const roasBars = [...withAds].sort((a, b) => b.roas - a.roas).map(c => ({
    label: c.name.split(" ")[0], value: c.roas, color: c.roas >= 5 ? "var(--lime)" : c.roas >= 3.5 ? "var(--amber)" : "var(--red)", avatar: true, ...c
  }));

  const spendBars = [...withAds].sort((a, b) => b.adSpend - a.adSpend).slice(0, 6).map(c => ({
    l: c.name.split(" ")[0], v: c.adSpend, color: c.color
  }));

  // content calendar grid (week)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const content = {
    Mon: [{ c: "coastal-roofing", t: "Reel" }, { c: "kelly-detailing", t: "TikTok" }],
    Tue: [{ c: "murphy-plumbing", t: "Google post" }],
    Wed: [{ c: "atlantic-dental", t: "Carousel" }, { c: "riverside-cafe", t: "Story" }],
    Thu: [{ c: "kelly-detailing", t: "Reel" }, { c: "riverside-cafe", t: "Reel" }],
    Fri: [{ c: "osullivan-electrical", t: "Email" }],
    Sat: [{ c: "burke-landscaping", t: "Review post" }],
    Sun: []
  };

  return (
    <div className="col gap-4" style={{ maxWidth: 1180, margin: "0 auto", paddingBottom: 60 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="col gap-2">
          <div className="eyebrow">Across {withAds.length} advertising accounts</div>
          <div className="h-display" style={{ fontSize: 38 }}>Marketing</div>
        </div>
        <button className="btn btn-primary"><Icon name="plus" cls="ic-sm" />Launch campaign</button>
      </div>

      {/* top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <div className="panel" style={{ padding: "16px 18px" }}><div className="eyebrow" style={{ marginBottom: 8 }}>Ad spend · 30d</div><div className="num" style={{ font: "600 26px var(--sans)" }}>{fmtMoney(totalSpend)}</div></div>
        <div className="panel" style={{ padding: "16px 18px" }}><div className="eyebrow" style={{ marginBottom: 8 }}>Leads from ads</div><div className="num" style={{ font: "600 26px var(--sans)", color: "var(--teal)" }}>{totalLeads}</div></div>
        <div className="panel" style={{ padding: "16px 18px" }}><div className="eyebrow" style={{ marginBottom: 8 }}>Blended ROAS</div><div className="num" style={{ font: "600 26px var(--sans)", color: "var(--lime)" }}>{avgRoas}x</div></div>
        <div className="panel" style={{ padding: "16px 18px" }}><div className="eyebrow" style={{ marginBottom: 8 }}>Cost / lead</div><div className="num" style={{ font: "600 26px var(--sans)" }}>€{Math.round(totalSpend / totalLeads)}</div></div>
      </div>

      <div className="row gap-4 stretch" style={{ alignItems: "flex-start" }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="ROAS by client" sub="Return on ad spend · ranked" />
          <HBars items={roasBars} valueFmt={v => v.toFixed(1) + "x"} />
        </div>
        <div className="panel" style={{ padding: 18, width: 360, flexShrink: 0 }}>
          <PanelHead title="Spend distribution" />
          <BarChart data={spendBars} h={170} valueFmt={v => "€" + v} />
        </div>
      </div>

      {/* content calendar */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Content calendar" sub="Scheduled across all accounts · this week" action={<button className="btn btn-ghost" style={{ height: 28 }}><Icon name="calendar" cls="ic-sm" />Full calendar</button>} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
          {days.map(d => (
            <div key={d} className="col gap-2">
              <div className="row between" style={{ paddingBottom: 6, borderBottom: "1px solid var(--line)" }}>
                <span style={{ font: "600 11px var(--sans)", color: "var(--mute)" }}>{d}</span>
                {content[d].length > 0 && <span className="chip chip-dim" style={{ height: 16, padding: "0 5px", fontSize: 9 }}>{content[d].length}</span>}
              </div>
              <div className="col gap-2" style={{ minHeight: 90 }}>
                {content[d].map((item, i) => {
                  const cl = getClient(item.c);
                  return (
                    <div key={i} className="col gap-2" style={{ padding: "7px 8px", borderRadius: 8, background: "var(--bg-2)", border: "1px solid var(--line)", borderLeft: "2px solid " + cl.color }}>
                      <span style={{ fontSize: 10.5, color: "var(--ink-2)", fontWeight: 600 }}>{item.t}</span>
                      <span style={{ fontSize: 9.5, color: "var(--mute)" }} className="truncate">{cl.name.split(" ")[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Marketing = Marketing;
