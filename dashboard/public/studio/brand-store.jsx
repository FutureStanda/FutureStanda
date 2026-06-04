// Per-client brand accent — persisted override, applied on load. Tucked-away control.
(function () {
  const KEY = "bb_client_brand_v1";
  const listeners = new Set();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { saved = {}; }

  // apply saved overrides onto the in-memory client data at boot
  function apply() {
    const D = window.BIZBOOST_DATA;
    if (!D || !D.clients) return;
    D.clients.forEach(c => { if (saved[c.id]) c.color = saved[c.id]; });
  }
  apply();

  const Store = {
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    get(id) { const c = (window.BIZBOOST_DATA.clients || []).find(x => x.id === id); return c ? c.color : "var(--lime)"; },
    set(id, color) {
      saved[id] = color;
      localStorage.setItem(KEY, JSON.stringify(saved));
      const c = (window.BIZBOOST_DATA.clients || []).find(x => x.id === id);
      if (c) c.color = color;
      listeners.forEach(fn => fn());
    }
  };
  function useBrand() {
    const [, f] = React.useReducer(x => x + 1, 0);
    React.useEffect(() => Store.subscribe(f), []);
    return Store;
  }
  window.BrandStore = Store;
  window.useBrand = useBrand;
})();

// Palette of tasteful brand accents
const BRAND_SWATCHES = [
  "#CFFF3A", "#3FE0A8", "#5BCEFA", "#8B7CFF", "#FF7A8A", "#FFB547",
  "#4FE3C1", "#FFD66B", "#FF6B5C", "#E1306C", "#34A853", "#FF8A5B"
];

// Small tucked-away brand colour control (popover).
function BrandControl({ clientId }) {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("");
  const current = brand.get(clientId);
  const isHex = v => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Brand colour" className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line-2)", background: "var(--bg-2)", cursor: "pointer", display: "grid", placeItems: "center" }}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: current, border: "1px solid #0003" }}></span>
      </button>
      {open && (
        <React.Fragment>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }}></div>
          <div className="panel" style={{ position: "absolute", top: 36, right: 0, zIndex: 61, width: 220, padding: 14, background: "var(--elev)", border: "1px solid var(--line-2)", boxShadow: "0 16px 50px #000a" }}>
            <span className="eyebrow" style={{ margin: "0 0 10px", display: "block" }}>Brand colour</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 7, marginBottom: 12 }}>
              {BRAND_SWATCHES.map(sw => (
                <button key={sw} onClick={() => brand.set(clientId, sw)} style={{ width: 24, height: 24, borderRadius: 7, background: sw, cursor: "pointer", border: "2px solid " + (current.toLowerCase() === sw.toLowerCase() ? "#fff" : "transparent"), boxShadow: current.toLowerCase() === sw.toLowerCase() ? "0 0 0 1px " + sw : "none" }}></button>
              ))}
            </div>
            <div className="row gap-2">
              <input value={hex} onChange={e => setHex(e.target.value)} placeholder={current} onKeyDown={e => { if (e.key === "Enter" && isHex(hex)) { brand.set(clientId, hex); setHex(""); } }}
                style={{ flex: 1, minWidth: 0, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink)", font: "400 12px var(--mono)", padding: "8px 10px", outline: "none" }} />
              <button onClick={() => { if (isHex(hex)) { brand.set(clientId, hex); setHex(""); } }} disabled={!isHex(hex)} className="btn btn-primary" style={{ height: 32, opacity: isHex(hex) ? 1 : 0.45, cursor: isHex(hex) ? "pointer" : "not-allowed" }}><Icon name="check" cls="ic-sm" /></button>
            </div>
            <span style={{ fontSize: 10, color: "var(--mute-2)", marginTop: 8, display: "block", lineHeight: 1.4 }}>Used across this client's dashboard & their portal.</span>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

window.BrandControl = BrandControl;
