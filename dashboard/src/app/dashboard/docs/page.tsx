'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { PAGES } from '@/lib/data'
import type { Page } from '@/types'

// ---- Page card ----
function PageCard({ page, onClick }: { page: Page; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="panel"
      style={{
        padding: 16, textAlign: 'left', cursor: 'pointer',
        display: 'flex', gap: 14, alignItems: 'center', width: '100%',
        borderColor: hovered ? 'var(--border-strong, #333)' : 'var(--border)',
        transition: 'border-color .15s',
        background: 'var(--bg-1)',
      }}
    >
      <span
        style={{
          fontSize: 22, width: 40, height: 40, borderRadius: 10,
          display: 'grid', placeItems: 'center',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {page.icon}
      </span>
      <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
        <span className="truncate" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#FFFFFF' }}>
          {page.title}
        </span>
        <div className="row gap-2" style={{ alignItems: 'center' }}>
          {(page.tags || []).slice(0, 2).map(tag => (
            <span key={tag} className="chip chip-dim" style={{ height: 18, fontSize: 9.5 }}>{tag}</span>
          ))}
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Edited recently</span>
        </div>
      </div>
      <Icon name="chevR" size={14} color="var(--text-3)" />
    </button>
  )
}

// ---- Page viewer ----
function PageViewer({ page, onBack }: { page: Page; onBack: () => void }) {
  return (
    <div className="col gap-4" style={{ maxWidth: 720, margin: '0 auto', paddingBottom: 60 }}>
      <button onClick={onBack} className="btn" style={{ width: 'fit-content', height: 30 }}>
        <Icon name="chevL" size={14} />
        All pages
      </button>

      <div className="panel" style={{ padding: '32px 36px' }}>
        {/* icon + title */}
        <div className="col gap-3" style={{ marginBottom: 28 }}>
          <span style={{ fontSize: 44 }}>{page.icon}</span>
          <h1
            style={{
              font: '700 34px var(--font-sans)', letterSpacing: '-0.03em',
              color: '#FFFFFF', margin: 0,
            }}
          >
            {page.title}
          </h1>
          <div className="row gap-2" style={{ alignItems: 'center' }}>
            {(page.tags || []).map(tag => (
              <span key={tag} className="chip chip-dim">{tag}</span>
            ))}
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Edited recently</span>
          </div>
        </div>

        {/* divider */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: 24 }} />

        {/* content placeholder */}
        {(page.content_blocks || []).length === 0 ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
            }}
          >
            <div
              style={{
                width: '60%', height: 20, borderRadius: 6,
                background: 'var(--bg-2)', border: '1px dashed var(--border)',
              }}
            />
            <div
              style={{
                width: '40%', height: 20, borderRadius: 6,
                background: 'var(--bg-2)', border: '1px dashed var(--border)',
              }}
            />
            <p
              style={{
                fontSize: 14, color: 'var(--text-3)',
                marginTop: 12, lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              Start typing to add content…
            </p>
          </div>
        ) : (
          <div className="col gap-3">
            {page.content_blocks.map(block => (
              <div key={block.id} style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.65 }}>
                {block.content}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)

  const visiblePages = PAGES.filter(p => !p.parent_id)
  const sections = Array.from(new Set(visiblePages.map(p => (p.tags || ['General'])[0])))

  if (selectedPage) {
    return (
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Pages', href: '/dashboard/docs' }, { label: selectedPage.title }]} />
        <div className="page-inner">
          <PageViewer page={selectedPage} onBack={() => setSelectedPage(null)} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Pages' }]} />
      <div className="page-inner" style={{ maxWidth: 940 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">Master database · {visiblePages.length} pages</div>
            <div className="h-display" style={{ fontSize: 38 }}>Pages</div>
          </div>
          <button
            onClick={() => {
              // Create a blank new page
              const newPage: Page = {
                id: 'p_new_' + Math.random().toString(36).slice(2, 8),
                title: 'Untitled',
                parent_id: null,
                content_blocks: [],
                theme: 'dark',
                tags: ['Drafts'],
                icon: '📄',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
              setSelectedPage(newPage)
            }}
            className="btn btn-primary"
          >
            <Icon name="plus" size={14} />
            New page
          </button>
        </div>

        {/* sections */}
        {sections.map(section => {
          const sectionPages = visiblePages.filter(p => (p.tags || ['General'])[0] === section)
          return (
            <div key={section} className="col gap-3 fadeup">
              <div className="eyebrow">{section}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {sectionPages.map(p => (
                  <PageCard key={p.id} page={p} onClick={() => setSelectedPage(p)} />
                ))}
              </div>
            </div>
          )
        })}

        {visiblePages.length === 0 && (
          <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            No pages yet.{' '}
            <button
              onClick={() => setSelectedPage({
                id: 'p_new', title: 'Untitled', parent_id: null, content_blocks: [],
                theme: 'dark', tags: ['Draft'], icon: '📄',
                created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
              })}
              style={{ background: 'none', border: 'none', color: 'var(--lime)', cursor: 'pointer', font: 'inherit' }}
            >
              Create your first page →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
