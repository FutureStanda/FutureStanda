'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/shared'
import { RESOURCES } from '@/lib/data'
import type { Resource } from '@/types'

// ---- Type icon map ----
const TYPE_ICON: Record<string, string> = {
  Script: 'msg',
  Creative: 'megaphone',
  SOP: 'checkSquare',
  Sequence: 'layers',
  Doc: 'doc',
  Templates: 'copy',
  Deck: 'grid',
  Playbook: 'target',
  Brand: 'star',
}

// ---- Tag color map ----
const TAG_COLOR: Record<string, string> = {
  Sales: 'chip-lime',
  Ads: 'chip-violet',
  Ops: 'chip-teal',
  Reputation: 'chip-amber',
  Account: 'chip-dim',
  Strategy: 'chip-dim',
  Brand: 'chip-dim',
}

// ---- Resource viewer modal ----
function ResourceViewer({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title={resource.title} width={600}>
      <div style={{ padding: 20 }} className="col gap-4">
        {/* meta row */}
        <div className="row gap-3" style={{ alignItems: 'center' }}>
          <span
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'grid', placeItems: 'center',
              background: 'var(--bg-3)', color: 'var(--lime)',
              border: '1px solid var(--border)', flexShrink: 0,
            }}
          >
            <Icon name={TYPE_ICON[resource.type] || 'doc'} size={16} />
          </span>
          <div className="col" style={{ gap: 3 }}>
            <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>{resource.title}</span>
            <div className="row gap-2">
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{resource.type}</span>
              {resource.tag && (
                <span className={`chip ${TAG_COLOR[resource.tag] || 'chip-dim'}`} style={{ height: 18, fontSize: 9.5 }}>
                  {resource.tag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* body */}
        {resource.body ? (
          <div
            style={{
              padding: '16px 18px', borderRadius: 11,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 12.5, lineHeight: 1.7,
              color: 'var(--text-2)', whiteSpace: 'pre-wrap',
              maxHeight: '60vh', overflowY: 'auto',
            }}
          >
            {resource.body}
          </div>
        ) : (
          <div
            style={{
              padding: 32, borderRadius: 11,
              background: 'var(--bg-2)', border: '1px dashed var(--border)',
              textAlign: 'center', color: 'var(--text-3)',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <div style={{ font: '500 13px var(--font-sans)' }}>No content yet</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Add content to this resource to view it here.</div>
          </div>
        )}

        <div className="row between">
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
            Updated {resource.created_at ? 'recently' : '—'}
          </span>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </Modal>
  )
}

// ---- Resource row ----
function ResourceRow({ resource, onClick }: { resource: Resource; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
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
        <span className="truncate" style={{ font: '500 13px var(--font-sans)', color: 'var(--text)' }}>
          {resource.title}
        </span>
        {resource.body && (
          <span style={{ fontSize: 9.5, color: 'var(--teal)', flexShrink: 0 }}>●</span>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{resource.type}</span>
      {resource.tag ? (
        <span className={`chip ${TAG_COLOR[resource.tag] || 'chip-dim'}`} style={{ width: 'fit-content' }}>
          {resource.tag}
        </span>
      ) : (
        <span />
      )}
      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>recently</span>
      <Icon name="chevR" size={13} color="var(--text-3)" />
    </div>
  )
}

export default function ResourcesPage() {
  const [activeTag, setActiveTag] = useState('All')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<Resource | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  const allTags = ['All', ...Array.from(new Set(RESOURCES.map(r => r.tag).filter(Boolean)))] as string[]

  const filtered = RESOURCES.filter(r => {
    const matchesTag = activeTag === 'All' || r.tag === activeTag
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    return matchesTag && matchesSearch
  })

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Resources' }]} />
      <div className="page-inner" style={{ maxWidth: 1080 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">Master database · {RESOURCES.length} assets</div>
            <div className="h-display" style={{ fontSize: 38 }}>Resources</div>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary">
            <Icon name="plus" size={14} />
            New resource
          </button>
        </div>

        {/* search + filter */}
        <div className="row gap-3" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '0 12px', height: 36,
            }}
          >
            <Icon name="search" size={13} color="var(--text-3)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--text)', fontSize: 13,
                fontFamily: 'var(--font-sans)', width: 200,
              }}
            />
          </div>
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
        </div>

        {/* table */}
        <div className="panel" style={{ overflow: 'hidden' }}>
          {/* header row */}
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
            <ResourceRow key={r.id} resource={r} onClick={() => setViewing(r)} />
          ))}

          {filtered.length === 0 && (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {search ? `No resources matching "${search}"` : 'No resources in this tag.'}
              {' '}
              <button
                onClick={() => setShowNewModal(true)}
                style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
              >
                Add one →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* viewer */}
      {viewing && <ResourceViewer resource={viewing} onClose={() => setViewing(null)} />}

      {/* new resource modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New resource" width={440}>
        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
            Resource creation coming soon. You&apos;ll be able to upload scripts, SOPs, creative packs, and more.
          </p>
          <button className="btn btn-primary" onClick={() => setShowNewModal(false)}>Close</button>
        </div>
      </Modal>
    </div>
  )
}
