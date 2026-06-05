'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'
import { CLIENTS, OBJECTIVES } from '@/lib/data'
import { useData } from '@/store/use-store'
import type { Task } from '@/types'

interface Props { open: boolean; initial: Partial<Task>; onClose: () => void; onSaved?: () => void }

export function TaskComposer({ open, initial, onClose, onSaved }: Props) {
  const { addTask, updateTask } = useData()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<string>('P2')
  const [status, setStatus] = useState('todo')
  const [category, setCategory] = useState('Internal')
  const [clientId, setClientId] = useState<string>('')
  const [dueDate, setDueDate] = useState('')
  const [assignee, setAssignee] = useState('Bartek')

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setPriority(initial?.priority || 'P2')
      setStatus(initial?.status || 'todo')
      setCategory(initial?.category || 'Internal')
      setClientId(initial?.client_id || '')
      setDueDate(initial?.due_date || '')
      setAssignee(initial?.assignee || 'Bartek')
    }
  }, [open, initial])

  if (!open) return null

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const data: Partial<Task> = { title, priority, status, category, client_id: clientId || null, due_date: dueDate || null, assignee }
    if (initial?.id) updateTask(initial.id, data)
    else addTask(data)
    onSaved?.()
    onClose()
  }

  const inputStyle = { width: '100%', height: 38, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', color: 'var(--text)', font: '400 13.5px var(--font-sans)', outline: 'none' }
  const labelStyle = { display: 'block', font: '500 11.5px var(--font-sans)', color: 'var(--text-2)', marginBottom: 5 } as const

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 500, background: 'var(--bg-2)', border: '1px solid var(--border-strong)', borderRadius: 16, boxShadow: 'var(--shadow-modal)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ font: '600 15px var(--font-sans)' }}>{initial?.id ? 'Edit task' : 'New task'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <form onSubmit={onSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Task title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What needs to be done?" required style={{ ...inputStyle, height: 44 }} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="P0">P0 — Urgent</option>
                <option value="P1">P1 — High</option>
                <option value="P2">P2 — Normal</option>
                <option value="P3">P3 — Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="todo">To do</option>
                <option value="doing">In progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Ads', 'Account', 'Content', 'Sales', 'Reputation', 'Web', 'Strategy', 'Internal'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select value={assignee} onChange={e => setAssignee(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option>Bartek</option>
                <option>Niamh</option>
                <option>Auto</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Client (optional)</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">No client</option>
                {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input value={dueDate} onChange={e => setDueDate(e.target.value)} placeholder="e.g. Today, Mon, Fri" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 2, justifyContent: 'center', height: 40 }}>
              {initial?.id ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
