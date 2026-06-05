'use client'

import React, { useState, useRef, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { RESOURCES } from '@/lib/data'
import type { Resource } from '@/types'

// ---- Type icon map ----
const TYPE_ICON: Record<string, string> = {
  Script: 'doc',
  Creative: 'layers',
  SOP: 'checkSquare',
  Sequence: 'mail',
  Doc: 'doc',
  Templates: 'copy',
  Deck: 'grid',
  Playbook: 'doc',
  Brand: 'sparkle',
}

// ---- Tag color map ----
const TAG_COLOR: Record<string, string> = {
  Sales: 'chip-lime',
  Ads: 'chip-violet',
  Ops: 'chip-teal',
  Reputation: 'chip-amber',
  Account: 'chip-dim',
  Strategy: 'chip-violet',
  Brand: 'chip-dim',
}

const RES_TYPES = ['Script', 'Creative', 'SOP', 'Sequence', 'Doc', 'Templates', 'Deck', 'Playbook', 'Brand']
const RES_TAGS = ['Sales', 'Ads', 'Ops', 'Reputation', 'Account', 'Strategy', 'Brand']

// ---- Modal form for create/edit ----
interface ModalFormState {
  title: string
  type: string
  tag: string
  body: string
}

function ResourceModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean
  initial: Partial<Resource> | null
  onClose: () => void
  onSaved: (r: Resource) => void
}) {
  const editing = !!(initial && initial.id)
  const [f, setF] = useState<ModalFormState>({ title: '', type: 'Doc', tag: 'Ops', body: '' })
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setF({
        title: initial?.title || '',
        type: initial?.type || 'Doc',
        tag: initial?.tag || 'Ops',
        body: initial?.body || '',
      })
      setTimeout(() => titleRef.current?.focus(), 30)
    }
  }, [open])

  if (!open) return null

  const set = (k: keyof ModalFormState, v: string) => setF(s => ({ ...s, [k]: v }))
  const ready = f.title.trim().length > 0

  function save() {
    if (!ready) return
    if (editing && initial?.id) {
      const updated: Resource = {
        ...initial as Resource,
        title: f.title.trim(),
        type: f.type,
        tag: f.tag,
        body: f.body || null,
      }
      onSaved(updated)
    } else {
      const created: Resource = {
        id: 'res_' + Date.now().toString(36),
        title: f.title.trim(),
        type: f.type,
        tag: f.tag,
        body: f.body || null,
        created_at: new Date().toISOString(),
      }
      onSaved(created)
    }
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text)',
    font: '400 14px var(--font-sans)',
    padding: '11px 13px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#cfff3a66'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.target.style.borderColor = 'var(--border)'
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 150,
        background: '#04050588', backdropFilter: 'blur(7px)',
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fadeup col"
        style={{
          width: 580, maxHeight: '88vh',
          background: 'var(--bg-1)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          boxShadow: '0 30px 90px #000c',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="row between" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3">
            <span
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'var(--lime)', color: '#0a0a0a',
                display: 'grid', placeItems: 'center',
              }}
            >
              <Icon name={TYPE_ICON[f.type] || 'doc'} size={14} />
            </span>
            <span style={{ font: '600 15px var(--font-sans)' }}>
              {editing ? 'Edit resource' : 'New resource'}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'grid', placeItems: 'center', color: 'var(--text-3)',
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="col gap-4" style={{ padding: 22, overflowY: 'auto' }}>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>Title</label>
            <input
              ref={titleRef}
              value={f.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Discovery-call script v2"
              onFocus={onFocus}
              onBlur={onBlur}
              style={inp}
              onKeyDown={e => { if (e.key === 'Enter') save() }}
            />
          </div>
          <div className="row gap-3">
            <div className="col gap-2 flex-1">
              <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>Type</label>
              <select
                value={f.type}
                onChange={e => set('type', e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                style={{ ...inp, cursor: 'pointer' }}
              >
                {RES_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="col gap-2 flex-1">
              <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>Tag</label>
              <select
                value={f.tag}
                onChange={e => set('tag', e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                style={{ ...inp, cursor: 'pointer' }}
              >
                {RES_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="col gap-2">
            <label style={{ fontSize: 11.5, color: 'var(--text-2)', fontWeight: 500 }}>Content</label>
            <textarea
              value={f.body}
              onChange={e => set('body', e.target.value)}
              placeholder="Write the script, checklist, SOP, templates…"
              onFocus={onFocus}
              onBlur={onBlur}
              rows={9}
              style={{
                ...inp,
                resize: 'vertical',
                minHeight: 150,
                lineHeight: 1.55,
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="row between" style={{ padding: '13px 22px', borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <button onClick={onClose} className="btn">Cancel</button>
          <button
            onClick={save}
            disabled={!ready}
            className="btn btn-primary"
            style={{ opacity: ready ? 1 : 0.5, cursor: ready ? 'pointer' : 'not-allowed' }}
          >
            <Icon name="check" size={14} />
            {editing ? 'Save changes' : 'Create resource'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Resource viewer drawer ----
function ResourceViewer({
  resource,
  onClose,
  onEdit,
  onDelete,
}: {
  resource: Resource
  onClose: () => void
  onEdit: (r: Resource) => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    try { navigator.clipboard.writeText(resource.body || '') } catch (e) {}
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDelete() {
    if (confirm(`Delete "${resource.title}"?`)) {
      onDelete(resource.id)
      onClose()
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fadeup"
        style={{
          width: 540, height: '100%',
          background: 'var(--bg-1)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Head */}
        <div
          className="row between"
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div className="row gap-3" style={{ minWidth: 0 }}>
            <span
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--bg-2)', color: 'var(--lime)',
                border: '1px solid var(--border)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
              }}
            >
              <Icon name={TYPE_ICON[resource.type] || 'doc'} size={16} />
            </span>
            <div className="col" style={{ gap: 3, minWidth: 0 }}>
              <span style={{ font: '600 16px var(--font-sans)', color: 'var(--text)' }}>
                {resource.title}
              </span>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                <span className={`chip ${TAG_COLOR[resource.tag || ''] || 'chip-dim'}`}>
                  {resource.tag}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
                  {resource.type} · {new Date(resource.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'grid', placeItems: 'center', color: 'var(--text-3)',
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {resource.body ? (
            <div className="col gap-3">
              <div className="row between">
                <span style={{ font: '600 11px var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                  Content
                </span>
                <button
                  onClick={copy}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copied ? 'var(--lime)' : 'var(--text-3)',
                    font: '600 11.5px var(--font-sans)',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Icon name={copied ? 'check' : 'copy'} size={13} />
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div
                style={{
                  whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.65,
                  color: 'var(--text-2)', background: 'var(--bg-2)',
                  border: '1px solid var(--border)', borderRadius: 12,
                  padding: '16px 18px',
                }}
              >
                {resource.body}
              </div>
            </div>
          ) : (
            <div
              className="col gap-2"
              style={{ alignItems: 'center', textAlign: 'center', padding: '40px 0' }}
            >
              <span
                style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                  color: 'var(--text-3)', display: 'grid', placeItems: 'center',
                }}
              >
                <Icon name="doc" size={18} />
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)' }}>No content yet.</span>
              <button
                onClick={() => onEdit(resource)}
                className="btn"
                style={{ height: 32, marginTop: 4 }}
              >
                <Icon name="edit" size={13} />Add content
              </button>
            </div>
          )}
        </div>

        {/* Footer with Edit + Delete */}
        <div
          className="row between"
          style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            background: 'var(--bg-2)', flexShrink: 0,
          }}
        >
          <button
            onClick={handleDelete}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--red)', font: '500 12.5px var(--font-sans)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Icon name="trash" size={13} />Delete
          </button>
          <button
            onClick={() => onEdit(resource)}
            className="btn btn-primary"
            style={{ height: 32 }}
          >
            <Icon name="edit" size={13} />Edit
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Page ----
export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([...RESOURCES])
  const [activeTag, setActiveTag] = useState('All')
  const [viewing, setViewing] = useState<Resource | null>(null)
  const [editTarget, setEditTarget] = useState<Partial<Resource> | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const allTags = ['All', ...Array.from(new Set(resources.map(r => r.tag).filter(Boolean)))] as string[]
  const filtered = resources.filter(r => activeTag === 'All' || r.tag === activeTag)

  function openNew(prefillTag?: string) {
    setEditTarget(prefillTag ? { tag: prefillTag } : {})
    setEditOpen(true)
  }

  function openEdit(r: Resource) {
    setViewing(null)
    setEditTarget(r)
    setEditOpen(true)
  }

  function handleSaved(r: Resource) {
    if (editTarget && (editTarget as Resource).id) {
      // editing existing
      setResources(prev => prev.map(x => x.id === r.id ? r : x))
      setViewing(r)
    } else {
      // new resource — prepend
      setResources(prev => [r, ...prev])
      setViewing(r)
    }
  }

  function handleDelete(id: string) {
    setResources(prev => prev.filter(r => r.id !== id))
    setViewing(null)
  }

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Resources' }]} />
      <div className="page-inner col gap-4 fadeup" style={{ maxWidth: 1080 }}>

        {/* Header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">Master database · {resources.length} assets</div>
            <div className="h-display" style={{ fontSize: 38 }}>Resources</div>
          </div>
          <button onClick={() => openNew()} className="btn btn-primary">
            <Icon name="plus" size={14} />
            New resource
          </button>
        </div>

        {/* Tag filter chips only — no search bar */}
        <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
          {allTags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className="chip"
              style={{
                height: 30, cursor: 'pointer',
                background: activeTag === t ? 'var(--lime)' : 'var(--bg-2)',
                color: activeTag === t ? '#0a0a0a' : 'var(--text-2)',
                borderColor: activeTag === t ? 'var(--lime)' : 'var(--border)',
                fontWeight: activeTag === t ? 600 : 500,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2.4fr 1fr 1fr 0.9fr 0.4fr',
              gap: 12, padding: '10px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-2)',
            }}
          >
            {['Name', 'Type', 'Tag', 'Updated', ''].map((h, i) => (
              <span key={i} className="eyebrow" style={{ fontSize: 10 }}>{h}</span>
            ))}
          </div>

          {filtered.map(r => (
            <ResourceRow
              key={r.id}
              resource={r}
              onClick={() => setViewing(r)}
              onEdit={e => { e.stopPropagation(); openEdit(r) }}
            />
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No resources in this tag.{' '}
              <button
                onClick={() => openNew(activeTag === 'All' ? undefined : activeTag)}
                style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
              >
                Add one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Resource viewer drawer */}
      {viewing && (
        <ResourceViewer
          resource={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Create / edit modal */}
      <ResourceModal
        open={editOpen}
        initial={editTarget}
        onClose={() => { setEditOpen(false); setEditTarget(null) }}
        onSaved={handleSaved}
      />
    </div>
  )
}

// ---- Resource row (no dot indicator, uses created_at for date) ----
function ResourceRow({
  resource,
  onClick,
  onEdit,
}: {
  resource: Resource
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  const dateStr = resource.created_at
    ? new Date(resource.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
    : '—'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '2.4fr 1fr 1fr 0.9fr 0.4fr',
        gap: 12, padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center', cursor: 'pointer',
        background: hovered ? 'var(--bg-2)' : 'transparent',
        transition: 'background .1s',
      }}
    >
      <div className="row gap-3" style={{ minWidth: 0 }}>
        <span
          style={{
            width: 28, height: 28, borderRadius: 8,
            display: 'grid', placeItems: 'center',
            background: 'var(--bg-2)', color: 'var(--lime)',
            border: '1px solid var(--border)', flexShrink: 0,
          }}
        >
          <Icon name={TYPE_ICON[resource.type] || 'doc'} size={13} />
        </span>
        <span
          style={{
            font: '500 13px var(--font-sans)', color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
        >
          {resource.title}
        </span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{resource.type}</span>
      {resource.tag ? (
        <span className={`chip ${TAG_COLOR[resource.tag] || 'chip-dim'}`} style={{ width: 'fit-content' }}>
          {resource.tag}
        </span>
      ) : (
        <span />
      )}
      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{dateStr}</span>
      <button
        onClick={onEdit}
        style={{
          width: 26, height: 26, border: 'none', borderRadius: 7,
          cursor: 'pointer', color: 'var(--text-3)',
          display: 'grid', placeItems: 'center', justifySelf: 'end',
          background: 'transparent',
        }}
        title="Edit"
      >
        <Icon name="edit" size={13} />
      </button>
    </div>
  )
}
