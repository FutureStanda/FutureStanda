// Lightweight SVG charts. No external deps.

// ---------- Sparkline ----------
function Sparkline({ data, w = 120, h = 32, color = "var(--lime)", fill = true, id }) {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 4 - ((v - min) / rng) * (h - 8);
    return [x, y];
  });
  const line = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${w} ${h} L 0 ${h} Z`;
  const gid = "sg" + (id || Math.random().toString(36).slice(2));
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.4" fill={color} />
    </svg>
  );
}

// ---------- Area chart (with axis + hover) ----------
function AreaChart({ data, w = 640, h = 220, color = "var(--lime)", valueFmt = (v) => v, labelKey = "m", valueKey = "v" }) {
  const [hover, setHover] = useState(null);
  const padL = 8, padR = 8, padT = 14, padB = 26;
  const iw = w - padL - padR, ih = h - padT - padB;
  const vals = data.map(d => d[valueKey]);
  const min = 0, max = Math.max(...vals) * 1.15;
  const rng = max - min || 1;
  const X = i => padL + (i / (data.length - 1)) * iw;
  const Y = v => padT + ih - ((v - min) / rng) * ih;
  const pts = data.map((d, i) => [X(i), Y(d[valueKey])]);
  // smooth path
  const line = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`;
    const prev = pts[i - 1];
    const cx = (prev[0] + p[0]) / 2;
    return `C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`;
  }).join(" ");
  const area = line + ` L ${pts[pts.length - 1][0]} ${padT + ih} L ${pts[0][0]} ${padT + ih} Z`;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => padT + ih - f * ih);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * w;
        let idx = Math.round(((x - padL) / iw) * (data.length - 1));
        idx = Math.max(0, Math.min(data.length - 1, idx));
        setHover(idx);
      }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--line)" strokeWidth="1" />)}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={i} x={X(i)} y={h - 8} fill="var(--mute-2)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{d[labelKey]}</text>
      ))}
      {hover != null && (
        <g>
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={padT + ih} stroke="var(--line-2)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
          <g transform={`translate(${Math.min(Math.max(pts[hover][0], 36), w - 36)}, ${pts[hover][1] - 16})`}>
            <rect x="-34" y="-22" width="68" height="22" rx="6" fill="var(--elev)" stroke="var(--line-2)" />
            <text x="0" y="-7" fill="var(--ink)" fontSize="11.5" fontWeight="600" textAnchor="middle" fontFamily="var(--sans)">{valueFmt(data[hover][valueKey])}</text>
          </g>
        </g>
      )}
    </svg>
  );
}

// ---------- Bar chart (vertical) ----------
function BarChart({ data, w = 320, h = 140, color = "var(--lime)", labelKey = "l", valueKey = "v", valueFmt = v => v }) {
  const padB = 22, padT = 10;
  const ih = h - padB - padT;
  const max = Math.max(...data.map(d => d[valueKey])) * 1.1 || 1;
  const bw = (w / data.length) * 0.5;
  const gap = (w / data.length);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const bh = (d[valueKey] / max) * ih;
        const x = i * gap + (gap - bw) / 2;
        const y = padT + ih - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={d.color || color} opacity={d.dim ? 0.4 : 1} />
            <text x={x + bw / 2} y={h - 7} fill="var(--mute-2)" fontSize="10" textAnchor="middle" fontFamily="var(--mono)">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------- Donut ----------
function Donut({ segments, size = 120, stroke = 16 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * c;
        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-acc * c}
          style={{ transition: "stroke-dasharray .8s ease" }} />;
        acc += frac;
        return el;
      })}
    </svg>
  );
}

// ---------- Horizontal progress bars list ----------
function HBars({ items, valueFmt = v => v }) {
  const max = Math.max(...items.map(i => i.value)) || 1;
  return (
    <div className="col gap-3">
      {items.map((it, i) => (
        <div key={i} className="col gap-2">
          <div className="row between" style={{ fontSize: 12.5 }}>
            <span className="row gap-2" style={{ color: "var(--ink-2)" }}>
              {it.avatar && <Avatar client={it} size="avatar-sm" />}
              {it.label}
            </span>
            <span className="num" style={{ color: "var(--ink)", fontWeight: 600 }}>{valueFmt(it.value)}</span>
          </div>
          <div className="prog"><i style={{ width: (it.value / max * 100) + "%", background: it.color || "var(--lime)" }}></i></div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Sparkline, AreaChart, BarChart, Donut, HBars });
