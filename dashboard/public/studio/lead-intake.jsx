// Lead intake — the "New Lead" capture form + submit automation sequence.

// ---- Field renderer ----
function IntakeField({ f, value, onChange }) {
  const base = {
    width: "100%", background: "var(--bg-2)", border: "1px solid var(--line)",
    borderRadius: 10, color: "var(--ink)", font: "400 13px var(--sans)",
    padding: "10px 12px", outline: "none"
  };
  const onFocus = e => e.target.style.borderColor = "#cfff3a66";
  const onBlur = e => e.target.style.borderColor = "var(--line)";

  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row between">
        <label style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 500 }}>
          {f.label}{f.required && <span style={{ color: "var(--lime)" }}> *</span>}
        </label>
        {f.note && <span style={{ fontSize: 10, color: "var(--mute-2)" }}>{f.note}</span>}
      </div>

      {f.type === "area" ? (
        <textarea value={value || ""} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder}
          onFocus={onFocus} onBlur={onBlur} rows={2}
          style={{ ...base, resize: "vertical", minHeight: 52, lineHeight: 1.45 }} />
      ) : f.type === "select" ? (
        <select value={value || ""} onChange={e => onChange(f.key, e.target.value)} onFocus={onFocus} onBlur={onBlur}
          style={{ ...base, cursor: "pointer" }}>
          <option value="">Select…</option>
          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : f.type === "scale" ? (
        <ScaleField value={value} onChange={v => onChange(f.key, v)} />
      ) : f.type === "meeting" ? (
        <MeetingPicker value={value} onChange={v => onChange(f.key, v)} />
      ) : f.type === "datetime" ? (
        <input type="text" value={value || ""} onChange={e => onChange(f.key, e.target.value)}
          placeholder="e.g. Thu 5 Jun · 14:00" onFocus={onFocus} onBlur={onBlur} style={base} />
      ) : (
        <input type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"} value={value || ""} onChange={e => onChange(f.key, e.target.value)}
          placeholder={f.placeholder} onFocus={onFocus} onBlur={onBlur} style={base} />
      )}
    </div>
  );
}

function ScaleField({ value, onChange }) {
  const v = value || 5;
  return (
    <div className="row gap-3" style={{ alignItems: "center" }}>
      <input type="range" min="1" max="10" value={v} onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "var(--lime)", cursor: "pointer" }} />
      <span className="num" style={{ width: 56, textAlign: "center", fontWeight: 600, color: v >= 8 ? "var(--lime)" : v >= 5 ? "var(--amber)" : "var(--mute)" }}>
        {v}/10
      </span>
    </div>
  );
}

// ---- Meeting date + time picker -> formats to "Thu 5 Jun · 14:00" ----
const TIME_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00"];

function fmtMeeting(dateStr, time) {
  if (!dateStr || !time) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return "";
  const wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  return `${wd} ${d.getDate()} ${mo} · ${time}`;
}

function MeetingPicker({ value, onChange }) {
  // value is the formatted string; keep raw date/time in local state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const inputStyle = {
    background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 10,
    color: "var(--ink)", font: "400 13px var(--sans)", padding: "10px 12px", outline: "none",
    colorScheme: "dark", cursor: "pointer"
  };
  const onFocus = e => e.target.style.borderColor = "#cfff3a66";
  const onBlur = e => e.target.style.borderColor = "var(--line)";

  function update(d, t) {
    setDate(d); setTime(t);
    onChange(fmtMeeting(d, t));
  }

  return (
    <div className="col gap-2">
      <div className="row gap-2">
        <input type="date" value={date} onChange={e => update(e.target.value, time)} onFocus={onFocus} onBlur={onBlur}
          style={{ ...inputStyle, flex: 1 }} />
        <select value={time} onChange={e => update(date, e.target.value)} onFocus={onFocus} onBlur={onBlur}
          style={{ ...inputStyle, width: 130 }}>
          <option value="">Time…</option>
          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {value && (
        <span className="row gap-2" style={{ fontSize: 11.5, color: "var(--lime)" }}>
          <Icon name="calendar" cls="ic-sm" />Discovery call · {value}
        </span>
      )}
    </div>
  );
}

// build a custom booking link from the lead's details
function bookingLink(form) {
  const slug = (form.business || "lead").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 24);
  const token = (form.business + (form.phone || "")).split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36).slice(0, 5);
  return `bizboost.ie/meet/${slug}-${token}`;
}

// ---- Inline intro-message button (needs the 5 essentials + generates a link) ----
function IntroMessageButton({ form }) {
  const need = [
    ["business", "business name"], ["person", "contact name"],
    ["email", "email"], ["phone", "phone"], ["meetingAt", "meeting time"]
  ];
  const missing = need.filter(([k]) => !form[k]).map(([, l]) => l);
  const ready = missing.length === 0;
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function fire() {
    if (!ready || sent) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 900);
  }

  const firstName = (form.person || "").split(" ")[0] || "there";
  const link = ready ? bookingLink(form) : "";

  return (
    <div className="panel" style={{ padding: 14, background: sent ? "#25d3661a" : "var(--bg-2)", borderColor: sent ? "#25d36644" : "var(--line)" }}>
      <div className="row between" style={{ marginBottom: ready ? 10 : 0 }}>
        <div className="row gap-2">
          <span style={{ width: 26, height: 26, borderRadius: 8, background: "#25D366", color: "#0a0a0a", display: "grid", placeItems: "center" }}>
            <Icon name="msg" cls="ic-sm" />
          </span>
          <div className="col" style={{ gap: 1 }}>
            <span style={{ font: "600 12.5px var(--sans)", color: "var(--ink)" }}>Intro message + booking link</span>
            <span style={{ fontSize: 10.5, color: ready ? "var(--mute)" : "var(--amber)" }}>
              {ready ? "Custom link generated — fire it now" : "Add " + missing.join(", ") + " to unlock"}
            </span>
          </div>
        </div>
        {sent ? (
          <span className="chip chip-lime"><Icon name="check" cls="ic-sm" />Sent</span>
        ) : (
          <button onClick={fire} disabled={!ready || sending} className={ready ? "btn btn-primary" : "btn"}
            style={{ height: 30, opacity: ready ? 1 : 0.5, cursor: ready ? "pointer" : "not-allowed" }}>
            {sending ? "Sending…" : <React.Fragment><Icon name="msg" cls="ic-sm" />Send now</React.Fragment>}
          </button>
        )}
      </div>
      {ready && (
        <div className="col gap-2">
          <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.5, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 8, padding: "9px 11px" }}>
            Hi {firstName}, great chatting just now — looking forward to our call <span style={{ color: "var(--ink)", fontWeight: 600 }}>{form.meetingAt}</span>. I'll have your competition pulled apart and a custom plan ready. Confirm + see what to expect here: <span style={{ color: "#cfff3a", fontWeight: 600 }}>{link}</span> — talk soon, Bartek @ BizBoost ⚡
          </div>
          <div className="row gap-2" style={{ alignItems: "center" }}>
            <span className="chip" style={{ color: "#cfff3a", borderColor: "#cfff3a44" }}><Icon name="link" cls="ic-sm" />{link}</span>
            <span style={{ fontSize: 10.5, color: "var(--mute-2)" }}>auto-built from their details</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Submit automation sequence ----
function SubmitSequence({ form, onDone }) {
  const A = window.BIZBOOST_LEADS.automations;
  const [done, setDone] = useState([]);
  const firstName = (form.person || "the lead").split(" ")[0];

  useEffect(() => {
    const timers = A.map(a => setTimeout(() => setDone(d => [...d, a.id]), a.ms));
    const end = setTimeout(() => onDone && onDone(), A[A.length - 1].ms + 1400);
    return () => { timers.forEach(clearTimeout); clearTimeout(end); };
  }, []);

  const allDone = done.length === A.length;

  return (
    <div className="col" style={{ padding: "8px 4px" }}>
      <div className="col gap-2" style={{ alignItems: "center", textAlign: "center", marginBottom: 22 }}>
        <span style={{ width: 46, height: 46, borderRadius: 13, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center", boxShadow: "var(--lime-glow)" }}>
          <Icon name="bolt" cls="ic-lg" />
        </span>
        <div className="h-display" style={{ fontSize: 26, lineHeight: 1.1 }}>
          {allDone ? <React.Fragment><span className="it">{form.business}</span> is in motion.</React.Fragment>
                   : <React.Fragment>Firing the <span className="it">machine</span>…</React.Fragment>}
        </div>
        <span style={{ fontSize: 12.5, color: "var(--mute)" }}>
          {allDone ? "Every system kicked off automatically." : "5 automations running from one submit."}
        </span>
      </div>

      <div className="col gap-2">
        {A.map((a, i) => {
          const isDone = done.includes(a.id);
          const isActive = !isDone && done.length === i;
          return (
            <div key={a.id} className="row gap-3" style={{
              padding: "12px 14px", borderRadius: 12,
              background: isDone ? "var(--bg-2)" : isActive ? "#cfff3a0f" : "var(--bg-1)",
              border: "1px solid " + (isDone ? "var(--line-2)" : isActive ? "#cfff3a44" : "var(--line)"),
              opacity: isDone || isActive ? 1 : 0.4, transition: "all .3s ease"
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center",
                background: isDone ? a.color : "var(--bg-3)", color: isDone ? "#0a0a0a" : a.color,
                transition: "all .3s ease"
              }}>
                {isDone ? <Icon name="check" cls="ic-sm" /> : <Icon name={a.icon} cls="ic-sm" />}
              </span>
              <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                <span style={{ font: "600 13px var(--sans)", color: "var(--ink)" }}>{a.title}</span>
                <span style={{ fontSize: 11, color: "var(--mute)" }}>{a.detail}</span>
              </div>
              {isActive && <span className="live-dot"></span>}
              {isDone && <span className="chip chip-dim" style={{ fontSize: 9.5 }}>done</span>}
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="fadeup" style={{ marginTop: 18 }}>
          <button onClick={() => onDone && onDone()} className="btn btn-primary" style={{ width: "100%", height: 40, justifyContent: "center" }}>
            <Icon name="sparkle" cls="ic-sm" />See {firstName}'s research dossier
          </button>
        </div>
      )}
    </div>
  );
}

// ---- The intake modal ----
function LeadIntake({ open, onClose, onCreated }) {
  const schema = window.BIZBOOST_LEADS.intakeSchema;
  const [form, setForm] = useState({});
  const [phase, setPhase] = useState("form"); // form | firing
  const set = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  useEffect(() => { if (open) { setForm({}); setPhase("form"); } }, [open]);

  if (!open) return null;

  const valid = form.business && form.person;

  function submit() {
    if (!valid) return;
    setPhase("firing");
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 120, background: "#04050588", backdropFilter: "blur(6px)", display: "flex", justifyContent: "center", paddingTop: "6vh", paddingBottom: "6vh" }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{
        width: phase === "firing" ? 520 : 640, maxHeight: "88vh", background: "var(--elev)",
        border: "1px solid var(--line-2)", borderRadius: 20, boxShadow: "0 30px 90px #000b",
        overflow: "hidden", display: "flex", flexDirection: "column"
      }}>
        {/* header */}
        <div className="row between" style={{ padding: "16px 22px", borderBottom: "1px solid var(--line)", flexShrink: 0 }}>
          <div className="row gap-3">
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--lime)", color: "#0a0a0a", display: "grid", placeItems: "center" }}>
              <Icon name="plus" />
            </span>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ font: "600 15px var(--sans)" }}>New lead</span>
              <span style={{ fontSize: 11, color: "var(--mute)" }}>Capture → research → meeting → close</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, border: "none", cursor: "pointer", display: "grid", placeItems: "center", color: "var(--mute)" }}>
            <Icon name="x" />
          </button>
        </div>

        {phase === "form" ? (
          <React.Fragment>
            <div style={{ overflowY: "auto", padding: 22 }}>
              <div className="col gap-5">
                {schema.map((sec, si) => (
                  <div key={sec.section} className="col gap-3">
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <span className="eyebrow" style={{ color: si === 2 ? "var(--lime)" : "var(--mute)" }}>{sec.section}</span>
                      <div style={{ flex: 1, height: 1, background: "var(--line)" }}></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: sec.section === "Contact" ? "1fr 1fr" : "1fr", gap: 12 }}>
                      {sec.fields.map(f => (
                        <div key={f.key} style={{ gridColumn: (f.type === "area" || f.type === "scale" || f.type === "meeting") ? "1 / -1" : "auto" }}>
                          <IntakeField f={f} value={form[f.key]} onChange={set} />
                        </div>
                      ))}
                    </div>
                    {sec.section === "Contact" && <IntroMessageButton form={form} />}
                  </div>
                ))}
              </div>
            </div>
            {/* footer */}
            <div className="row between" style={{ padding: "14px 22px", borderTop: "1px solid var(--line)", flexShrink: 0, background: "var(--bg-1)" }}>
              <span style={{ fontSize: 11.5, color: "var(--mute)" }}>
                <span style={{ color: "var(--lime)" }}>5 automations</span> fire on submit
              </span>
              <div className="row gap-2">
                <button onClick={onClose} className="btn">Cancel</button>
                <button onClick={submit} disabled={!valid} className="btn btn-primary" style={{ opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}>
                  <Icon name="bolt" cls="ic-sm" />Submit & dispatch
                </button>
              </div>
            </div>
          </React.Fragment>
        ) : (
          <div style={{ overflowY: "auto", padding: 22 }}>
            <SubmitSequence form={form} onDone={() => { onClose(); onCreated && onCreated(form); }} />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LeadIntake });
