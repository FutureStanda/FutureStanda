// Per-client automations tab — which chains run for THIS business, live + recent fires.

function ClientAutomationsTab({ c }) {
  const store = useAutomations();
  const seedDet = portalSeedDet(c.id + "auto");
  // ONLY this client's own automations (built specifically for them)
  const base = store.chains().filter(ch => ch.client === c.id);
  const [runs] = useState(() => { const m = {}; base.forEach(ch => m[ch.id] = 4 + Math.floor(seedDet() * 60)); return m; });
  const [detail, setDetail] = useState(null); // chain id opened
  const [builder, setBuilder] = useState(null);
  const [creating, setCreating] = useState(false);
  const chains = base.map(ch => ({ ...ch, runs: runs[ch.id] != null ? runs[ch.id] : ch.runs }));
  const detailChain = detail ? chains.find(ch => ch.id === detail) : null;

  function toggle(id) { store.toggle(id); }

  const live = chains.filter(ch => ch.enabled).length;
  const fires = buildClientFires(c, chains.filter(ch => ch.enabled));

  return (
    <div className="col gap-4 fadeup">
      {detailChain && <ChainDetail c={detailChain} store={store} onClose={() => setDetail(null)} onToggle={() => store.toggle(detailChain.id)} onDelete={() => { store.remove(detailChain.id); setDetail(null); }} onBuild={() => { setBuilder(detailChain.id); setDetail(null); }} />}
      {builder && <AutomationCanvas c={chains.find(x => x.id === builder)} store={store} onClose={() => setBuilder(null)} />}
      {creating && <BuildWithClaude store={store} client={c.id} clientName={c.name} onClose={() => setCreating(false)} onBuilt={(id) => { setCreating(false); setBuilder(id); }} onManual={() => setCreating(false)} />}
      {/* header band */}
      <div className="panel" style={{ padding: 18, background: "linear-gradient(120deg,#11140e,transparent 60%)", borderColor: "#cfff3a2e" }}>
        <div className="row between" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="row gap-3">
            <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", flexShrink: 0, boxShadow: "var(--lime-glow)" }}><Icon name="refresh" /></span>
            <div className="col" style={{ gap: 2 }}>
              <span className="row gap-2" style={{ font: "600 15px var(--sans)" }}>Automations for {c.name.split(" ")[0]}<span className="live-dot"></span></span>
              <span style={{ fontSize: 12.5, color: "var(--mute)" }}>{live} running · tap any to configure & hook up</span>
            </div>
          </div>
          <div className="row gap-4" style={{ alignItems: "center" }}>
            <div className="col" style={{ alignItems: "flex-end", gap: 1 }}>
              <span className="num" style={{ font: "700 22px var(--sans)", color: "#fff" }}>{chains.reduce((a, ch) => a + (ch.enabled ? ch.runs : 0), 0)}</span>
              <span style={{ fontSize: 10.5, color: "var(--mute)" }}>actions this month</span>
            </div>
            <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ height: 36 }}><Icon name="plus" cls="ic-sm" />New automation</button>
          </div>
        </div>
      </div>

      {chains.length === 0 && (
        <div className="panel" style={{ padding: 36, textAlign: "center" }}>
          <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--lime)", display: "grid", placeItems: "center", margin: "0 auto 12px" }}><Icon name="refresh" /></span>
          <div style={{ font: "600 15px var(--sans)", marginBottom: 4 }}>No automations for {c.name.split(" ")[0]} yet</div>
          <p style={{ fontSize: 13, color: "var(--mute)", maxWidth: 360, margin: "0 auto 14px", lineHeight: 1.5 }}>Automations are built specifically for each client. Describe what you want and Claude builds it for {c.name.split(" ")[0]}.</p>
          <button onClick={() => setCreating(true)} className="btn btn-primary" style={{ height: 38, margin: "0 auto" }}><Icon name="sparkle" cls="ic-sm" />Build one with Claude</button>
        </div>
      )}

      {chains.length > 0 && (
      <div className="row gap-4 stretch" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* chains */}
        <div className="col gap-2" style={{ flex: "1 1 380px", minWidth: 0 }}>
          <span className="eyebrow" style={{ margin: 0 }}>Running for this client</span>
          {chains.map(ch => (
            <div key={ch.id} onClick={() => setDetail(ch.id)} className="panel auto-card" style={{ padding: 14, opacity: ch.enabled ? 1 : 0.6, transition: "opacity .2s, border-color .2s, transform .15s", cursor: "pointer" }}>
              <div className="row between">
                <div className="row gap-3" style={{ minWidth: 0 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, background: ch.accent + "1f", color: ch.accent, border: "1px solid " + ch.accent + "44", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name={ch.icon} cls="ic-sm" /></span>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <span style={{ font: "600 13px var(--sans)", color: "#fff" }}>{ch.name}</span>
                    <span className="row gap-2" style={{ fontSize: 11, color: "var(--mute)", flexWrap: "wrap" }}>
                      <span className="chip" style={{ height: 18, fontSize: 9.5, background: "var(--bg-2)", borderColor: "var(--line-2)", color: "var(--ink-2)" }}>{ch.trigger}</span>
                      <Icon name="arrowR" cls="ic-sm" />{ch.action}
                    </span>
                  </div>
                </div>
                <AutoToggle on={ch.enabled} onClick={(e) => { e.stopPropagation(); toggle(ch.id); }} />
              </div>
              <div className="row between" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <span className="row gap-2" style={{ fontSize: 11, color: ch.enabled ? "var(--mute)" : "var(--mute-2)" }}>
                  {ch.enabled ? <React.Fragment><span className="live-dot" style={{ background: ch.accent }}></span>Active · tap to configure</React.Fragment> : <React.Fragment><Icon name="pause" cls="ic-sm" />Paused</React.Fragment>}
                </span>
                <span className="num" style={{ fontSize: 11, color: "var(--mute-2)" }}>{ch.runs} runs this month</span>
              </div>
            </div>
          ))}
        </div>

        {/* live fire log */}
        <div className="panel" style={{ flex: "1 1 320px", minWidth: 0, padding: 18 }}>
          <PanelHead title="Recent activity" sub="Every action, logged" action={<span className="chip chip-lime"><span className="live-dot"></span>live</span>} />
          <div className="col" style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 1, background: "var(--line)" }}></div>
            {fires.map((f, i) => (
              <div key={i} className="row gap-3" style={{ padding: "8px 0", position: "relative" }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "var(--bg-2)", border: "1px solid var(--line)", color: f.color, zIndex: 1 }}><Icon name={f.icon} cls="ic-sm" /></span>
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.4 }}>{f.text}</span>
                  <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>{f.chain} · {f.ago}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

function AutoToggle({ on, onClick }) {
  return (
    <button onClick={onClick} style={{ width: 40, height: 23, borderRadius: 999, border: "none", cursor: "pointer", padding: 2, flexShrink: 0, background: on ? "var(--lime)" : "var(--bg-3)", transition: "background .2s" }}>
      <span style={{ display: "block", width: 19, height: 19, borderRadius: 999, background: on ? "#0a0a0a" : "var(--mute)", transform: on ? "translateX(17px)" : "translateX(0)", transition: "transform .2s" }}></span>
    </button>
  );
}

function portalSeedDet(str) {
  let h = 9; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0;
  return () => { h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0; h = Math.imul(h ^ (h >>> 13), 0x297a2d39) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
}

function buildClientFires(c, activeChains) {
  const rnd = portalSeedDet(c.id + "fires");
  const first = (window.PORTAL_NAMES || ["Sarah", "Mark", "Emma", "Liam", "John"]);
  const pickName = () => { const n = first[Math.floor(rnd() * first.length)]; return (n || "Sarah O'Brien").split(" ")[0]; };
  const templates = {
    "lead-pipeline": () => ({ icon: "inbox", color: "var(--teal)", text: `New lead from ${pickName()} added to pipeline & scored ${60 + Math.floor(rnd() * 39)}/100` }),
    "missed-call": () => ({ icon: "phoneMissed", color: "var(--amber)", text: `Missed call auto-texted back — ${pickName()} replied in 2 min` }),
    "review-engine": () => ({ icon: "star", color: "var(--lime)", text: `New 5★ from ${pickName()} reshaped & posted to socials` }),
    "booking-confirm": () => ({ icon: "calendar", color: "var(--blue)", text: `Booking confirmed for ${pickName()} — added to calendar` }),
    "weekly-report": () => ({ icon: "trend", color: "var(--violet)", text: `Weekly report generated & sent to ${c.owner}` }),
    "churn-watch": () => ({ icon: "shield", color: "var(--amber)", text: `Health check passed — account stable` }),
    "content-batch": () => ({ icon: "megaphone", color: "var(--teal)", text: `4 posts drafted & scheduled for the week` }),
    "stale-lead": () => ({ icon: "flame", color: "var(--red)", text: `Re-engaged ${pickName()} after 48h silence` })
  };
  const agos = ["2m ago", "14m ago", "38m ago", "1h ago", "2h ago", "3h ago", "5h ago", "yesterday", "yesterday", "2d ago"];
  const out = [];
  let ai = 0;
  for (let i = 0; i < 9; i++) {
    const ch = activeChains[Math.floor(rnd() * activeChains.length)];
    if (!ch || !templates[ch.id]) continue;
    const t = templates[ch.id]();
    out.push({ ...t, chain: ch.name, ago: agos[Math.min(ai++, agos.length - 1)] });
  }
  return out.length ? out : [{ icon: "refresh", color: "var(--mute)", text: "No automations running yet — switch some on.", chain: "—", ago: "" }];
}

window.ClientAutomationsTab = ClientAutomationsTab;
