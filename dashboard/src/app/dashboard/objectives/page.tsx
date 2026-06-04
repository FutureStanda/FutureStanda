'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Ring } from '@/components/ui/charts'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/shared'
import { OBJECTIVES, TASKS, getClient } from '@/lib/data'
import type { Objective, KeyResult, Task } from '@/types'

// ---- KR progress helper ----
function krProgress(kr: KeyResult): number {
  if (kr.progress != null) return kr.progress
  if (kr.measure === 'tasks' && kr.task_ids) {
    const done = kr.task_ids.filter(id => TASKS.find(t => t.id === id)?.status === 'done').length
    return kr.task_ids.length ? done / kr.task_ids.length : 0
  }
  if (kr.measure === 'metric' && kr.start_num != null && kr.target_num != null) {
    // use current from TASKS/data if possible
    return 0.65
  }
  return 0
}

// ---- Task row in objective ----
function ObjTaskRow({ t, onToggle }: { t: Task; onToggle: (id: string) => void }) {
  const client = t.client_id ? getClient(t.client_id) : null
  const done = t.status === 'done'
  const statusColors: Record<string, string> = {
    todo: 'var(--text-3)',
    doing: 'var(--amber)',
    done: 'var(--lime)',
  }
  const sc = statusColors[t.status] || statusColors.todo
  const sl = t.status === 'todo' ? 'To do' : t.status === 'doing' ? 'In progress' : 'Done'

  return (
    <div
      className="row gap-3"
      style={{
        padding: '8px 11px',
        borderRadius: 9,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        alignItems: 'center',
        opacity: done ? 0.55 : 1,
      }}
    >
      <button
        onClick={() => onToggle(t.id)}
        style={{
          width: 16, height: 16, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
          border: `1.5px solid ${done ? 'var(--lime)' : 'var(--border)'}`,
          background: done ? 'var(--lime)' : 'transparent',
          display: 'grid', placeItems: 'center', color: '#0a0a0a',
        }}
      >
        {done && <Icon name="check" size={10} />}
      </button>
      <span
        className="truncate"
        style={{ flex: 1, fontSize: 12.5, color: 'var(--text-2)', textDecoration: done ? 'line-through' : 'none' }}
      >
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
        <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 50, justifyContent: 'center' }}>
          {t.due_date}
        </span>
      )}
    </div>
  )
}

// ---- Objective card ----
function ObjCard({ o, idx }: { o: Objective; idx: number }) {
  const [taskStatuses, setTaskStatuses] = useState<Record<string, string>>({})
  const linkedTasks = TASKS.filter(t => t.objective_id === o.id)
  const pct = Math.round(o.progress * 100)

  function toggleTask(id: string) {
    setTaskStatuses(prev => ({
      ...prev,
      [id]: (prev[id] || (TASKS.find(t => t.id === id)?.status ?? 'todo')) === 'done' ? 'todo' : 'done',
    }))
  }

  function getTaskStatus(t: Task): Task {
    return taskStatuses[t.id] ? { ...t, status: taskStatuses[t.id] } : t
  }

  const measureMeta: Record<string, [string, string]> = {
    krs: ['target', 'Key results'],
    tasks: ['checkSquare', 'Tasks'],
    manual: ['edit', 'Manual'],
  }
  const modeMeta = measureMeta[o.progress_mode] || measureMeta.krs

  return (
    <div
      className="panel fadeup"
      style={{ padding: 20, animationDelay: `${idx * 0.05}s` }}
    >
      {/* header */}
      <div className="row between" style={{ marginBottom: 16, alignItems: 'flex-start' }}>
        <div className="row gap-3" style={{ minWidth: 0 }}>
          <Ring pct={pct} size={52} stroke={5} color={pct >= 100 ? 'var(--lime)' : pct >= 60 ? 'var(--teal)' : 'var(--amber)'}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)' }}>
              {pct}%
            </span>
          </Ring>
          <div className="col" style={{ gap: 4 }}>
            <span style={{ font: '600 16px var(--font-sans)', letterSpacing: '-0.01em', color: 'var(--text)' }}>
              {o.title}
            </span>
            <div className="row gap-2" style={{ color: 'var(--text-3)', fontSize: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <span
                  style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: 'var(--border)', color: 'var(--text-2)',
                    display: 'grid', placeItems: 'center',
                    font: '600 10px var(--font-sans)',
                  }}
                >
                  {(o.owner || 'B')[0]}
                </span>
                {o.owner}
              </span>
              {(o.current_value || o.target_value) && (
                <>
                  <span>·</span>
                  <span className="num">{o.current_value || '—'} / {o.target_value || '—'}</span>
                </>
              )}
              <span>·</span>
              <span className="row gap-2" style={{ alignItems: 'center' }}>
                <Icon name={modeMeta[0]} size={12} />
                {modeMeta[1]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* key results */}
      <div className="col gap-2" style={{ paddingLeft: 4 }}>
        <div className="row between" style={{ marginBottom: 2 }}>
          <span className="eyebrow" style={{ margin: 0 }}>Key results</span>
        </div>
        {(o.key_results || []).map((kr, i) => {
          const prog = krProgress(kr)
          const done = prog >= 1
          const m = kr.measure || 'manual'
          const mMeta: Record<string, [string, string, string]> = {
            manual: ['edit', 'Manual', 'var(--text-3)'],
            tasks: ['checkSquare', 'Tasks', 'var(--teal)'],
            metric: ['pulse', 'Live', 'var(--lime)'],
          }
          const [mIcon, mLabel, mColor] = mMeta[m] || mMeta.manual
          return (
            <div
              key={i}
              className="col gap-2"
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 11,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
              }}
            >
              <div className="row between" style={{ fontSize: 12.5, gap: 10 }}>
                <span className="row gap-2" style={{ color: 'var(--text-2)', minWidth: 0, alignItems: 'center' }}>
                  <span
                    style={{
                      width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                      border: `1px solid ${done ? 'var(--lime)' : 'var(--border)'}`,
                      background: done ? 'var(--lime)' : 'transparent',
                      display: 'grid', placeItems: 'center', color: '#0a0a0a',
                    }}
                  >
                    {done && <Icon name="check" size={10} />}
                  </span>
                  <span className="truncate">{kr.kr}</span>
                </span>
                <span className="row gap-2" style={{ flexShrink: 0, alignItems: 'center' }}>
                  <span
                    className="chip"
                    style={{ background: 'transparent', borderColor: 'var(--border)', color: mColor, height: 20, fontSize: 9.5 }}
                  >
                    <Icon name={mIcon} size={10} />
                    {mLabel}
                  </span>
                  <span className="num" style={{ color: 'var(--text-3)', fontWeight: 600 }}>
                    {kr.current ?? '—'}{' '}
                    <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {kr.target ?? '—'}</span>
                  </span>
                </span>
              </div>
              <div className="prog" style={{ marginLeft: 24 }}>
                <i style={{ width: `${prog * 100}%`, background: done ? 'var(--lime)' : mColor }} />
              </div>
            </div>
          )
        })}
        {(o.key_results || []).length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-3)', padding: '4px 0' }}>
            No key results yet.
          </span>
        )}
      </div>

      {/* linked tasks */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div className="row between" style={{ marginBottom: linkedTasks.length ? 10 : 0 }}>
          <span className="eyebrow" style={{ margin: 0 }}>Linked tasks</span>
        </div>
        {linkedTasks.length ? (
          <div className="col gap-2">
            {linkedTasks.map(t => (
              <ObjTaskRow key={t.id} t={getTaskStatus(t)} onToggle={toggleTask} />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-3)', padding: '6px 0' }}>
            No tasks linked yet.
          </div>
        )}
      </div>
    </div>
  )
}

export default function ObjectivesPage() {
  const [showNewModal, setShowNewModal] = useState(false)

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Objectives' }]} />
      <div className="page-inner" style={{ maxWidth: 940 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">Q3 2026 · {OBJECTIVES.length} objectives</div>
            <div className="h-display" style={{ fontSize: 38 }}>Objectives</div>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
            <Icon name="plus" size={14} />
            New objective
          </button>
        </div>

        {/* objective cards */}
        <div className="col gap-3">
          {OBJECTIVES.map((o, idx) => (
            <ObjCard key={o.id} o={o} idx={idx} />
          ))}
          {OBJECTIVES.length === 0 && (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              No objectives yet.{' '}
              <button
                onClick={() => setShowNewModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
              >
                Set your first one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New objective modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New objective" width={460}>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
            Objective creation coming soon — for now, objectives are seeded from data.
          </p>
          <button className="btn btn-primary" onClick={() => setShowNewModal(false)}>
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
