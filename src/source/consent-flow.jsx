// OAuth consent flow — a realistic provider sign-in + permission-grant simulation.
// Prototype only: nothing real connects. It mirrors the real OAuth handshake so it
// demos like the live product AND documents the exact scopes a build will request.

function providerMark(item, size) {
  return (
    <span style={{ width: size, height: size, borderRadius: size * 0.28, display: "grid", placeItems: "center",
      background: item.color + "22", color: item.color, border: "1px solid " + item.color + "44",
      font: "700 " + (size * 0.46) + "px var(--sans)", flexShrink: 0 }}>{item.icon}</span>
  );
}

function ConsentFlow({ item, clientName, onClose, onApproved }) {
  // stages: signin -> consent -> connecting -> done
  const [stage, setStage] = useState(item.flow === "oauth" ? "signin" : item.flow === "qr" ? "qr" : "consent");
  const provider = item.provider || "Provider";

  useEffect(() => {
    if (stage === "connecting") {
      const t = setTimeout(() => setStage("done"), 1500);
      return () => clearTimeout(t);
    }
    if (stage === "done") {
      const t = setTimeout(() => { onApproved(); }, 950);
      return () => clearTimeout(t);
    }
  }, [stage]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 140, background: "#03040588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{
        width: 420, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 90px #000c",
        fontFamily: "var(--sans)", color: "#1a1a1a"
      }}>
        {/* provider chrome — mimics an OAuth popup */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f3f4f2", borderBottom: "1px solid #e3e5e1" }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#ff5f57" }}></span>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#febc2e" }}></span>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: "#28c840" }}></span>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e3e5e1", borderRadius: 999, padding: "3px 12px", fontSize: 11, color: "#5f6368" }}>
              <span style={{ color: "#28a745" }}>🔒</span>{(provider.split(" ")[0] || "auth").toLowerCase()}.com/oauth
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9aa0a6", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "28px 28px 24px" }}>
          {stage === "signin" && <SignIn item={item} provider={provider} onNext={() => setStage("consent")} />}
          {stage === "consent" && <Consent item={item} provider={provider} clientName={clientName} onAllow={() => setStage("connecting")} onCancel={onClose} />}
          {stage === "qr" && <QrLink item={item} onNext={() => setStage("connecting")} />}
          {stage === "connecting" && <Connecting item={item} />}
          {stage === "done" && <Done item={item} />}
        </div>
      </div>
    </div>
  );
}

function SignIn({ item, provider, onNext }) {
  const [email, setEmail] = useState("");
  const short = provider.split(" ")[0];
  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 20 }}>
        {providerMark(item, 44)}
        <div style={{ fontSize: 19, fontWeight: 600, marginTop: 14 }}>Sign in to {short}</div>
        <div style={{ fontSize: 13, color: "#5f6368", marginTop: 4 }}>to continue to <b style={{ color: "#1a1a1a" }}>BizBoost</b></div>
      </div>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email or phone" autoFocus
        style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #c9ccc6", fontSize: 14, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
      <input type="password" placeholder="Password" defaultValue="••••••••••"
        style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #c9ccc6", fontSize: 14, outline: "none", marginBottom: 18, boxSizing: "border-box" }} />
      <button onClick={onNext} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", background: item.color, color: "#fff", fontSize: 14, fontWeight: 600 }}>
        Continue
      </button>
      <div style={{ fontSize: 11, color: "#9aa0a6", textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
        This is a BizBoost prototype — no real {short} login happens. It mirrors the real OAuth screen.
      </div>
    </div>
  );
}

function Consent({ item, provider, clientName, onAllow, onCancel }) {
  const short = provider.split(" ")[0];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        {providerMark(item, 40)}
        <span style={{ color: "#c9ccc6", fontSize: 18 }}>→</span>
        <span style={{ width: 40, height: 40, borderRadius: 11, background: "#0A0B0A", color: "#CFFF3A", display: "grid", placeItems: "center", fontWeight: 700, fontSize: 18 }}>⚡</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>BizBoost wants to access your {item.account}</div>
      <div style={{ fontSize: 13, color: "#5f6368", marginBottom: 16, lineHeight: 1.5 }}>
        For <b style={{ color: "#1a1a1a" }}>{clientName || "your business"}</b>. BizBoost will be able to:
      </div>
      <div style={{ border: "1px solid #e3e5e1", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
        {item.grants.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 13px", borderBottom: i < item.grants.length - 1 ? "1px solid #eef0ec" : "none" }}>
            <span style={{ color: item.color, fontSize: 14, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 13, color: "#3c4043" }}>{g}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: 8, border: "1px solid #c9ccc6", cursor: "pointer", background: "#fff", color: "#3c4043", fontSize: 14, fontWeight: 500 }}>Cancel</button>
        <button onClick={onAllow} style={{ flex: 2, padding: "11px", borderRadius: 8, border: "none", cursor: "pointer", background: item.color, color: "#fff", fontSize: 14, fontWeight: 600 }}>Allow access</button>
      </div>
      <div style={{ fontSize: 11, color: "#9aa0a6", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
        Real scopes requested: <span style={{ fontFamily: "var(--mono)", color: "#5f6368" }}>{item.apiScopes.slice(0, 2).join(", ")}{item.apiScopes.length > 2 ? "…" : ""}</span>
      </div>
    </div>
  );
}

function QrLink({ item, onNext }) {
  // fake QR grid
  const cells = [];
  const seed = item.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 121; i++) { const on = ((i * 7 + seed) % 3 === 0) || ((i * 13 + seed) % 5 === 0); cells.push(on); }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
        {providerMark(item, 40)}
        <div style={{ fontSize: 17, fontWeight: 600, marginTop: 12 }}>Link {item.name}</div>
        <div style={{ fontSize: 13, color: "#5f6368", marginTop: 4 }}>Scan from WhatsApp → Linked Devices</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(11,1fr)", width: 176, height: 176, margin: "0 auto 18px", padding: 10, background: "#fff", border: "1px solid #e3e5e1", borderRadius: 12, gap: 2 }}>
        {cells.map((on, i) => <span key={i} style={{ background: on ? "#111" : "transparent", borderRadius: 1 }}></span>)}
      </div>
      <button onClick={onNext} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", cursor: "pointer", background: item.color, color: "#fff", fontSize: 14, fontWeight: 600 }}>
        Simulate scan →
      </button>
      <div style={{ fontSize: 11, color: "#9aa0a6", marginTop: 14, lineHeight: 1.5 }}>Prototype — tapping simulates a successful device link.</div>
    </div>
  );
}

function Connecting({ item }) {
  return (
    <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
      <div style={{ width: 46, height: 46, margin: "0 auto 18px", border: "3px solid #e3e5e1", borderTopColor: item.color, borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Establishing secure connection…</div>
      <div style={{ fontSize: 12.5, color: "#5f6368", marginTop: 6 }}>Exchanging token with {item.provider}</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function Done({ item }) {
  return (
    <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
      <div style={{ width: 50, height: 50, margin: "0 auto 16px", borderRadius: "50%", background: item.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 26 }}>✓</div>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{item.name} connected</div>
      <div style={{ fontSize: 12.5, color: "#5f6368", marginTop: 6 }}>Token stored · syncing data to the dashboard</div>
    </div>
  );
}

window.ConsentFlow = ConsentFlow;
