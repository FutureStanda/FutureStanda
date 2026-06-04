'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Ring } from '@/components/ui/charts'
import { Icon } from '@/components/ui/icons'
import { useData } from '@/store/use-store'
import { getClient } from '@/lib/data'
import type { Objective, KeyResult, Task } from '@/types'

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function krProgress(kr: KeyResult, tasks: Task[]): number {
  if (kr.measure === 'tasks' && kr.task_ids && kr.task_ids.length > 0) {
    const done = kr.task_ids.filter(id => tasks.find(t => t.id === id)?.status === 'done').length
    return done / kr.task_ids.length
  }
  if (kr.progress != null) return kr.progress
  if (kr.measure === 'metric' && kr.start_num != null && kr.target_num != null) return 0.65
  return 0
}

function liveProgress(o: Objective, tasks: Task[]): number {
  const mode = o.progress_mode || 'krs'
  if (mode === 'manual') return o.progress || 0
  if (mode === 'tasks') {
    const linked = tasks.filter(t => t.objective_id === o.id)
    if (!linked.length) return 0
    return linked.filter(t => t.status === 'done').length / linked.length
  }
  // krs
  const krs = o.key_results || []
  if (!krs.length) return o.progress || 0
  return krs.reduce((a, k) => a + krProgress(k, tasks), 0) / krs.length
}

function mdInline(s: string) {
  return (s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<b style="color:var(--text)">$1</b>')
}

// ────────────────────────────────────────────────────────────────────────────
// KR Detail Drawer (480px right panel)
// ────────────────────────────────────────────────────────────────────────────

interface KRDetailProps {
  target: { objId: string; idx: number } | null
  onClose: () => void
  objectives: Objective[]
  tasks: Task[]
  patchKR: (objId: string, idx: number, patch: Partial<KeyResult>) => void
  removeKR: (objId: string, idx: number) => void
  toggleTask: (id: string) => void
}

function KRDetail({ target, onClose, objectives, tasks, patchKR, removeKR, toggleTask }: KRDetailProps) {
  const [note, setNote] = useState('')
  if (!target) return null
  const o = objectives.find(x => x.id === target.objId)
  if (!o) return null
  const kr = (o.key_results || [])[target.idx]
  if (!kr) return null

  const measure = kr.measure || 'manual'
  const prog = krProgress(kr, tasks)
  const ratio = Math.min(1, prog)

  const set = (patch: Partial<KeyResult>) => patchKR(o.id, target.idx, patch)
  const linkedIds = kr.task_ids || []
  const linkedTasks = tasks.filter(t => linkedIds.includes(t.id))

  const inpStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 9, color: 'var(--text)', font: '400 13px var(--font-sans)',
    padding: '9px 11px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,5,0.55)', backdropFilter: 'blur(3px)' }} />
      <div className="col" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '94vw',
        background: 'var(--bg-1)', borderLeft: '1px solid var(--border)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        animation: 'slideInR 0.22s ease',
      }}>
        {/* header */}
        <div className="col gap-3" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="row between">
            <span className="eyebrow" style={{ margin: 0 }}>Key result</span>
            <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, padding: 0, display: 'grid', placeItems: 'center' }}>
              <Icon name="x" size={14} />
            </button>
          </div>
          <div style={{ color: 'var(--text)', font: '600 18px var(--font-sans)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
            {kr.kr}
          </div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Ring pct={Math.round(ratio * 100)} size={46} stroke={5} color={ratio >= 1 ? 'var(--lime)' : 'var(--amber)'}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>{Math.round(ratio * 100)}%</span>
            </Ring>
            <div className="col" style={{ gap: 2 }}>
              <span className="num" style={{ font: '600 15px var(--font-sans)' }}>
                {kr.current ?? '—'} <span style={{ color: 'var(--text-3)', fontWeight: 400, fontSize: 13 }}>/ {kr.target ?? '—'}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {measure === 'tasks' ? 'Driven by linked tasks' : measure === 'metric' ? 'Auto-tracked, live' : 'Set manually'}
              </span>
            </div>
          </div>
        </div>

        <div className="col gap-4" style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {/* measure selector */}
          <div className="col gap-2">
            <span className="eyebrow" style={{ margin: 0 }}>How is this measured?</span>
            <div className="row gap-2">
              {([['manual', 'edit', 'Manual'], ['tasks', 'checkSquare', 'Tasks'], ['metric', 'pulse', 'Live KPI']] as [string, string, string][]).map(([v, ic, l]) => (
                <button key={v} onClick={() => set({ measure: v as KeyResult['measure'] })} className="col gap-2" style={{
                  flex: 1, padding: '11px 8px', borderRadius: 11, cursor: 'pointer', alignItems: 'center',
                  background: measure === v ? 'var(--lime)' : 'var(--bg-2)',
                  border: `1px solid ${measure === v ? 'var(--lime)' : 'var(--border)'}`,
                  color: measure === v ? '#0a0a0a' : 'var(--text-2)',
                }}>
                  <Icon name={ic} size={14} />
                  <span style={{ font: '600 12px var(--font-sans)' }}>{l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* manual fields */}
          {measure === 'manual' && (
            <div className="col gap-3">
              <div className="row gap-2">
                <div className="col gap-2 flex-1">
                  <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Current</label>
                  <input value={kr.current ?? ''} onChange={e => set({ current: e.target.value })} style={inpStyle} placeholder="2" />
                </div>
                <div className="col gap-2 flex-1">
                  <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Target</label>
                  <input value={kr.target ?? ''} onChange={e => set({ target: e.target.value })} style={inpStyle} placeholder="4" />
                </div>
              </div>
              <div className="col gap-2">
                <div className="row between">
                  <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Progress</label>
                  <span className="num" style={{ fontSize: 12, color: 'var(--lime)', fontWeight: 600 }}>{Math.round((kr.progress || 0) * 100)}%</span>
                </div>
                <input type="range" min={0} max={100} value={Math.round((kr.progress || 0) * 100)}
                  onChange={e => set({ progress: +e.target.value / 100 })}
                  style={{ width: '100%', accentColor: 'var(--lime)' }} />
              </div>
            </div>
          )}

          {/* tasks */}
          {measure === 'tasks' && (
            <div className="col gap-3">
              <div className="panel" style={{ padding: '10px 12px', background: 'var(--bg-2)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  Progress = <b style={{ color: 'var(--text)' }}>{linkedTasks.filter(t => t.status === 'done').length}/{linkedTasks.length}</b> linked tasks done.
                </span>
              </div>
              {linkedTasks.length > 0 && (
                <div className="col gap-2">
                  {linkedTasks.map(t => {
                    const isDone = t.status === 'done'
                    return (
                      <div key={t.id} className="row gap-2" style={{ padding: '7px 9px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', alignItems: 'center' }}>
                        <button onClick={() => toggleTask(t.id)} style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${isDone ? 'var(--lime)' : 'var(--border)'}`, background: isDone ? 'var(--lime)' : 'transparent', display: 'grid', placeItems: 'center', color: '#0a0a0a' }}>
                          {isDone && <Icon name="check" size={9} />}
                        </button>
                        <span className="truncate" style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</span>
                      </div>
                    )
                  })}
                </div>
              )}
              {linkedTasks.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No tasks linked to this KR yet.</span>
              )}
            </div>
          )}

          {/* checkpoints */}
          <div className="col gap-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <span className="eyebrow" style={{ margin: 0 }}>Checkpoints</span>
            <div className="row gap-2">
              <input value={note} onChange={e => setNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && note.trim()) { setNote(''); } }}
                placeholder="Log an update or note…"
                style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', font: '400 12.5px var(--font-sans)', padding: '9px 11px', outline: 'none' }} />
              <button onClick={() => setNote('')} className="btn btn-ghost" style={{ height: 36, flexShrink: 0 }}>
                <Icon name="plus" size={14} />
              </button>
            </div>
            {(kr.checkpoints || []).length > 0 && (
              <div className="col" style={{ position: 'relative', marginTop: 4 }}>
                <div style={{ position: 'absolute', left: 5, top: 8, bottom: 8, width: 1, background: 'var(--border)' }} />
                {(kr.checkpoints || []).map((cp, i) => (
                  <div key={i} className="row gap-3" style={{ padding: '7px 0', position: 'relative' }}>
                    <span style={{ width: 11, height: 11, borderRadius: 99, background: 'var(--bg-3)', border: '2px solid var(--lime)', flexShrink: 0, marginTop: 2, zIndex: 1 }} />
                    <div className="col" style={{ gap: 1, flex: 1 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{cp.note}</span>
                      <span className="row gap-2 num" style={{ fontSize: 10.5, color: 'var(--text-3)' }}>
                        {cp.at}{cp.value && <> · <span>{cp.value}</span></>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* footer */}
        <div className="row between" style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <button onClick={() => { removeKR(o.id, target.idx); onClose() }} className="btn btn-ghost" style={{ color: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, font: '500 12.5px var(--font-sans)' }}>
            <Icon name="trash" size={13} />Delete key result
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ height: 32 }}>Done</button>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Objective Coach (420px right panel)
// ────────────────────────────────────────────────────────────────────────────

function buildCoachContext(o: Objective, tasks: Task[]) {
  const linked = tasks.filter(t => t.objective_id === o.id)
  const done = linked.filter(t => t.status === 'done').length
  const total = linked.length
  const prog = Math.round(liveProgress(o, tasks) * 100)
  const krs = o.key_results || []
  return { done, total, prog, krs, open: linked.filter(t => t.status !== 'done'), urgent: linked.filter(t => t.priority === 'P0' && t.status !== 'done') }
}

function localCoachAnalysis(o: Objective, tasks: Task[], kind: string): string {
  const { done, total, prog, krs, open, urgent } = buildCoachContext(o, tasks)
  const lagging = krs.filter(k => (k.progress || 0) < 0.5)
  const finished = krs.filter(k => (k.progress || 0) >= 1)
  const L: string[] = []

  if (kind === 'assess') {
    L.push(`**${prog}% complete** — measured by ${o.progress_mode || 'key results'}.`)
    if (finished.length) L.push(`✅ Landed: ${finished.map(k => k.kr).join('; ')}.`)
    if (lagging.length) L.push(`⚠️ Behind: ${lagging.map(k => `${k.kr} (${Math.round((k.progress || 0) * 100)}%)`).join('; ')}.`)
    if (total) L.push(`Supporting work: ${done}/${total} linked tasks done.`)
    const verdict = prog >= 80 ? 'On the home straight — protect the momentum.' : prog >= 50 ? 'Solid progress, but the back half is where these stall.' : prog >= 25 ? 'Early days — the next two weeks decide whether this lands on time.' : 'Barely started. Needs a forcing function this week.'
    L.push(`**Read:** ${verdict}`)
  }
  if (kind === 'blockers') {
    if (urgent.length) L.push(`🔴 **${urgent.length} urgent task${urgent.length > 1 ? 's' : ''} open** — these are the bottleneck:\n${urgent.map(t => `   • ${t.title}`).join('\n')}`)
    if (lagging.length) L.push(`📉 **Lagging KRs:** ${lagging.map(k => k.kr).join('; ')}. Each needs a task driving it.`)
    if (!urgent.length && !lagging.length) L.push(`No hard blockers detected. ${open.length ? `${open.length} task${open.length > 1 ? 's' : ''} in flight — keep them unblocked.` : "Pipeline's clear."}`)
  }
  if (kind === 'next') {
    if (urgent.length) L.push(`1. Clear the urgent: **${urgent[0].title}**.`)
    open.filter(t => t.priority !== 'P0').slice(0, 2).forEach((t, i) => L.push(`${(urgent.length ? 2 : 1) + i}. ${t.title}.`))
    if (lagging.length) L.push(`${L.length + 1}. Push **${lagging[0].kr}** off ${Math.round((lagging[0].progress || 0) * 100)}%.`)
    if (!open.length) L.push('All linked tasks are done. Either close this objective or add the next milestone.')
  }
  return L.join('\n\n')
}

interface ObjectiveCoachProps {
  objective: Objective | null
  tasks: Task[]
  onClose: () => void
}

function ObjectiveCoach({ objective: o, tasks, onClose }: ObjectiveCoachProps) {
  const [msgs, setMsgs] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMsgs([]); setInput('') }, [o?.id])
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [msgs, busy])
  if (!o) return null

  const ctx = buildCoachContext(o, tasks)

  async function ask(text: string, localKind?: string) {
    setMsgs(m => [...m, { role: 'user', text }])
    setBusy(true)
    await new Promise(r => setTimeout(r, 800))
    const reply = localCoachAnalysis(o!, tasks, localKind || 'assess')
    setMsgs(m => [...m, { role: 'ai', text: reply }])
    setBusy(false)
  }

  const quick: [string, string, string][] = [
    ['Assess progress', 'How are we doing on this objective?', 'assess'],
    ["What's blocking it?", "What's blocking this objective?", 'blockers'],
    ['What should I do next?', 'What should I do next to move this?', 'next'],
  ]

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, maxWidth: '92vw', zIndex: 140, background: 'var(--bg-1)', borderLeft: '1px solid var(--border)', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', animation: 'slideInR 0.22s ease' }}>
      {/* header */}
      <div className="col gap-3" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
        <div className="row between">
          <div className="row gap-2">
            <span style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,var(--lime),#9ad400)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
              <Icon name="sparkle" size={14} />
            </span>
            <div className="col">
              <span style={{ font: '600 13.5px var(--font-sans)' }}>Objective Coach</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Analysing your data</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, padding: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="panel" style={{ padding: 12, background: 'var(--bg-2)' }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Ring pct={ctx.prog} size={42} stroke={4} color="var(--lime)">
              <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>{ctx.prog}%</span>
            </Ring>
            <div className="col" style={{ gap: 2, minWidth: 0 }}>
              <span className="truncate" style={{ font: '600 12.5px var(--font-sans)' }}>{o.title}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{ctx.done}/{ctx.total} tasks · by {o.progress_mode === 'tasks' ? 'tasks' : o.progress_mode === 'manual' ? 'manual' : 'key results'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="col gap-3" style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
        {msgs.length === 0 && (
          <div className="col gap-2" style={{ color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.5 }}>
            <span>Ask me anything about <b style={{ color: 'var(--text-2)' }}>{o.title}</b>.</span>
            <span style={{ color: 'var(--text-3)' }}>Try a quick analysis below, or type your own question.</span>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
            <div style={{
              padding: '10px 13px', borderRadius: 13, fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? 'var(--lime)' : 'var(--bg-2)',
              color: m.role === 'user' ? '#0a0a0a' : 'var(--text-2)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              fontWeight: m.role === 'user' ? 500 : 400,
            }} dangerouslySetInnerHTML={{ __html: mdInline(m.text) }} />
          </div>
        ))}
        {busy && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div className="row gap-2" style={{ padding: '10px 13px', borderRadius: 13, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <span className="live-dot" /><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* quick chips */}
      <div className="row gap-2" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {quick.map(([label, q, kind]) => (
          <button key={kind} onClick={() => !busy && ask(q, kind)} className="chip" style={{ cursor: busy ? 'default' : 'pointer', background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)', height: 28 }}>
            {label}
          </button>
        ))}
      </div>

      {/* input */}
      <div className="row gap-2" style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the coach…"
          onKeyDown={e => { if (e.key === 'Enter' && input.trim() && !busy) { ask(input.trim()); setInput('') } }}
          style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '10px 12px', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = '#cfff3a66')} onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
        <button onClick={() => { if (input.trim() && !busy) { ask(input.trim()); setInput('') } }} className="btn btn-primary" style={{ width: 38, height: 38, padding: 0, justifyContent: 'center' }}>
          <Icon name="arrowR" size={14} />
        </button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Objective Composer Modal
// ────────────────────────────────────────────────────────────────────────────

interface ObjComposerProps {
  open: boolean
  initial: Partial<Objective> | null
  onClose: () => void
  onSave: (o: Partial<Objective>) => void
}

function ObjComposer({ open, initial, onClose, onSave }: ObjComposerProps) {
  const isEdit = !!(initial && initial.id)
  const blank = useCallback(() => ({
    title: initial?.title || '',
    owner: initial?.owner || 'Bartek',
    current_value: initial?.current_value ?? ('' as unknown as number),
    target_value: initial?.target_value ?? ('' as unknown as number),
    progress_mode: initial?.progress_mode || 'krs' as string,
    progress: initial?.progress || 0,
    key_results: initial?.key_results ? [...initial.key_results] : [{ kr: '', current: '', target: '', progress: 0, measure: 'manual' as const }],
  }), [initial])

  const [f, setF] = useState(blank)
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setF(blank()); setTimeout(() => titleRef.current?.focus(), 30) } }, [open, blank])
  if (!open) return null

  const set = (k: string, v: unknown) => setF(s => ({ ...s, [k]: v }))
  const setKR = (i: number, key: string, val: unknown) => setF(s => {
    const krs = s.key_results.map((k: KeyResult, idx: number) => idx === i ? { ...k, [key]: val } : k)
    return { ...s, key_results: krs }
  })
  const addKR = () => setF(s => ({ ...s, key_results: [...s.key_results, { kr: '', current: '', target: '', progress: 0, measure: 'manual' as const }] }))
  const removeKR = (i: number) => setF(s => ({ ...s, key_results: s.key_results.filter((_: KeyResult, idx: number) => idx !== i) }))

  const overall = (() => {
    const krs = (f.key_results || []).filter((k: KeyResult) => (k.kr as string).trim())
    if (!krs.length) return 0
    return krs.reduce((a: number, k: KeyResult) => a + (k.progress || 0), 0) / krs.length
  })()

  function save() {
    if (!(f.title as string).trim()) { titleRef.current?.focus(); return }
    const clean = { ...f, key_results: (f.key_results || []).filter((k: KeyResult) => (k.kr as string).trim()).map((k: KeyResult) => ({ ...k, kr: (k.kr as string).trim(), current: k.current || '0', target: k.target || '—', progress: k.progress || 0 })) }
    onSave(clean)
    onClose()
  }

  const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--text-2)', fontWeight: 500, marginBottom: 6, display: 'block' }
  const inp: React.CSSProperties = { width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }
  const small: React.CSSProperties = { ...inp, padding: '7px 9px', fontSize: 12 }

  const modes: [string, string, string][] = [
    ['krs', 'Key results', 'Average of KR progress'],
    ['tasks', 'Linked tasks', '% of tasks completed'],
    ['manual', 'Manual', 'Set it yourself'],
  ]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(4,5,5,0.6)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center' }}>
      <div onClick={e => e.stopPropagation()} className="fadeup" style={{ width: 580, maxHeight: '90vh', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 30px 90px rgba(0,0,0,0.7)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="row between" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-2">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center' }}>
              <Icon name="target" size={14} />
            </span>
            <span style={{ font: '600 14px var(--font-sans)' }}>{isEdit ? 'Edit objective' : 'New objective'}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 28, height: 28, borderRadius: 8, padding: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <span style={lbl}>Objective</span>
            <input ref={titleRef} value={f.title as string} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Cross €100k MRR by end of Q3"
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save() }}
              style={{ ...inp, font: '600 15px var(--font-sans)' }} />
          </div>

          <div className="row gap-3" style={{ marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <span style={lbl}>Owner</span>
              <input value={f.owner as string} onChange={e => set('owner', e.target.value)} style={inp} placeholder="Bartek" />
            </div>
            <div style={{ width: 120 }}>
              <span style={lbl}>Current</span>
              <input value={f.current_value as unknown as string} onChange={e => set('current_value', e.target.value)} placeholder="€72.4k" style={inp} />
            </div>
            <div style={{ width: 120 }}>
              <span style={lbl}>Target</span>
              <input value={f.target_value as unknown as string} onChange={e => set('target_value', e.target.value)} placeholder="€100k" style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <span style={lbl}>Measure progress by</span>
            <div className="row gap-2">
              {modes.map(([v, l, sub]) => {
                const on = (f.progress_mode as string) === v
                return (
                  <button key={v} onClick={() => set('progress_mode', v)} style={{ flex: 1, textAlign: 'left', padding: '9px 11px', borderRadius: 10, cursor: 'pointer', background: on ? '#cfff3a12' : 'var(--bg-2)', border: `1px solid ${on ? '#cfff3a55' : 'var(--border)'}` }}>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <span style={{ width: 14, height: 14, borderRadius: 99, flexShrink: 0, border: `1.5px solid ${on ? 'var(--lime)' : 'var(--border)'}`, display: 'grid', placeItems: 'center' }}>
                        {on && <span style={{ width: 7, height: 7, borderRadius: 99, background: 'var(--lime)' }} />}
                      </span>
                      <span style={{ font: '600 12px var(--font-sans)', color: on ? 'var(--text)' : 'var(--text-2)' }}>{l}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 3, paddingLeft: 22 }}>{sub}</div>
                  </button>
                )
              })}
            </div>
            {(f.progress_mode as string) === 'manual' && (
              <div className="row gap-2" style={{ alignItems: 'center', marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Set progress</span>
                <input type="range" min={0} max={100} value={Math.round((f.progress as number) * 100)} onChange={e => set('progress', +e.target.value / 100)} style={{ flex: 1, accentColor: 'var(--lime)' }} />
                <span className="num" style={{ width: 42, textAlign: 'right', color: 'var(--lime)', fontWeight: 700 }}>{Math.round((f.progress as number) * 100)}%</span>
              </div>
            )}
          </div>

          <div className="row between" style={{ marginBottom: 10 }}>
            <span className="eyebrow" style={{ margin: 0 }}>Key results</span>
            <span className="row gap-2" style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              Overall <span className="num" style={{ color: 'var(--lime)', fontWeight: 700 }}>{Math.round(overall * 100)}%</span>
            </span>
          </div>
          <div className="col gap-2">
            {(f.key_results as KeyResult[]).map((k, i) => (
              <div key={i} className="col gap-2" style={{ padding: 11, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                <div className="row gap-2" style={{ alignItems: 'center' }}>
                  <input value={k.kr as string} onChange={e => setKR(i, 'kr', e.target.value)} placeholder={`Key result ${i + 1}`} style={{ ...small, flex: 1 }} />
                  {(f.key_results as KeyResult[]).length > 1 && (
                    <button onClick={() => removeKR(i)} className="btn btn-ghost" style={{ width: 26, height: 26, borderRadius: 7, padding: 0, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name="trash" size={12} />
                    </button>
                  )}
                </div>
                <div className="row gap-2" style={{ alignItems: 'center' }}>
                  <input value={k.current as string} onChange={e => setKR(i, 'current', e.target.value)} placeholder="now (2)" style={{ ...small, width: 90 }} />
                  <span style={{ color: 'var(--text-3)', fontSize: 12 }}>/</span>
                  <input value={k.target as string} onChange={e => setKR(i, 'target', e.target.value)} placeholder="goal (4)" style={{ ...small, width: 90 }} />
                  <div className="row gap-2" style={{ flex: 1, alignItems: 'center', paddingLeft: 6 }}>
                    <input type="range" min={0} max={100} value={Math.round((k.progress || 0) * 100)} onChange={e => setKR(i, 'progress', +e.target.value / 100)} style={{ flex: 1, accentColor: 'var(--lime)' }} />
                    <span className="num" style={{ width: 38, textAlign: 'right', fontSize: 12, color: 'var(--text-2)' }}>{Math.round((k.progress || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={addKR} className="btn btn-ghost" style={{ height: 30, marginTop: 10 }}>
            <Icon name="plus" size={13} />Add key result
          </button>
        </div>

        <div className="row between" style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⌘↵ to save</span>
          <div className="row gap-2">
            <button onClick={onClose} className="btn">Cancel</button>
            <button onClick={save} className="btn btn-primary">
              <Icon name="check" size={13} />{isEdit ? 'Save changes' : 'Create objective'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// 3-dot menu
// ────────────────────────────────────────────────────────────────────────────

function ObjMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRow: React.CSSProperties = { display: 'flex', gap: 9, alignItems: 'center', width: '100%', padding: '8px 9px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--text-2)', font: '500 12.5px var(--font-sans)' }
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, padding: 0, display: 'grid', placeItems: 'center' }}>
        <Icon name="dots" size={14} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div className="panel" style={{ position: 'absolute', top: 34, right: 0, zIndex: 31, width: 160, padding: 5, background: 'var(--bg-1)', border: '1px solid var(--border)', boxShadow: '0 16px 50px rgba(0,0,0,0.6)' }}>
            <button onClick={() => { setOpen(false); onEdit() }} style={menuRow}>
              <Icon name="edit" size={13} />Edit objective
            </button>
            <button onClick={() => { setOpen(false); onDelete() }} style={{ ...menuRow, color: 'var(--red)' }}>
              <Icon name="trash" size={13} />Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Task row inside objective
// ────────────────────────────────────────────────────────────────────────────

function ObjTaskRow({ t, onToggle }: { t: Task; onToggle: (id: string) => void }) {
  const client = t.client_id ? getClient(t.client_id) : null
  const done = t.status === 'done'
  const statusColors: Record<string, string> = { todo: 'var(--text-3)', doing: 'var(--amber)', done: 'var(--lime)' }
  const sc = statusColors[t.status] || statusColors.todo
  const sl = t.status === 'todo' ? 'To do' : t.status === 'doing' ? 'In progress' : 'Done'

  return (
    <div className="row gap-3" style={{ padding: '8px 11px', borderRadius: 9, background: 'var(--bg-2)', border: '1px solid var(--border)', alignItems: 'center', opacity: done ? 0.55 : 1 }}>
      <button onClick={() => onToggle(t.id)} style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: 'pointer', border: `1.5px solid ${done ? 'var(--lime)' : 'var(--border)'}`, background: done ? 'var(--lime)' : 'transparent', display: 'grid', placeItems: 'center', color: '#0a0a0a' }}>
        {done && <Icon name="check" size={10} />}
      </button>
      <span className="truncate" style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', textDecoration: done ? 'line-through' : 'none', cursor: 'default' }}>
        {t.title}
      </span>
      {client && (
        <span className="row gap-2" style={{ flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: client.color }} />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{client.name.split(' ')[0]}</span>
        </span>
      )}
      <span className="chip" style={{ flexShrink: 0, background: 'transparent', borderColor: 'var(--border)', color: sc }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: sc }} />
        {sl}
      </span>
      {t.due_date && (
        <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 50, justifyContent: 'center' }}>{t.due_date}</span>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Objective card
// ────────────────────────────────────────────────────────────────────────────

interface ObjCardProps {
  o: Objective
  idx: number
  tasks: Task[]
  onKRClick: (objId: string, krIdx: number) => void
  onCoach: (o: Objective) => void
  onEdit: (o: Objective) => void
  onDelete: (id: string) => void
  onAddKR: (objId: string) => void
  onAddTask: (objId: string) => void
  onToggleTask: (id: string) => void
}

function ObjCard({ o, idx, tasks, onKRClick, onCoach, onEdit, onDelete, onAddKR, onAddTask, onToggleTask }: ObjCardProps) {
  const linked = tasks.filter(t => t.objective_id === o.id)
  const prog = liveProgress(o, tasks)
  const pct = Math.round(prog * 100)

  const measureMeta: Record<string, [string, string]> = {
    krs: ['target', 'Key results'],
    tasks: ['checkSquare', 'Tasks'],
    manual: ['edit', 'Manual'],
  }
  const modeMeta = measureMeta[o.progress_mode] || measureMeta.krs

  return (
    <div className="panel fadeup" style={{ padding: 20, animationDelay: `${idx * 0.05}s` }}>
      {/* header */}
      <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <Ring pct={pct} size={52} stroke={5} color={pct >= 100 ? 'var(--lime)' : pct >= 60 ? '#4FE3C1' : 'var(--amber)'}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>{pct}%</span>
          </Ring>
          <div className="col" style={{ gap: 4 }}>
            <span style={{ font: '600 16px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--text)' }}>{o.title}</span>
            <div className="row gap-2" style={{ color: 'var(--text-3)', fontSize: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--border)', color: 'var(--text-2)', display: 'grid', placeItems: 'center', font: '600 10px var(--font-sans)' }}>
                  {(o.owner || 'B')[0]}
                </span>
                {o.owner}
              </span>
              {(o.current_value || o.target_value) && (
                <><span>·</span><span className="num">{o.current_value || '—'} / {o.target_value || '—'}</span></>
              )}
              <span>·</span>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <Icon name={modeMeta[0]} size={12} />
                {modeMeta[1]}
              </span>
            </div>
          </div>
        </div>
        <div className="row gap-2" style={{ flexShrink: 0 }}>
          <button onClick={() => onCoach(o)} className="btn btn-ghost" style={{ height: 30 }}>
            <Icon name="sparkle" size={12} />Coach
          </button>
          <ObjMenu onEdit={() => onEdit(o)} onDelete={() => onDelete(o.id)} />
        </div>
      </div>

      {/* key results */}
      <div className="col gap-2" style={{ paddingLeft: 4 }}>
        <div className="row between" style={{ marginBottom: 2 }}>
          <span className="eyebrow" style={{ margin: 0 }}>Key results</span>
          <button onClick={() => onAddKR(o.id)} className="btn btn-ghost" style={{ height: 24, fontSize: 11 }}>
            <Icon name="plus" size={11} />Add key result
          </button>
        </div>
        {(o.key_results || []).map((kr, i) => {
          const prog2 = krProgress(kr, tasks)
          const done2 = prog2 >= 1
          const m = kr.measure || 'manual'
          const mMeta: Record<string, [string, string, string]> = {
            manual: ['edit', 'Manual', 'var(--text-3)'],
            tasks: ['checkSquare', 'Tasks', '#4FE3C1'],
            metric: ['pulse', 'Live', 'var(--lime)'],
          }
          const [mIcon, mLabel, mColor] = mMeta[m] || mMeta.manual
          return (
            <button key={i} onClick={() => onKRClick(o.id, i)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 11, background: 'var(--bg-2)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="row between" style={{ fontSize: 12.5, gap: 10 }}>
                <span className="row gap-2" style={{ color: 'var(--text-2)', minWidth: 0, alignItems: 'center' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 5, flexShrink: 0, border: `1px solid ${done2 ? 'var(--lime)' : 'var(--border)'}`, background: done2 ? 'var(--lime)' : 'transparent', display: 'grid', placeItems: 'center', color: '#0a0a0a' }}>
                    {done2 && <Icon name="check" size={10} />}
                  </span>
                  <span className="truncate">{kr.kr}</span>
                </span>
                <span className="row gap-2" style={{ flexShrink: 0, alignItems: 'center' }}>
                  <span className="chip" style={{ background: 'transparent', borderColor: 'var(--border)', color: mColor, height: 20, fontSize: 9.5 }}>
                    <Icon name={mIcon} size={10} />{mLabel}
                  </span>
                  <span className="num" style={{ color: 'var(--text-3)', fontWeight: 600 }}>
                    {kr.current ?? '—'} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {kr.target ?? '—'}</span>
                  </span>
                  <Icon name="chevR" size={12} />
                </span>
              </div>
              <div className="prog" style={{ marginLeft: 24 }}>
                <i style={{ width: `${prog2 * 100}%`, background: done2 ? 'var(--lime)' : mColor }} />
              </div>
            </button>
          )
        })}
        {(o.key_results || []).length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 0' }}>No key results yet — add one to measure this objective.</span>
        )}
      </div>

      {/* linked tasks */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div className="row between" style={{ marginBottom: linked.length ? 10 : 0 }}>
          <span className="eyebrow" style={{ margin: 0 }}>Linked tasks</span>
          <button onClick={() => onAddTask(o.id)} className="btn btn-ghost" style={{ height: 26, fontSize: 11.5 }}>
            <Icon name="plus" size={11} />Add task
          </button>
        </div>
        {linked.length ? (
          <div className="col gap-2">
            {linked.map(t => <ObjTaskRow key={t.id} t={t} onToggle={onToggleTask} />)}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '6px 0' }}>No tasks linked yet — add one to drive this objective forward.</div>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function ObjectivesPage() {
  const { tasks, objectives, toggleTask, updateTask } = useData()
  const [localObjectives, setLocalObjectives] = useState<Objective[]>(objectives)
  const [objCompose, setObjCompose] = useState<{ open: boolean; initial: Partial<Objective> | null }>({ open: false, initial: null })
  const [krTarget, setKrTarget] = useState<{ objId: string; idx: number } | null>(null)
  const [coach, setCoach] = useState<Objective | null>(null)

  // patch KR in local state
  const patchKR = useCallback((objId: string, idx: number, patch: Partial<KeyResult>) => {
    setLocalObjectives(prev => prev.map(o => {
      if (o.id !== objId) return o
      const krs = (o.key_results || []).map((k, i) => i === idx ? { ...k, ...patch } : k)
      return { ...o, key_results: krs }
    }))
  }, [])

  const removeKR = useCallback((objId: string, idx: number) => {
    setLocalObjectives(prev => prev.map(o => {
      if (o.id !== objId) return o
      return { ...o, key_results: (o.key_results || []).filter((_, i) => i !== idx) }
    }))
  }, [])

  const addKR = useCallback((objId: string) => {
    setLocalObjectives(prev => prev.map(o => {
      if (o.id !== objId) return o
      return { ...o, key_results: [...(o.key_results || []), { kr: 'New key result', current: '0', target: '—', progress: 0, measure: 'manual' as const }] }
    }))
    // open the KR detail for the newly added one
    const obj = localObjectives.find(o => o.id === objId)
    if (obj) setKrTarget({ objId, idx: (obj.key_results || []).length })
  }, [localObjectives])

  const handleSaveObjective = useCallback((data: Partial<Objective>) => {
    if (data.id) {
      setLocalObjectives(prev => prev.map(o => o.id === data.id ? { ...o, ...data } : o))
    } else {
      const newObj: Objective = {
        id: 'o' + Date.now(),
        title: data.title || 'New objective',
        owner: data.owner || 'Bartek',
        current_value: typeof data.current_value === 'number' ? data.current_value : 0,
        target_value: typeof data.target_value === 'number' ? data.target_value : 0,
        progress: data.progress || 0,
        progress_mode: data.progress_mode || 'krs',
        key_results: data.key_results || [],
        linked_tasks: data.linked_tasks || [],
        created_at: new Date().toISOString(),
      }
      setLocalObjectives(prev => [newObj, ...prev])
    }
  }, [])

  const deleteObjective = useCallback((id: string) => {
    setLocalObjectives(prev => prev.filter(o => o.id !== id))
  }, [])

  // keep krTarget objective in sync for coach when objectives change
  const coachObj = coach ? localObjectives.find(o => o.id === coach.id) || coach : null

  return (
    <>
      <style>{`
        @keyframes slideInR {
          from { transform: translateX(100%); opacity: 0.7; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Objectives' }]} />
        <div className="page-inner" style={{ maxWidth: 940 }}>
          {/* header */}
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="col gap-2">
              <div className="eyebrow">Q3 2026 · {localObjectives.length} objectives</div>
              <div className="h-display" style={{ fontSize: 38 }}>Objectives</div>
            </div>
            <button onClick={() => setObjCompose({ open: true, initial: null })} className="btn btn-primary">
              <Icon name="plus" size={14} />New objective
            </button>
          </div>

          {/* objective cards */}
          <div className="col gap-3">
            {localObjectives.length === 0 && (
              <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
                No objectives yet.{' '}
                <button onClick={() => setObjCompose({ open: true, initial: null })} style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}>
                  Set your first one →
                </button>
              </div>
            )}
            {localObjectives.map((o, idx) => (
              <ObjCard
                key={o.id}
                o={o}
                idx={idx}
                tasks={tasks}
                onKRClick={(objId, krIdx) => setKrTarget({ objId, idx: krIdx })}
                onCoach={setCoach}
                onEdit={o2 => setObjCompose({ open: true, initial: o2 })}
                onDelete={deleteObjective}
                onAddKR={addKR}
                onAddTask={() => {/* task composer outside scope */}}
                onToggleTask={toggleTask}
              />
            ))}
          </div>
        </div>
      </div>

      {/* KR detail drawer */}
      <KRDetail
        target={krTarget}
        onClose={() => setKrTarget(null)}
        objectives={localObjectives}
        tasks={tasks}
        patchKR={patchKR}
        removeKR={removeKR}
        toggleTask={toggleTask}
      />

      {/* Objective coach panel */}
      {coachObj && (
        <ObjectiveCoach
          objective={coachObj}
          tasks={tasks}
          onClose={() => setCoach(null)}
        />
      )}

      {/* Objective composer */}
      <ObjComposer
        open={objCompose.open}
        initial={objCompose.initial}
        onClose={() => setObjCompose({ open: false, initial: null })}
        onSave={handleSaveObjective}
      />
    </>
  )
}
