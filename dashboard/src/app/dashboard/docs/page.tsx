'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { PAGES } from '@/lib/data'
import { PageEditor } from '@/components/docs/PageEditor'
import { PageAI } from '@/components/docs/PageAI'
import type { Page } from '@/types'
import type { EditorBlock, EditorDoc } from '@/components/docs/PageEditor'

// ─── Sub-page meta (for in-editor sub-page blocks) ────────────────────────────

interface SubPageMeta {
  id: string
  title: string
  icon: string
}

// ─── Page card ────────────────────────────────────────────────────────────────

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
        borderColor: hovered ? 'var(--border-strong)' : 'var(--border)',
        transition: 'border-color .15s',
        background: 'var(--bg-1)',
      }}
    >
      <span style={{
        fontSize: 22, width: 40, height: 40, borderRadius: 10,
        display: 'grid', placeItems: 'center',
        background: 'var(--bg-2)', border: '1px solid var(--border)', flexShrink: 0,
      }}>
        {page.icon}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15, color: '#FFFFFF',
        }}>
          {page.title}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
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

// ─── Editor view (wraps PageEditor + PageAI) ─────────────────────────────────

interface EditorViewProps {
  page: Page
  subPages: SubPageMeta[]
  onBack: () => void
  onOpenSub: (pageId: string) => void
  onNewSubPage: (meta: SubPageMeta) => void
}

function EditorView({ page, subPages, onBack, onOpenSub, onNewSubPage }: EditorViewProps) {
  const [aiOpen, setAiOpen] = useState(false)
  // Track doc state for PageAI access
  const [liveDoc, setLiveDoc] = useState<EditorDoc>(() => {
    try {
      const s = localStorage.getItem('bb_page_' + page.id)
      if (s) return JSON.parse(s) as EditorDoc
    } catch (_e) {}
    return { title: page.title, blocks: [{ id: 'b0', type: 'text', html: '' }], theme: 'dark' }
  })

  function handleInsert(blocks: EditorBlock[]) {
    // Write into localStorage so PageEditor picks it up on next render
    try {
      const s = localStorage.getItem('bb_page_' + page.id)
      const doc: EditorDoc = s ? JSON.parse(s) as EditorDoc : liveDoc
      const updated = { ...doc, blocks: [...doc.blocks, ...blocks] }
      localStorage.setItem('bb_page_' + page.id, JSON.stringify(updated))
      setLiveDoc(updated)
    } catch (_e) {}
    // Signal PageEditor to reload – use a key bump via parent
    setAiOpen(false)
    setTimeout(() => setAiOpen(false), 50)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <div style={{ flex: 1, paddingRight: aiOpen ? 340 : 0, transition: 'padding-right .2s' }}>
        <PageEditor
          pageId={page.id}
          pageTitle={page.title}
          pageIcon={page.icon}
          onBack={onBack}
          onOpenSub={onOpenSub}
          onAIToggle={() => setAiOpen(o => !o)}
          aiOpen={aiOpen}
          subPages={subPages}
          onNewSubPage={onNewSubPage}
        />
      </div>
      {aiOpen && (
        <PageAI
          doc={liveDoc}
          title={page.title}
          onClose={() => setAiOpen(false)}
          onInsert={handleInsert}
        />
      )}
    </div>
  )
}

// ─── Main docs page ───────────────────────────────────────────────────────────

export default function DocsPage() {
  const [pages, setPages] = useState<Page[]>(PAGES)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [subPageRegistry, setSubPageRegistry] = useState<SubPageMeta[]>([])

  const visiblePages = pages.filter(p => !p.parent_id)
  const sections = Array.from(new Set(visiblePages.map(p => (p.tags || ['General'])[0])))

  function createNewPage(): Page {
    return {
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
  }

  function handleNewSubPage(meta: SubPageMeta) {
    setSubPageRegistry(prev => [...prev, meta])
    const newPage: Page = {
      id: meta.id,
      title: meta.title,
      parent_id: selectedPage?.id ?? null,
      content_blocks: [],
      theme: 'dark',
      tags: ['Sub-pages'],
      icon: meta.icon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPages(prev => [...prev, newPage])
  }

  function openPage(page: Page) {
    setSelectedPage(page)
  }

  function openSubPage(pageId: string) {
    const found = pages.find(p => p.id === pageId)
    if (found) setSelectedPage(found)
  }

  // ── Editor view ──
  if (selectedPage) {
    return (
      <div className="page-root" style={{ padding: 0 }}>
        <TopBar crumbs={[
          { label: 'Pages', href: '/dashboard/docs' },
          { label: selectedPage.title },
        ]} />
        <div style={{ padding: '16px 0 0 0' }}>
          <EditorView
            page={selectedPage}
            subPages={subPageRegistry}
            onBack={() => setSelectedPage(null)}
            onOpenSub={openSubPage}
            onNewSubPage={handleNewSubPage}
          />
        </div>
      </div>
    )
  }

  // ── Grid view ──
  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Pages' }]} />
      <div className="page-inner" style={{ maxWidth: 940 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow">Master database · {visiblePages.length} pages</div>
            <div className="h-display" style={{ fontSize: 38 }}>Pages</div>
          </div>
          <button
            onClick={() => {
              const np = createNewPage()
              setPages(prev => [...prev, np])
              setSelectedPage(np)
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
            <div key={section} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="fadeup">
              <div className="eyebrow">{section}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {sectionPages.map(p => (
                  <PageCard key={p.id} page={p} onClick={() => openPage(p)} />
                ))}
              </div>
            </div>
          )
        })}

        {visiblePages.length === 0 && (
          <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
            No pages yet.{' '}
            <button
              onClick={() => {
                const np = createNewPage()
                setPages(prev => [...prev, np])
                setSelectedPage(np)
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--lime)',
                cursor: 'pointer', font: 'inherit',
              }}
            >
              Create your first page →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
