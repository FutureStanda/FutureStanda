'use client'

import React, { useState } from 'react'

// ---- Sparkline ----
interface SparklineProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  fill?: boolean
  id?: string
}

export function Sparkline({ data, w = 120, h = 32, color = 'var(--lime)', fill = true, id }: SparklineProps) {
  if (!data || !data.length) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - 4 - ((v - min) / rng) * (h - 8)
    return [x, y]
  })
  const line = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = line + ` L ${w} ${h} L 0 ${h} Z`
  const gid = 'sg' + (id || Math.random().toString(36).slice(2))
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
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
  )
}

// ---- Area chart ----
interface AreaChartProps {
  data: Array<Record<string, unknown>>
  w?: number
  h?: number
  color?: string
  valueFmt?: (v: number) => string
  labelKey?: string
  valueKey?: string
}

export function AreaChart({ data, w = 640, h = 220, color = 'var(--lime)', valueFmt = (v) => String(v), labelKey = 'm', valueKey = 'v' }: AreaChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const padL = 8, padR = 8, padT = 14, padB = 26
  const iw = w - padL - padR, ih = h - padT - padB
  const vals = data.map(d => d[valueKey] as number)
  const min = 0, max = Math.max(...vals) * 1.15
  const rng = max - min || 1
  const X = (i: number) => padL + (i / (data.length - 1)) * iw
  const Y = (v: number) => padT + ih - ((v - min) / rng) * ih
  const pts = data.map((d, i) => [X(i), Y(d[valueKey] as number)])
  const line = pts.map((p, i) => {
    if (i === 0) return `M ${p[0]} ${p[1]}`
    const prev = pts[i - 1]
    const cx = (prev[0] + p[0]) / 2
    return `C ${cx} ${prev[1]}, ${cx} ${p[1]}, ${p[0]} ${p[1]}`
  }).join(' ')
  const area = line + ` L ${pts[pts.length - 1][0]} ${padT + ih} L ${pts[0][0]} ${padT + ih} Z`
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map(f => padT + ih - f * ih)

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      style={{ display: 'block', overflow: 'visible' }}
      onMouseLeave={() => setHover(null)}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * w
        let idx = Math.round(((x - padL) / iw) * (data.length - 1))
        idx = Math.max(0, Math.min(data.length - 1, idx))
        setHover(idx)
      }}
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridYs.map((y, i) => <line key={i} x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />)}
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {data.map((d, i) => (
        <text key={i} x={X(i)} y={h - 8} fill="var(--text-3)" fontSize="10.5" textAnchor="middle" fontFamily="var(--font-sans)">{d[labelKey] as string}</text>
      ))}
      {hover != null && (
        <g>
          <line x1={pts[hover][0]} x2={pts[hover][0]} y1={padT} y2={padT + ih} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx={pts[hover][0]} cy={pts[hover][1]} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
          <g transform={`translate(${Math.min(Math.max(pts[hover][0], 36), w - 36)}, ${pts[hover][1] - 16})`}>
            <rect x="-34" y="-22" width="68" height="22" rx="6" fill="var(--bg-2)" stroke="var(--border)" />
            <text x="0" y="-7" fill="var(--text)" fontSize="11.5" fontWeight="600" textAnchor="middle" fontFamily="var(--font-sans)">{valueFmt(data[hover][valueKey] as number)}</text>
          </g>
        </g>
      )}
    </svg>
  )
}

// ---- Bar chart ----
interface BarChartProps {
  data: Array<Record<string, unknown>>
  w?: number
  h?: number
  color?: string
  labelKey?: string
  valueKey?: string
  valueFmt?: (v: number) => string
}

export function BarChart({ data, w = 320, h = 140, color = 'var(--lime)', labelKey = 'l', valueKey = 'v', valueFmt = v => String(v) }: BarChartProps) {
  const padB = 22, padT = 10
  const ih = h - padB - padT
  const max = Math.max(...data.map(d => d[valueKey] as number)) * 1.1 || 1
  const bw = (w / data.length) * 0.5
  const gap = w / data.length
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const bh = ((d[valueKey] as number) / max) * ih
        const x = i * gap + (gap - bw) / 2
        const y = padT + ih - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="3" fill={color} opacity="0.85" />
            <text x={x + bw / 2} y={h - 6} fontSize="10" textAnchor="middle" fill="var(--text-3)" fontFamily="var(--font-sans)">{d[labelKey] as string}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ---- Ring (progress) ----
interface RingProps {
  pct: number
  size?: number
  stroke?: number
  color?: string
  children?: React.ReactNode
}

export function Ring({ pct, size = 60, stroke = 5, color = 'var(--lime)', children }: RingProps) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {children && (
        <foreignObject x={0} y={0} width={size} height={size}>
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </div>
        </foreignObject>
      )}
    </svg>
  )
}

// ---- Donut chart ----
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>
  size?: number
  stroke?: number
}

export function DonutChart({ data, size = 80, stroke = 10 }: DonutChartProps) {
  const total = data.reduce((a, d) => a + d.value, 0)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {data.map((d, i) => {
        const pct = d.value / total
        const len = pct * circ
        const dash = `${len} ${circ - len}`
        const seg = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={d.color} strokeWidth={stroke}
            strokeDasharray={dash} strokeDashoffset={-offset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
        offset += len
        return seg
      })}
    </svg>
  )
}
