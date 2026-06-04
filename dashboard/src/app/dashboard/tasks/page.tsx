'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { TaskComposer } from '@/components/overlays/TaskComposer'
import { Segmented, PriorityDot } from '@/components/ui/shared'
import { Icon } from '@/components/ui/icons'
import { useData } from '@/store/use-store'
import { getClient, OBJECTIVES, AGENTS_DATA } from '@/lib/data'
import type { Task, Agent } from '@/types'

// ─── Category chip colors ─────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Ads: 'chip-violet',
  Content: 'chip-teal',
  Account: 'chip-amber',
  Sales: 'chip-lime',
  Reputation: 'chip-amber',
  Web: 'chip-teal',
  Strategy: 'chip-violet',
  Internal: 'chip-dim',
}

const STATUS_MAP: Record<string, [string, string]> = {
  todo:   ['var(--text-3)', 'To do'],
  doing:  ['var(--amber)',  'In progress'],
  review: ['var(--violet)', 'In review'],
  done:   ['var(--lime)',   'Done'],
}

// ─── Due bucketing ────────────────────────────────────────────────────────────
function dueBucket(due: string | null): string {
  const d = (due || '').toLowerCase()
  if (d.includes('today') || d.includes('now')) return 'today'
  if (/\btomorrow\b/.test(d) || /\bmon\b|\btue\b|\bwed\b|\bthu\b|\bfri\b|\bsat\b|\bsun\b/.test(d)) {
    return d.includes('next') ? 'month' : 'week'
  }
  if (d.includes('next week') || d.includes('next')) return 'month'
  if (/\d+\s*d/.test(d)) return 'week'
  return 'later'
}

const DUE_LABEL: Record<string, string> = {
  today: 'Due today',
  week:  'This week',
  month: 'This month',
  later: 'Later / no date',
}
const DUE_ORDER = ['today', 'week', 'month', 'later']

// ─── Workspace status tabs ────────────────────────────────────────────────────
const TW_STATUS = [
  { id: 'open',   label: 'Not done',    match: (t: Task) => t.status === 'todo',   color: 'var(--text-3)' },
  { id: 'doing',  label: 'In progress', match: (t: Task) => t.status === 'doing',  color: 'var(--amber)'  },
  { id: 'review', label: 'In review',   match: (t: Task) => t.status === 'review', color: 'var(--violet)' },
  { id: 'done',   label: 'Done',        match: (t: Task) => t.status === 'done',   color: 'var(--lime)'   },
]

// ─── Offload state per task ───────────────────────────────────────────────────
interface OffloadState {
  agentId: string
  agentName: string
  result: string
  status: 'working' | 'review'
}

// ─── TaskRow (List view) ──────────────────────────────────────────────────────
function TaskRow({
  t,
  onToggle,
  onEdit,
  onDelete,
}: {
  t: Task
  onToggle: () => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
}) {
  const [hover, setHover] = useState(false)
  const c = t.client_id ? getClient(t.client_id) : null
  const obj = t.objective_id ? OBJECTIVES.find(o => o.id === t.objective_id) : null
  const done = t.status === 'done'
  const [sc, sl] = STATUS_MAP[t.status] || STATUS_MAP.todo

  return (
    <div
      className="row gap-3"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        alignItems: 'center',
        opacity: done ? 0.5 : 1,
        transition: 'opacity .2s',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
          border: '1.5px solid ' + (done ? 'var(--lime)' : 'var(--border-strong)'),
          background: done ? 'var(--lime)' : 'transparent',
          display: 'grid', placeItems: 'center', color: '#0a0a0a',
        }}
      >
        {done && <Icon name="check" size={11} />}
      </button>

      <PriorityDot p={t.priority} />

      <span
        onClick={() => onEdit(t)}
        style={{
          flex: 1, fontSize: 13, color: 'var(--text-2)',
          textDecoration: done ? 'line-through' : 'none',
          minWidth: 0, cursor: 'pointer',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
      >
        {t.title}
      </span>

      {hover && (
        <>
          <button
            onClick={() => onDelete(t.id)}
            style={{ width: 22, height: 22, border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'transparent' }}
            title="Delete"
          >
            <Icon name="trash" size={13} />
          </button>
          <button
            onClick={() => onEdit(t)}
            style={{ width: 22, height: 22, border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'transparent' }}
            title="Edit"
          >
            <Icon name="edit" size={13} />
          </button>
        </>
      )}

      {obj && (
        <span className="chip chip-dim" title={obj.title} style={{ flexShrink: 0, maxWidth: 130 }}>
          <Icon name="target" size={11} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {obj.title.split(' ').slice(0, 3).join(' ')}…
          </span>
        </span>
      )}

      {c && (
        <span className="row gap-2" style={{ flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }} />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{c.name.split(' ')[0]}</span>
        </span>
      )}

      <span className="chip" style={{ flexShrink: 0, background: 'transparent', borderColor: 'var(--border)', color: sc }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: sc }} />{sl}
      </span>

      <span className={`chip ${CAT_COLOR[t.category] || 'chip-dim'}`} style={{ flexShrink: 0 }}>{t.category}</span>

      <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 52, justifyContent: 'center' }}>
        {t.due_date}
      </span>
    </div>
  )
}

// ─── TWRow (Workspace task row) ───────────────────────────────────────────────
function TWRow({
  t,
  selected,
  onSel,
  onEdit,
  working,
  onOffload,
  onApprove,
  onSendBack,
}: {
  t: Task
  selected: boolean
  onSel: () => void
  onEdit: (t: Task) => void
  working: boolean
  onOffload: () => void
  onApprove: () => void
  onSendBack: () => void
}) {
  const c = t.client_id ? getClient(t.client_id) : null
  const isReview = t.status === 'review'
  const agentResult = (t as Task & { agentResult?: string; agentName?: string }).agentResult
  const agentName = (t as Task & { agentResult?: string; agentName?: string }).agentName

  return (
    <div
      className="col gap-2"
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: selected ? 'var(--bg-active)' : 'var(--bg-2)',
        border: '1px solid ' + (selected ? 'var(--lime)' : isReview ? '#8b7cff44' : 'var(--border)'),
      }}
    >
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <button
          onClick={onSel}
          style={{
            width: 17, height: 17, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
            border: '1.5px solid ' + (selected ? 'var(--lime)' : 'var(--border-strong)'),
            background: selected ? 'var(--lime)' : 'transparent',
            display: 'grid', placeItems: 'center', color: '#0a0a0a',
          }}
        >
          {selected && <Icon name="check" size={10} />}
        </button>

        <PriorityDot p={t.priority} />

        <span
          onClick={() => onEdit(t)}
          style={{
            flex: 1, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer',
            textDecoration: t.status === 'done' ? 'line-through' : 'none',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
        >
          {t.title}
        </span>

        {working && (
          <span className="row gap-2" style={{ fontSize: 11, color: 'var(--violet)', flexShrink: 0 }}>
            <span className="live-dot" style={{ background: 'var(--violet)' }} />
            working…
          </span>
        )}

        {c && (
          <span className="row gap-2" style={{ flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.name.split(' ')[0]}</span>
          </span>
        )}

        {t.assignee && (
          <span className="chip chip-dim" style={{ flexShrink: 0 }}>{t.assignee}</span>
        )}

        <span className="chip chip-dim" style={{ flexShrink: 0, minWidth: 50, justifyContent: 'center' }}>
          {t.due_date}
        </span>

        <button
          onClick={onOffload}
          style={{
            width: 24, height: 24, border: 'none', borderRadius: 6, cursor: 'pointer',
            color: 'var(--text-3)', display: 'grid', placeItems: 'center', flexShrink: 0,
            background: 'transparent',
          }}
          title="Offload to agent"
        >
          <Icon name="sparkle" size={13} />
        </button>
      </div>

      {isReview && agentResult && (
        <div
          className="row gap-2"
          style={{
            padding: '9px 11px', borderRadius: 8,
            background: '#8b7cff12', border: '1px solid #8b7cff2e',
            marginLeft: 28,
          }}
        >
          <span style={{ color: 'var(--violet)', flexShrink: 0 }}>
            <Icon name="sparkle" size={13} />
          </span>
          <div className="col" style={{ gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
              <b style={{ color: '#fff' }}>{agentName || t.assignee}:</b> {agentResult}
            </span>
            <div className="row gap-2">
              <button
                onClick={onApprove}
                className="btn btn-primary"
                style={{ height: 26, fontSize: 11 }}
              >
                <Icon name="check" size={11} />Approve
              </button>
              <button
                onClick={onSendBack}
                className="btn"
                style={{ height: 26, fontSize: 11 }}
              >
                Send back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── OffloadSheet ─────────────────────────────────────────────────────────────
function OffloadSheet({
  ids,
  onPick,
  onClose,
}: {
  ids: string[]
  onPick: (ids: string[], agent: Agent) => void
  onClose: () => void
}) {
  const agents = AGENTS_DATA

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 160,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, maxHeight: '80vh', overflowY: 'auto',
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 20,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        }}
      >
        <div className="row between" style={{ marginBottom: 4 }}>
          <span style={{ font: '600 15px var(--font-sans)' }}>
            Offload {ids.length} task{ids.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ border: 'none', cursor: 'pointer', color: 'var(--text-3)', background: 'transparent' }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '0 0 16px' }}>
          AI agents do the work and hand it back for review.
        </p>

        <div className="eyebrow" style={{ display: 'block', marginBottom: 10 }}>AI Agents</div>
        <div className="col gap-2">
          {agents.map(a => (
            <button
              key={a.id}
              onClick={() => onPick(ids, a)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 11,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                cursor: 'pointer', textAlign: 'left',
                transition: 'background .12s, border-color .12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-3)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              }}
            >
              <span
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'var(--violet)22', color: 'var(--violet)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                  fontSize: 16,
                }}
              >
                {a.avatar}
              </span>
              <div className="col" style={{ gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ font: '600 12.5px var(--font-sans)', color: '#fff' }}>{a.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{a.role}</span>
              </div>
              <Icon name="arrowR" size={14} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── WorkspaceView ────────────────────────────────────────────────────────────
function WorkspaceView({
  tasks,
  onEdit,
  onComposer,
  updateTask,
  removeTask,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onComposer: (initial?: Partial<Task>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
}) {
  const [statusTab, setStatusTab] = useState('open')
  const [groupBy, setGroupBy] = useState<'due' | 'client' | 'assignee' | 'priority' | 'category'>('due')
  const [sel, setSel] = useState<string[]>([])
  const [offloadFor, setOffloadFor] = useState<string[] | null>(null)
  const [workingIds, setWorkingIds] = useState<string[]>([])

  const statusDef = TW_STATUS.find(s => s.id === statusTab)!
  const inStatus = tasks.filter(statusDef.match)

  const counts: Record<string, number> = {}
  TW_STATUS.forEach(s => { counts[s.id] = tasks.filter(s.match).length })

  // Group-by logic
  function groupKey(t: Task): string {
    const c = t.client_id ? getClient(t.client_id) : null
    if (groupBy === 'due') return dueBucket(t.due_date)
    if (groupBy === 'client') return c ? c.name : 'Internal / agency'
    if (groupBy === 'assignee') return t.assignee || 'Unassigned'
    if (groupBy === 'priority') return t.priority || 'P2'
    if (groupBy === 'category') return t.category || 'Other'
    return 'All'
  }

  const groups: Record<string, Task[]> = {}
  inStatus.forEach(t => {
    const k = groupKey(t)
    if (!groups[k]) groups[k] = []
    groups[k].push(t)
  })

  let groupKeys = Object.keys(groups)
  if (groupBy === 'due') {
    groupKeys.sort((a, b) => DUE_ORDER.indexOf(a) - DUE_ORDER.indexOf(b))
  } else {
    groupKeys.sort()
  }

  function toggleSel(id: string) {
    setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }
  function clearSel() { setSel([]) }

  async function offloadToAgent(ids: string[], agent: Agent) {
    setOffloadFor(null)
    clearSel()
    setWorkingIds(w => [...w, ...ids])

    for (const id of ids) {
      const t = tasks.find(x => x.id === id)
      if (!t) continue
      const c = t.client_id ? getClient(t.client_id) : null
      // Simulate 2 second "working" then set result
      await new Promise(resolve => setTimeout(resolve, 2000))
      const mockResult = `I've analyzed this task: "${t.title}"${c ? ` for ${c.name} (${c.niche})` : ''}. My recommendation is to proceed systematically — I've drafted the deliverable and structured it for immediate review. Ready to finalize on your approval.`
      updateTask(id, {
        status: 'review',
        assignee: agent.name,
        ...({ agentResult: mockResult, agentName: agent.name } as unknown as Partial<Task>),
      })
      setWorkingIds(w => w.filter(x => x !== id))
    }
  }

  function bulkAction(action: 'done' | 'delete') {
    if (action === 'done') {
      sel.forEach(id => updateTask(id, { status: 'done' }))
    } else {
      sel.forEach(id => removeTask(id))
    }
    clearSel()
  }

  const GROUP_BY_OPTIONS: Array<[string, string]> = [
    ['due', 'Due'],
    ['client', 'Client'],
    ['assignee', 'Assignee'],
    ['priority', 'Priority'],
    ['category', 'Category'],
  ]

  return (
    <div className="col gap-4">
      {/* Status tabs */}
      <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
        {TW_STATUS.map(s => (
          <button
            key={s.id}
            onClick={() => { setStatusTab(s.id); clearSel() }}
            className="chip"
            style={{
              height: 32, cursor: 'pointer',
              background: statusTab === s.id ? 'var(--bg-active)' : 'var(--bg-2)',
              borderColor: statusTab === s.id ? s.color : 'var(--border)',
              color: statusTab === s.id ? '#fff' : 'var(--text-3)',
              fontWeight: statusTab === s.id ? 600 : 500,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 99, background: s.color, flexShrink: 0 }} />
            {s.label}
            <span className="chip chip-dim" style={{ fontSize: 9.5, height: 16 }}>{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {/* Group-by selector */}
      <div className="row gap-2" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="eyebrow" style={{ margin: 0 }}>Group by</span>
        {GROUP_BY_OPTIONS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => setGroupBy(v as typeof groupBy)}
            className="chip"
            style={{
              height: 28, cursor: 'pointer',
              background: groupBy === v ? 'var(--lime)' : 'var(--bg-2)',
              color: groupBy === v ? '#0a0a0a' : 'var(--text-2)',
              borderColor: groupBy === v ? 'var(--lime)' : 'var(--border)',
              fontWeight: groupBy === v ? 600 : 500,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {groupKeys.length === 0 && (
        <div
          className="panel"
          style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}
        >
          Nothing here.{' '}
          <button
            onClick={() => onComposer({})}
            style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
          >
            Add one →
          </button>
        </div>
      )}

      {/* Groups */}
      {groupKeys.map(k => (
        <div key={k} className="col gap-2">
          {/* Group header */}
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            <span style={{ font: '600 12px var(--font-sans)', color: '#fff' }}>
              {groupBy === 'due' ? DUE_LABEL[k] : k}
            </span>
            <span className="chip chip-dim">{groups[k].length}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {/* Task rows */}
          <div className="col gap-2">
            {groups[k].map(t => (
              <TWRow
                key={t.id}
                t={t}
                selected={sel.includes(t.id)}
                onSel={() => toggleSel(t.id)}
                onEdit={onEdit}
                working={workingIds.includes(t.id)}
                onOffload={() => setOffloadFor([t.id])}
                onApprove={() => updateTask(t.id, { status: 'done' })}
                onSendBack={() => updateTask(t.id, { status: 'todo', ...({ agentResult: null, agentName: null } as unknown as Partial<Task>) })}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Bulk action bar */}
      {sel.length > 0 && (
        <div
          style={{
            position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-1)', border: '1px solid var(--border-strong)',
            borderRadius: 14, padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 100,
          }}
        >
          <span style={{ fontSize: 12.5, color: '#fff', fontWeight: 600 }}>{sel.length} selected</span>
          <div className="row gap-2">
            <button
              onClick={() => setOffloadFor([...sel])}
              className="btn btn-primary"
              style={{ height: 30 }}
            >
              <Icon name="sparkle" size={13} />Offload
            </button>
            <button
              onClick={() => bulkAction('done')}
              className="btn"
              style={{ height: 30 }}
            >
              <Icon name="check" size={13} />Complete
            </button>
            <button
              onClick={() => bulkAction('delete')}
              className="btn"
              style={{ height: 30, color: 'var(--red)' }}
            >
              <Icon name="trash" size={13} />Delete
            </button>
            <button
              onClick={clearSel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 12 }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Offload sheet */}
      {offloadFor && (
        <OffloadSheet
          ids={offloadFor}
          onPick={offloadToAgent}
          onClose={() => setOffloadFor(null)}
        />
      )}
    </div>
  )
}

// ─── ListView ─────────────────────────────────────────────────────────────────
function ListView({
  tasks,
  onEdit,
  onToggle,
  onDelete,
  onComposer,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onComposer: (initial?: Partial<Task>) => void
}) {
  const [showDone, setShowDone] = useState(false)
  const active = tasks.filter(t => t.status !== 'done')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div className="col gap-2">
      {active.length > 0 ? (
        active.map(t => (
          <TaskRow key={t.id} t={t} onToggle={() => onToggle(t.id)} onEdit={onEdit} onDelete={onDelete} />
        ))
      ) : (
        <div className="panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)' }}>
          Nothing here.{' '}
          <button
            onClick={() => onComposer({})}
            style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
          >
            Add one →
          </button>
        </div>
      )}

      {done.length > 0 && (
        <div className="col gap-2" style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowDone(s => !s)}
            className="row gap-2"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', font: '600 12px var(--font-sans)',
              padding: '4px 2px', width: 'fit-content',
            }}
          >
            <span style={{ display: 'inline-flex', transform: showDone ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
              <Icon name="chevR" size={13} />
            </span>
            <Icon name="check" size={13} />
            Completed · {done.length}
            <span className="chip chip-dim" style={{ fontSize: 9.5 }}>archived</span>
          </button>
          {showDone && (
            <div className="col gap-2">
              {done.map(t => (
                <TaskRow key={t.id} t={t} onToggle={() => onToggle(t.id)} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BoardView ────────────────────────────────────────────────────────────────
function BoardView({
  tasks,
  onEdit,
  onNewTask,
  updateTask,
}: {
  tasks: Task[]
  onEdit: (t: Task) => void
  onNewTask: (status: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
}) {
  const cols = [
    { id: 'todo',  label: 'To do',       color: 'var(--text-3)' },
    { id: 'doing', label: 'In progress', color: 'var(--amber)'  },
    { id: 'done',  label: 'Done',        color: 'var(--lime)'   },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, alignItems: 'flex-start' }}>
      {cols.map((col, ci) => {
        const items = tasks.filter(t => t.status === col.id)
        return (
          <div key={col.id} className="panel" style={{ padding: 14 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <span className="row gap-2" style={{ font: '600 12.5px var(--font-sans)' }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: col.color }} />
                {col.label}
              </span>
              <span className="chip chip-dim">{items.length}</span>
            </div>
            <div className="col gap-2">
              {items.map(t => {
                const c = t.client_id ? getClient(t.client_id) : null
                return (
                  <div
                    key={t.id}
                    className="col gap-2"
                    style={{ padding: 12, borderRadius: 10, background: 'var(--bg-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <PriorityDot p={t.priority} />
                      <span
                        onClick={() => onEdit(t)}
                        style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.4, flex: 1, cursor: 'pointer' }}
                      >
                        {t.title}
                      </span>
                    </div>
                    <div className="row between">
                      {c ? (
                        <span className="row gap-2">
                          <span style={{ width: 6, height: 6, borderRadius: 2, background: c.color }} />
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.name.split(' ')[0]}</span>
                        </span>
                      ) : (
                        <span className="chip chip-dim">Internal</span>
                      )}
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.due_date}</span>
                        <div className="row" style={{ gap: 2 }}>
                          {ci > 0 && (
                            <button
                              onClick={() => updateTask(t.id, { status: cols[ci - 1].id })}
                              title={`Move to ${cols[ci - 1].label}`}
                              style={{ width: 20, height: 20, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: 'var(--bg-3)', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}
                            >
                              <Icon name="chevL" size={11} />
                            </button>
                          )}
                          {ci < cols.length - 1 && (
                            <button
                              onClick={() => updateTask(t.id, { status: cols[ci + 1].id })}
                              title={`Move to ${cols[ci + 1].label}`}
                              style={{ width: 20, height: 20, border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', background: 'var(--bg-3)', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}
                            >
                              <Icon name="chevR" size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => onNewTask(col.id)}
                className="row gap-2"
                style={{
                  width: '100%', justifyContent: 'center', padding: '8px 0',
                  background: 'none', border: '1px dashed var(--border-strong)', borderRadius: 9,
                  cursor: 'pointer', color: 'var(--text-3)', font: '500 11.5px var(--font-sans)',
                }}
              >
                <Icon name="plus" size={13} />Add
              </button>
              {!items.length && (
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
                  Nothing here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { tasks, toggleTask, removeTask, updateTask } = useData()
  const [view, setView] = useState<'workspace' | 'list' | 'board'>('workspace')
  const [filter, setFilter] = useState('All')
  const [composer, setComposer] = useState<Partial<Task> | null>(null)

  const cats = ['All', 'P0', 'Ads', 'Account', 'Content', 'Sales']

  const filtered = tasks.filter(t => {
    if (filter === 'All') return true
    if (filter === 'P0') return t.priority === 'P0'
    return t.category === filter
  })

  const openCount = tasks.filter(t => t.status !== 'done').length
  const p0Count = tasks.filter(t => t.priority === 'P0' && t.status !== 'done').length

  function openComposer(initial?: Partial<Task>) {
    setComposer(initial ?? {})
  }

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Tasks' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ paddingTop: 28 }}>
        {/* Header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">{openCount} open · {p0Count} urgent</div>
            <h1 className="h-display" style={{ fontSize: 38, margin: 0 }}>Tasks</h1>
          </div>
          <div className="row gap-2">
            <Segmented
              options={[
                { value: 'workspace' as const, label: 'Workspace' },
                { value: 'list' as const, label: 'List' },
                { value: 'board' as const, label: 'Board' },
              ]}
              value={view}
              onChange={v => setView(v as 'workspace' | 'list' | 'board')}
            />
            <button onClick={() => openComposer({})} className="btn btn-primary">
              <Icon name="plus" size={14} />New task
            </button>
          </div>
        </div>

        {/* Filter bar — list + board only */}
        {view !== 'workspace' && (
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {cats.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="chip"
                style={{
                  height: 30, cursor: 'pointer',
                  background: filter === f ? 'var(--lime)' : 'var(--bg-2)',
                  color: filter === f ? '#0a0a0a' : 'var(--text-2)',
                  borderColor: filter === f ? 'var(--lime)' : 'var(--border)',
                  fontWeight: filter === f ? 600 : 500,
                }}
              >
                {f === 'P0' && (
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: filter === f ? '#0a0a0a' : 'var(--red)', flexShrink: 0 }} />
                )}
                {f}
              </button>
            ))}
          </div>
        )}

        {/* Views */}
        {view === 'workspace' && (
          <WorkspaceView
            tasks={tasks}
            onEdit={t => openComposer(t)}
            onComposer={openComposer}
            updateTask={updateTask}
            removeTask={removeTask}
          />
        )}
        {view === 'list' && (
          <ListView
            tasks={filtered}
            onEdit={t => openComposer(t)}
            onToggle={toggleTask}
            onDelete={removeTask}
            onComposer={openComposer}
          />
        )}
        {view === 'board' && (
          <BoardView
            tasks={filtered}
            onEdit={t => openComposer(t)}
            onNewTask={status => openComposer({ status })}
            updateTask={updateTask}
          />
        )}
      </div>

      <TaskComposer
        open={!!composer}
        initial={composer ?? {}}
        onClose={() => setComposer(null)}
      />
    </div>
  )
}
