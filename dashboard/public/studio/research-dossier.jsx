// Research dossier — the deep-mode agent output for a lead.

function ResearchRunning({ lead }) {
  const steps = [
    "Scraping Google profile & reviews",
    "Auditing website speed & booking flow",
    "Pulling competitors in " + (lead.area || "the area"),
    "Scanning Meta Ad Library — local + US niche",
    "Mapping gap from current → goal",
    "Drafting the speed-to-results plan"
  ];
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN(x => (x < steps.length ? x + 1 : x)), 700);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="panel" style={{ padding: 24, borderColor: "#8b7cff44", background: "linear-gradient(135deg, #14111f, transparent 60%)" }}>
      <div className="row gap-3" style={{ marginBottom: 18 }}>
        <span style={{ width: 38, height: 38, borderRadius: 11, background: "#8B7CFF", color: "#0a0a0a", display: "grid", placeItems: "center" }}>
          <Icon name="sparkle" cls="ic-lg" />
        </span>
        <div className="col" style={{ gap: 2 }}>
          <span className="row gap-2" style={{ font: "600 15px var(--sans)" }}>Research agent working<span className="live-dot" style={{ background: "#8B7CFF" }}></span></span>
          <span style={{ fontSize: 12, color: "var(--mute)" }}>Deep mode · scanning every angle to scale {lead.business}</span>
        </div>
      </div>
      <div className="col gap-2">
        {steps.map((s, i) => {
          const done = i < n, active = i === n;
          return (
            <div key={i} className="row gap-3" style={{ padding: "9px 12px", borderRadius: 10, background: done || active ? "var(--bg-2)" : "transparent", opacity: done || active ? 1 : 0.4, transition: "all .3s" }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "grid", placeItems: "center", background: done ? "#8B7CFF" : "var(--bg-3)", color: "#0a0a0a" }}>
                {done ? <Icon name="check" cls="ic-sm" /> : active ? <span className="live-dot" style={{ background: "#8B7CFF", width: 6, height: 6 }}></span> : null}
              </span>
              <span style={{ fontSize: 12.5, color: done ? "var(--ink-2)" : active ? "var(--ink)" : "var(--mute)" }}>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dossier({ lead }) {
  const R = window.BIZBOOST_LEADS.researchSample;
  // use the sample for any 'complete' lead (demo)
  const r = R;
  const impactChip = i => i === "High" ? "chip-lime" : i === "Medium" ? "chip-amber" : "chip-dim";
  const threatColor = t => t === "high" ? "var(--red)" : t === "med" ? "var(--amber)" : "var(--mute)";

  return (
    <div className="col gap-4">
      {/* summary banner */}
      <div className="panel" style={{ padding: 20, borderColor: "#8b7cff3a", background: "linear-gradient(135deg, #14111f, transparent 55%)" }}>
        <div className="row between" style={{ marginBottom: 14 }}>
          <div className="row gap-2">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "#8B7CFF", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="sparkle" cls="ic-sm" /></span>
            <span style={{ font: "600 14px var(--sans)" }}>Research dossier</span>
            <span className="chip chip-lime"><Icon name="check" cls="ic-sm" />Complete</span>
          </div>
          <div className="row gap-3" style={{ fontSize: 11, color: "var(--mute)" }}>
            <span className="row gap-2"><Icon name="clock" cls="ic-sm" />{r.runtime}</span>
            <span className="row gap-2"><Icon name="layers" cls="ic-sm" />{r.sources} sources</span>
            <span className="chip chip-violet">{r.confidence} confidence</span>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, margin: 0 }}>{r.summary}</p>
      </div>

      {/* gap */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Where they are → where they want to go" />
        <div className="row gap-3" style={{ alignItems: "stretch" }}>
          <div className="col gap-2 flex-1" style={{ padding: 14, borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            <span className="eyebrow" style={{ color: "var(--red)" }}>Now</span>
            <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{r.gap.from}</span>
          </div>
          <div className="col" style={{ justifyContent: "center", color: "var(--lime)" }}><Icon name="arrowR" cls="ic-lg" /></div>
          <div className="col gap-2 flex-1" style={{ padding: 14, borderRadius: 12, background: "#cfff3a12", border: "1px solid #cfff3a3a" }}>
            <span className="eyebrow" style={{ color: "var(--lime)" }}>Goal</span>
            <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.5 }}>{r.gap.to}</span>
          </div>
        </div>
      </div>

      {/* opportunities */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Opportunities to scale" sub="Ranked by impact ÷ effort" />
        <div className="col gap-2">
          {r.opportunities.map(o => (
            <div key={o.rank} className="row gap-3" style={{ padding: 14, borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)", alignItems: "flex-start" }}>
              <span className="num" style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--lime)", color: "#0a0a0a", fontWeight: 700, fontSize: 13 }}>{o.rank}</span>
              <div className="col gap-2" style={{ flex: 1, minWidth: 0 }}>
                <div className="row between" style={{ alignItems: "flex-start", gap: 10 }}>
                  <span style={{ font: "600 13.5px var(--sans)", color: "var(--ink)" }}>{o.title}</span>
                  <span className="chip chip-lime" style={{ flexShrink: 0 }}>{o.metric}</span>
                </div>
                <span style={{ fontSize: 12, color: "var(--mute)", lineHeight: 1.5 }}>{o.detail}</span>
                <div className="row gap-2">
                  <span className={"chip " + impactChip(o.impact)}>Impact: {o.impact}</span>
                  <span className="chip chip-dim">Effort: {o.effort}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* competitors + ad library */}
      <div className="row gap-4 stretch" style={{ alignItems: "flex-start" }}>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Competitor scan" sub={"Who they're up against"} />
          <div className="col gap-2">
            {r.competitors.map((c, i) => (
              <div key={i} className="row gap-3" style={{ padding: "11px 12px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 3, background: threatColor(c.threat), flexShrink: 0, marginTop: 5 }}></span>
                <div className="col" style={{ gap: 2, flex: 1 }}>
                  <span style={{ font: "600 12.5px var(--sans)" }}>{c.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--mute)" }}>{c.note}</span>
                </div>
                <span className="chip chip-dim" style={{ flexShrink: 0, color: threatColor(c.threat) }}>{c.threat} threat</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel flex-1" style={{ padding: 18 }}>
          <PanelHead title="Meta Ad Library plays" sub="What's winning in bigger markets" />
          <div className="col gap-2">
            {r.adLibrary.map((a, i) => (
              <div key={i} className="col gap-2" style={{ padding: "11px 12px", borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
                <div className="row between">
                  <span className="chip chip-violet">{a.market}</span>
                  <Icon name="arrowUpR" cls="ic-sm" />
                </div>
                <span style={{ font: "600 12.5px var(--sans)", color: "var(--ink)", lineHeight: 1.4 }}>{a.play}</span>
                <span style={{ fontSize: 11, color: "var(--mute)", lineHeight: 1.45 }}>{a.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* roadmap */}
      <div className="panel" style={{ padding: 18 }}>
        <PanelHead title="Speed-to-results roadmap" sub="From signed to scaling" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {r.roadmap.map((p, i) => (
            <div key={i} className="col gap-3" style={{ padding: 14, borderRadius: 12, background: "var(--bg-2)", border: "1px solid var(--line)", borderTop: "2px solid var(--lime)" }}>
              <div className="col gap-1">
                <span className="eyebrow" style={{ color: "var(--lime)" }}>{p.phase}</span>
                <span style={{ font: "600 13px var(--sans)" }}>{p.title}</span>
              </div>
              <div className="col gap-2">
                {p.items.map((it, j) => (
                  <div key={j} className="row gap-2" style={{ alignItems: "flex-start" }}>
                    <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--lime)", marginTop: 6, flexShrink: 0 }}></span>
                    <span style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{it}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row gap-2">
        <button className="btn btn-primary"><Icon name="doc" cls="ic-sm" />Build proposal from this</button>
        <button className="btn"><Icon name="download" cls="ic-sm" />Export dossier</button>
        <button className="btn"><Icon name="refresh" cls="ic-sm" />Re-run research</button>
      </div>
    </div>
  );
}

Object.assign(window, { ResearchRunning, Dossier });
