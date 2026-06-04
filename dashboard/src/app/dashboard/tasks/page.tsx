'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { TaskComposer } from '@/components/overlays/TaskComposer'
import { Segmented, PriorityDot } from '@/components/ui/shared'
import { Icon } from '@/components/ui/icons'
import { useData } from '@/store/use-store'
import { getClient, OBJECTIVES } from '@/lib/data'
import type { Task } from '@/types'

// ---- Category chip colors ----
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
  todo: ['var(--text-3)', 'To do'],
  doing: ['var(--amber)', 'In progress'],
  done: ['var(--lime)', 'Done'],
}

// ---- TaskRow ----
function TaskRow({ t, onToggle, onEdit, onDelete }: { t: Task; onToggle: () => void; onEdit: (t: Task) => void; onDelete: (id: string) => void }) {
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
      {/* Checkbox */}
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

// ---- Workspace view ----
function WorkspaceView({ tasks, onEdit, onToggle, onDelete }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const today = tasks.filter(t => t.status !== 'done' && (t.priority === 'P0' || t.due_date === 'Today'))
  const thisWeek = tasks.filter(t => t.status !== 'done' && t.priority !== 'P0' && t.due_date !== 'Today')
  const doneThisWeek = tasks.filter(t => t.status === 'done')

  function Section({ title, items, accent }: { title: string; items: Task[]; accent?: string }) {
    return (
      <div className="col gap-2">
        <div className="row gap-2" style={{ padding: '2px 2px' }}>
          <span style={{ font: '600 12px var(--font-sans)', color: accent || 'var(--text-2)' }}>{title}</span>
          <span className="chip chip-dim" style={{ fontSize: 10 }}>{items.length}</span>
        </div>
        {items.length > 0 ? (
          items.map(t => (
            <TaskRow key={t.id} t={t} onToggle={() => onToggle(t.id)} onEdit={onEdit} onDelete={onDelete} />
          ))
        ) : (
          <div style={{ padding: '14px 12px', borderRadius: 10, background: 'var(--bg-2)', border: '1px dashed var(--border)', fontSize: 12.5, color: 'var(--text-3)', textAlign: 'center' }}>
            All clear
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="col gap-5">
      <Section title="Today" items={today} accent="var(--red)" />
      <Section title="This week" items={thisWeek} />
      <Section title="Done this week" items={doneThisWeek} accent="var(--lime)" />
    </div>
  )
}

// ---- List view ----
function ListView({ tasks, onEdit, onToggle, onDelete }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
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
          Nothing active here.
        </div>
      )}

      {done.length > 0 && (
        <div className="col gap-2" style={{ marginTop: 10 }}>
          <button
            onClick={() => setShowDone(s => !s)}
            className="row gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', font: '600 12px var(--font-sans)', padding: '4px 2px', width: 'fit-content' }}
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

// ---- Board view ----
function BoardView({ tasks, onEdit, onToggle, onDelete, onNewTask }: { tasks: Task[]; onEdit: (t: Task) => void; onToggle: (id: string) => void; onDelete: (id: string) => void; onNewTask: (status: string) => void }) {
  const { updateTask } = useData()
  const cols = [
    { id: 'todo', label: 'To do', color: 'var(--text-3)' },
    { id: 'doing', label: 'In progress', color: 'var(--amber)' },
    { id: 'done', label: 'Done', color: 'var(--lime)' },
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

// ---- Page ----
export default function TasksPage() {
  const { tasks, toggleTask, removeTask } = useData()
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

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Tasks' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ maxWidth: 1180, margin: '0 auto', paddingBottom: 60, paddingTop: 28 }}>
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
              onChange={setView}
            />
            <button onClick={() => setComposer({})} className="btn btn-primary">
              <Icon name="plus" size={14} />New task
            </button>
          </div>
        </div>

        {/* Filter bar (list + board only) */}
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
            onEdit={t => setComposer(t)}
            onToggle={toggleTask}
            onDelete={removeTask}
          />
        )}
        {view === 'list' && (
          <ListView
            tasks={filtered}
            onEdit={t => setComposer(t)}
            onToggle={toggleTask}
            onDelete={removeTask}
          />
        )}
        {view === 'board' && (
          <BoardView
            tasks={filtered}
            onEdit={t => setComposer(t)}
            onToggle={toggleTask}
            onDelete={removeTask}
            onNewTask={status => setComposer({ status })}
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
