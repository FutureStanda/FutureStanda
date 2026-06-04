// Admin-side connection (you paste the client's API keys) + Payment terminal (POS card / link).
// Prototype only — nothing real is charged or stored. Mirrors the real fields for build spec.

// ---------- shared dark modal shell ----------
function DarkModal({ width = 460, accent = "var(--lime)", onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 140, background: "#03040588", backdropFilter: "blur(7px)", display: "grid", placeItems: "center" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{
        width, maxHeight: "88vh", background: "var(--elev)", border: "1px solid var(--line-2)",
        borderRadius: 18, boxShadow: "0 30px 90px #000c", overflow: "hidden", display: "flex", flexDirection: "column"
      }}>{children}</div>
    </div>
  );
}

function Field({ f, value, onChange }) {
  const base = {
    width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9,
    color: "var(--ink)", font: "400 12.5px var(--mono)", padding: "10px 12px", outline: "none", boxSizing: "border-box"
  };
  const onFocus = e => e.target.style.borderColor = "#cfff3a66";
  const onBlur = e => e.target.style.borderColor = "var(--line)";
  return (
    <div className="col" style={{ gap: 5 }}>
      <label style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 500 }}>{f.label}{f.secret && <span style={{ color: "var(--mute-2)" }}> · encrypted</span>}</label>
      {f.area ? (
        <textarea value={value || ""} onChange={e => onChange(f.key, e.target.value)} placeholder={f.ph} onFocus={onFocus} onBlur={onBlur} rows={2} style={{ ...base, resize: "vertical", minHeight: 48, lineHeight: 1.4 }} />
      ) : (
        <input type={f.secret ? "password" : "text"} value={value || ""} onChange={e => onChange(f.key, e.target.value)} placeholder={f.ph} onFocus={onFocus} onBlur={onBlur} style={base} />
      )}
    </div>
  );
}

// ---------- Admin connect (paste keys yourself) ----------
function AdminConnect({ item, clientName, onClose, onApproved }) {
  const O = window.BIZBOOST_ONBOARD;
  const cfg = (O.adminCredentials || {})[item.id] || { note: "Enter the access details for this account.", fields: [{ key: "key", label: "API key / token", ph: "••••••••", secret: true }] };
  const [form, setForm] = useState({});
  const [stage, setStage] = useState("form"); // form | verifying | done
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (stage === "verifying") { const t = setTimeout(() => setStage("done"), 1400); return () => clearTimeout(t); }
    if (stage === "done") { const t = setTimeout(() => onApproved(), 900); return () => clearTimeout(t); }
  }, [stage]);

  return (
    <DarkModal width={440} onClose={onClose}>
      <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-3">
          <span style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: item.color + "22", color: item.color, font: "700 14px var(--sans)", border: "1px solid " + item.color + "33" }}>{item.icon}</span>
          <div className="col" style={{ gap: 1 }}>
            <span style={{ font: "600 13.5px var(--sans)" }}>Connect {item.name} yourself</span>
            <span style={{ fontSize: 10.5, color: "var(--mute)" }}>You own & manage this connection</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>
      </div>

      {stage === "form" && (
        <React.Fragment>
          <div style={{ overflowY: "auto", padding: 20 }}>
            <div className="panel" style={{ padding: "10px 12px", marginBottom: 16, background: "var(--bg-2)" }}>
              <span className="row gap-2" style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.45 }}><Icon name="shield" cls="ic-sm" />{cfg.note}</span>
            </div>
            <div className="col gap-3">
              {cfg.fields.map(f => <Field key={f.key} f={f} value={form[f.key]} onChange={set} />)}
            </div>
            <div className="row gap-2" style={{ marginTop: 14, padding: "9px 11px", borderRadius: 9, background: "#cfff3a0c", border: "1px solid #cfff3a26" }}>
              <Icon name="link" cls="ic-sm" />
              <span style={{ fontSize: 10.5, color: "var(--mute)", lineHeight: 1.4 }}>Scopes this grants: <span className="mono" style={{ color: "var(--ink-2)" }}>{(item.apiScopes || []).slice(0, 2).join(", ")}{(item.apiScopes || []).length > 2 ? "…" : ""}</span></span>
            </div>
          </div>
          <div className="row between" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", background: "var(--bg-1)" }}>
            <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>Prototype — keys aren't stored</span>
            <button onClick={() => setStage("verifying")} className="btn btn-primary"><Icon name="check" cls="ic-sm" />Save & connect</button>
          </div>
        </React.Fragment>
      )}
      {stage === "verifying" && (
        <div style={{ padding: "34px 20px", textAlign: "center" }}>
          <div style={{ width: 42, height: 42, margin: "0 auto 16px", border: "3px solid var(--line)", borderTopColor: item.color, borderRadius: "50%", animation: "spin .8s linear infinite" }}></div>
          <div style={{ font: "600 14px var(--sans)" }}>Verifying credentials…</div>
          <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 5 }}>Testing access to {item.provider}</div>
          <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
        </div>
      )}
      {stage === "done" && (
        <div style={{ padding: "30px 20px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, margin: "0 auto 14px", borderRadius: "50%", background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="check" cls="ic-lg" /></div>
          <div style={{ font: "600 15px var(--sans)" }}>{item.name} connected</div>
          <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 5 }}>Managed by you · syncing data now</div>
        </div>
      )}
    </DarkModal>
  );
}

// ---------- Payment terminal: POS card OR payment link ----------
function fmtCard(v) { return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(); }

function PaymentTerminal({ item, clientName, mode, onClose, onApproved }) {
  const [tab, setTab] = useState(mode || "card");
  return (
    <DarkModal width={440} onClose={onClose}>
      <div className="row between" style={{ padding: "15px 20px", borderBottom: "1px solid var(--line)" }}>
        <div className="row gap-3">
          <span style={{ width: 32, height: 32, borderRadius: 9, display: "grid", placeItems: "center", background: "#635BFF22", color: "#635BFF", border: "1px solid #635BFF44" }}><Icon name="euro" cls="ic-sm" /></span>
          <div className="col" style={{ gap: 1 }}>
            <span style={{ font: "600 13.5px var(--sans)" }}>Take payment</span>
            <span style={{ fontSize: 10.5, color: "var(--mute)" }}>{clientName || "Client"} · via Stripe</span>
          </div>
        </div>
        <button onClick={onClose} className="btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}><Icon name="x" /></button>
      </div>
      <div style={{ padding: "12px 20px 0" }}>
        <div className="row" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 999, padding: 3, gap: 2 }}>
          {[["card", "Card · POS"], ["link", "Payment link"]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              flex: 1, height: 30, borderRadius: 999, border: "none", cursor: "pointer",
              background: tab === v ? "var(--lime)" : "transparent", color: tab === v ? "#0a0a0a" : "var(--mute)",
              font: (tab === v ? 600 : 500) + " 12px var(--sans)"
            }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ overflowY: "auto", padding: 20 }}>
        {tab === "card" ? <POSCard clientName={clientName} onApproved={onApproved} /> : <PayLink clientName={clientName} onApproved={onApproved} />}
      </div>
    </DarkModal>
  );
}

function POSCard({ clientName, onApproved }) {
  const [amount, setAmount] = useState("298");
  const [num, setNum] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState(clientName || "");
  const [stage, setStage] = useState("form"); // form | processing | approved
  const ready = num.replace(/\s/g, "").length >= 15 && exp.length >= 4 && cvc.length >= 3 && amount;

  useEffect(() => {
    if (stage === "processing") { const t = setTimeout(() => setStage("approved"), 1600); return () => clearTimeout(t); }
    if (stage === "approved") { const t = setTimeout(() => onApproved && onApproved({ amount }), 1400); return () => clearTimeout(t); }
  }, [stage]);

  const inp = {
    width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9,
    color: "var(--ink)", font: "400 13px var(--mono)", padding: "11px 12px", outline: "none", boxSizing: "border-box"
  };
  const onF = e => e.target.style.borderColor = "#cfff3a66";
  const onB = e => e.target.style.borderColor = "var(--line)";

  if (stage === "processing") return (
    <div style={{ textAlign: "center", padding: "30px 0" }}>
      <div style={{ width: 42, height: 42, margin: "0 auto 16px", border: "3px solid var(--line)", borderTopColor: "#635BFF", borderRadius: "50%", animation: "spin .8s linear infinite" }}></div>
      <div style={{ font: "600 14px var(--sans)" }}>Processing €{amount}…</div>
      <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 5 }}>Authorising card</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
  if (stage === "approved") return (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{ width: 50, height: 50, margin: "0 auto 14px", borderRadius: "50%", background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}><Icon name="check" cls="ic-lg" /></div>
      <div style={{ font: "600 16px var(--sans)" }}>€{amount} approved</div>
      <div style={{ fontSize: 12, color: "var(--mute)", marginTop: 5 }}>Receipt sent · revenue logged to dashboard</div>
    </div>
  );

  return (
    <div className="col gap-3">
      {/* amount */}
      <div className="col gap-2" style={{ alignItems: "center", padding: "8px 0 4px" }}>
        <span className="eyebrow">Amount</span>
        <div className="row" style={{ alignItems: "center", gap: 4 }}>
          <span className="num" style={{ font: "600 30px var(--sans)", color: "var(--lime)" }}>€</span>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ""))} style={{ width: 110, background: "none", border: "none", outline: "none", color: "var(--lime)", font: "600 30px var(--sans)", textAlign: "left" }} />
        </div>
        <div className="row gap-2">
          {["298", "698", "998", "1296"].map(a => (
            <button key={a} onClick={() => setAmount(a)} className="chip" style={{ cursor: "pointer", height: 24, background: amount === a ? "var(--lime)" : "var(--bg-2)", color: amount === a ? "#0a0a0a" : "var(--mute)", borderColor: amount === a ? "var(--lime)" : "var(--line)" }}>€{a}</button>
          ))}
        </div>
      </div>
      <div className="col gap-2">
        <label style={{ fontSize: 11, color: "var(--ink-2)" }}>Cardholder name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name on card" onFocus={onF} onBlur={onB} style={{ ...inp, fontFamily: "var(--sans)" }} />
      </div>
      <div className="col gap-2">
        <label style={{ fontSize: 11, color: "var(--ink-2)" }}>Card number</label>
        <input value={num} onChange={e => setNum(fmtCard(e.target.value))} placeholder="4242 4242 4242 4242" onFocus={onF} onBlur={onB} style={inp} inputMode="numeric" />
      </div>
      <div className="row gap-2">
        <div className="col gap-2 flex-1">
          <label style={{ fontSize: 11, color: "var(--ink-2)" }}>Expiry</label>
          <input value={exp} onChange={e => { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2); setExp(v); }} placeholder="MM/YY" onFocus={onF} onBlur={onB} style={inp} inputMode="numeric" />
        </div>
        <div className="col gap-2 flex-1">
          <label style={{ fontSize: 11, color: "var(--ink-2)" }}>CVC</label>
          <input value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" onFocus={onF} onBlur={onB} style={inp} inputMode="numeric" />
        </div>
      </div>
      <button onClick={() => ready && setStage("processing")} disabled={!ready} className="btn btn-primary" style={{ height: 42, justifyContent: "center", marginTop: 4, opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}>
        <Icon name="shield" cls="ic-sm" />Charge €{amount || "0"}
      </button>
      <span className="row gap-2" style={{ justifyContent: "center", fontSize: 10.5, color: "var(--mute-2)" }}><Icon name="shield" cls="ic-sm" />PCI-secure · prototype, no real charge</span>
    </div>
  );
}

function PayLink({ clientName, onApproved }) {
  const [amount, setAmount] = useState("298");
  const [desc, setDesc] = useState("BizBoost setup");
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const slug = (clientName || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18);
  const token = (slug + amount).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 9).toString(36).slice(0, 5);
  const link = `bizboost.ie/pay/${slug}-${token}`;

  const cells = [];
  const seed = token.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 121; i++) cells.push(((i * 7 + seed) % 3 === 0) || ((i * 13 + seed) % 5 === 0));

  const inp = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, color: "var(--ink)", font: "400 13px var(--sans)", padding: "11px 12px", outline: "none", boxSizing: "border-box" };

  if (generated) return (
    <div className="col gap-3" style={{ alignItems: "center", textAlign: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(11,1fr)", width: 150, height: 150, padding: 9, background: "#fff", borderRadius: 12, gap: 2 }}>
        {cells.map((on, i) => <span key={i} style={{ background: on ? "#111" : "transparent", borderRadius: 1 }}></span>)}
      </div>
      <span className="num" style={{ font: "600 22px var(--sans)", color: "var(--lime)" }}>€{amount}</span>
      <div className="row gap-2" style={{ width: "100%" }}>
        <span className="mono truncate" style={{ flex: 1, fontSize: 11.5, color: "var(--ink-2)", background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 12px" }}>{link}</span>
        <button onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="btn" style={{ height: 38 }}>{copied ? <Icon name="check" cls="ic-sm" /> : <Icon name="copy" cls="ic-sm" />}</button>
      </div>
      <div className="row gap-2" style={{ width: "100%" }}>
        <button onClick={() => onApproved && onApproved({ amount, link })} className="btn" style={{ flex: 1, justifyContent: "center", color: "#25D366", borderColor: "#25D36644" }}><Icon name="msg" cls="ic-sm" />WhatsApp</button>
        <button onClick={() => onApproved && onApproved({ amount, link })} className="btn" style={{ flex: 1, justifyContent: "center" }}><Icon name="msg" cls="ic-sm" />SMS</button>
        <button onClick={() => onApproved && onApproved({ amount, link })} className="btn" style={{ flex: 1, justifyContent: "center" }}><Icon name="mail" cls="ic-sm" />Email</button>
      </div>
      <button onClick={() => setGenerated(false)} className="btn-ghost" style={{ border: "none", cursor: "pointer", color: "var(--mute)", fontSize: 11.5 }}>← Edit amount</button>
    </div>
  );

  return (
    <div className="col gap-3">
      <div className="col gap-2" style={{ alignItems: "center", padding: "8px 0 4px" }}>
        <span className="eyebrow">Amount</span>
        <div className="row" style={{ alignItems: "center", gap: 4 }}>
          <span className="num" style={{ font: "600 30px var(--sans)", color: "var(--lime)" }}>€</span>
          <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ""))} style={{ width: 110, background: "none", border: "none", outline: "none", color: "var(--lime)", font: "600 30px var(--sans)" }} />
        </div>
        <div className="row gap-2">
          {["298", "698", "998", "1296"].map(a => (
            <button key={a} onClick={() => setAmount(a)} className="chip" style={{ cursor: "pointer", height: 24, background: amount === a ? "var(--lime)" : "var(--bg-2)", color: amount === a ? "#0a0a0a" : "var(--mute)", borderColor: amount === a ? "var(--lime)" : "var(--line)" }}>€{a}</button>
          ))}
        </div>
      </div>
      <div className="col gap-2">
        <label style={{ fontSize: 11, color: "var(--ink-2)" }}>What's it for</label>
        <input value={desc} onChange={e => setDesc(e.target.value)} style={inp} />
      </div>
      <button onClick={() => setGenerated(true)} className="btn btn-primary" style={{ height: 42, justifyContent: "center", marginTop: 4 }}><Icon name="link" cls="ic-sm" />Generate payment link</button>
      <span style={{ fontSize: 10.5, color: "var(--mute-2)", textAlign: "center" }}>They tap, pay on Stripe's secure page — revenue auto-logs to the dashboard.</span>
    </div>
  );
}

Object.assign(window, { AdminConnect, PaymentTerminal });
