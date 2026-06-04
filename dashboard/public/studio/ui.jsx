// Shared UI primitives + helpers
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ---------- formatting ----------
function fmtMoney(n, dp = 0) {
  if (n >= 1000) return "€" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
  return "€" + n.toLocaleString();
}
function fmtMoneyFull(n) { return "€" + n.toLocaleString("en-IE"); }
function fmtPct(n) { return (n > 0 ? "+" : "") + Math.round(n * 100) + "%"; }
function fmtNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return n.toLocaleString();
}

// ---------- delta tag ----------
function Delta({ v, suffix = "" }) {
  if (v === 0 || v == null) return <span className="delta delta-flat">—</span>;
  const up = v > 0;
  return (
    <span className={"delta " + (up ? "delta-up" : "delta-dn")}>
      {up ? "▲" : "▼"} {Math.abs(Math.round(v * 100))}%{suffix}
    </span>
  );
}

// ---------- health pill ----------
function HealthPill({ score }) {
  let cls = "chip-lime", label = "Healthy";
  if (score < 65) { cls = "chip-red"; label = "At risk"; }
  else if (score < 80) { cls = "chip-amber"; label = "Watch"; }
  return <span className={"chip " + cls}><span className="dot"></span>{score}</span>;
}

function PlanBadge({ plan }) {
  const map = {
    Domination: "chip-lime",
    Growth: "chip-teal",
    Starter: "chip-dim"
  };
  return <span className={"chip " + (map[plan] || "chip-dim")}>{plan}</span>;
}

// ---------- avatar ----------
function Avatar({ client, size = "" }) {
  return (
    <span className={"avatar " + size} style={{ background: client.color }}>
      {client.avatar}
    </span>
  );
}

// ---------- stat block ----------
function Stat({ label, value, delta, sub, accent }) {
  return (
    <div className="col gap-2" style={{ minWidth: 0 }}>
      <div className="eyebrow">{label}</div>
      <div className="row gap-2" style={{ alignItems: "baseline" }}>
        <span className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em", color: accent || "var(--ink)" }}>{value}</span>
        {delta != null && <Delta v={delta} />}
      </div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--mute)" }}>{sub}</div>}
    </div>
  );
}

// ---------- section header ----------
function SectionHead({ eyebrow, title, action, children }) {
  return (
    <div className="row between" style={{ marginBottom: 16, alignItems: "flex-end" }}>
      <div className="col" style={{ gap: 6 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title && <div className="h-display" style={{ fontSize: 30 }} dangerouslySetInnerHTML={{ __html: title }} />}
      </div>
      {action || children}
    </div>
  );
}

// ---------- segmented control ----------
function Segmented({ options, value, onChange }) {
  return (
    <div className="row" style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: 999, padding: 3, gap: 2 }}>
      {options.map(o => {
        const val = typeof o === "string" ? o : o.value;
        const lbl = typeof o === "string" ? o : o.label;
        const active = val === value;
        return (
          <button key={val} onClick={() => onChange(val)} className="btn-ghost" style={{
            height: 26, padding: "0 12px", borderRadius: 999, border: "none", cursor: "pointer",
            background: active ? "var(--lime)" : "transparent",
            color: active ? "#0a0a0a" : "var(--mute)",
            font: (active ? 600 : 500) + " 12px var(--sans)",
            transition: "all .15s ease"
          }}>{lbl}</button>
        );
      })}
    </div>
  );
}

// ---------- ring (radial progress) ----------
function Ring({ value, size = 44, stroke = 4, color = "var(--lime)", label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      {label && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", font: "600 11px var(--sans)", color: "var(--ink)" }}>{label}</div>}
    </div>
  );
}

// ---------- empty / tooltip helpers ----------
function getClient(id) { return window.BIZBOOST_DATA.clients.find(c => c.id === id); }

window.UI = { fmtMoney, fmtMoneyFull, fmtPct, fmtNum, Delta, HealthPill, PlanBadge, Avatar, Stat, SectionHead, Segmented, Ring, getClient };
Object.assign(window, { fmtMoney, fmtMoneyFull, fmtPct, fmtNum, Delta, HealthPill, PlanBadge, Avatar, Stat, SectionHead, Segmented, Ring, getClient,
  useState, useEffect, useRef, useMemo, useCallback });
