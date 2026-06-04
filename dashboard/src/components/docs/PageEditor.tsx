'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditorBlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'toggle'
  | 'callout'
  | 'quote'
  | 'divider'
  | 'subpage'

export interface EditorBlock {
  id: string
  type: EditorBlockType
  html: string
  checked?: boolean
  open?: boolean
  body?: string
  emoji?: string
  color?: string
  pageId?: string
  pageTitle?: string
  pageIcon?: string
}

export interface EditorDoc {
  title: string
  blocks: EditorBlock[]
  theme: 'dark' | 'paper'
}

interface SubPageMeta {
  id: string
  title: string
  icon: string
}

interface PageEditorProps {
  pageId: string
  pageTitle: string
  pageIcon: string
  onBack: () => void
  onOpenSub: (pageId: string) => void
  onAIToggle?: () => void
  aiOpen?: boolean
  subPages?: SubPageMeta[]
  onNewSubPage?: (meta: SubPageMeta) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function loadDoc(pageId: string, title: string): EditorDoc {
  try {
    const s = localStorage.getItem('bb_page_' + pageId)
    if (s) return JSON.parse(s) as EditorDoc
  } catch (_e) {}
  return {
    title,
    theme: 'dark',
    blocks: [{ id: uid(), type: 'text', html: '' }],
  }
}

function saveDoc(pageId: string, doc: EditorDoc): void {
  try {
    localStorage.setItem('bb_page_' + pageId, JSON.stringify(doc))
  } catch (_e) {}
}

function placeCaretEnd(el: HTMLElement): void {
  try {
    const r = document.createRange()
    r.selectNodeContents(el)
    r.collapse(false)
    const s = window.getSelection()
    s?.removeAllRanges()
    s?.addRange(r)
  } catch (_e) {}
}

const CALLOUT_EMOJIS = ['💡', '🎯', '🚀', '📲', '💳', '🛡️', '🏆', '🎉', '📅', '👋', '🧱', '💭', '✍️']
const CALLOUT_COLORS = [
  { id: 'plain', label: '—' },
  { id: 'green', label: 'Green' },
  { id: 'amber', label: 'Amber' },
  { id: 'red', label: 'Red' },
  { id: 'lime', label: 'Lime' },
  { id: 'blue', label: 'Blue' },
]

function calloutBorderColor(color: string): string {
  switch (color) {
    case 'green': return '#4FE3C1'
    case 'red': return '#FF6B5C'
    case 'amber': return '#FFB547'
    case 'lime': return '#CFFF3A'
    case 'blue': return '#5BCEFA'
    default: return 'transparent'
  }
}

function calloutSwatchBg(id: string): string {
  switch (id) {
    case 'lime': return '#CFFF3A'
    case 'blue': return '#5BCEFA'
    case 'green': return '#4FE3C1'
    case 'red': return '#FF6B5C'
    case 'amber': return '#FFB547'
    default: return 'var(--pg-co)'
  }
}

// ─── Block type menu ──────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: EditorBlockType | 'ai'; label: string; icon: string; hint: string }[] = [
  { type: 'text', label: 'Text', icon: 'doc', hint: 'Plain paragraph' },
  { type: 'h1', label: 'Heading 1', icon: 'hash', hint: 'Big section' },
  { type: 'h2', label: 'Heading 2', icon: 'hash', hint: 'Medium section' },
  { type: 'h3', label: 'Heading 3', icon: 'hash', hint: 'Small section' },
  { type: 'bullet', label: 'Bulleted list', icon: 'list', hint: '• item' },
  { type: 'numbered', label: 'Numbered list', icon: 'list', hint: '1. item' },
  { type: 'todo', label: 'To-do', icon: 'checkSquare', hint: 'Checkbox' },
  { type: 'toggle', label: 'Toggle', icon: 'chevR', hint: 'Collapsible' },
  { type: 'callout', label: 'Callout', icon: 'bell', hint: 'Highlighted box' },
  { type: 'quote', label: 'Quote', icon: 'msg', hint: 'Indented quote' },
  { type: 'divider', label: 'Divider', icon: 'list', hint: 'Horizontal line' },
  { type: 'subpage', label: 'Sub-page', icon: 'doc', hint: 'Page inside this page' },
  { type: 'ai', label: 'Ask AI to write…', icon: 'sparkle', hint: 'Generate with AI' },
]

interface BlockMenuProps {
  onPick: (type: EditorBlockType | 'ai') => void
  onClose: () => void
}

function BlockMenu({ onPick, onClose }: BlockMenuProps) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 20)
  }, [])

  const items = BLOCK_TYPES.filter(t =>
    t.label.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 60 }}
      />
      <div
        style={{
          position: 'absolute',
          zIndex: 61,
          top: 28,
          left: 0,
          width: 260,
          padding: 6,
          background: 'var(--bg-1)',
          border: '1px solid var(--border-strong)',
          borderRadius: 12,
          boxShadow: '0 16px 50px rgba(0,0,0,0.7)',
          maxHeight: 320,
          overflowY: 'auto',
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setSel(0) }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, items.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
            else if (e.key === 'Enter') { e.preventDefault(); if (items[sel]) onPick(items[sel].type) }
            else if (e.key === 'Escape') onClose()
          }}
          placeholder="Filter blocks…"
          style={{
            width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)',
            borderRadius: 8, color: 'var(--text)', font: '400 12.5px var(--font-sans)',
            padding: '8px 10px', outline: 'none', marginBottom: 6, boxSizing: 'border-box',
          }}
        />
        {items.map((t, i) => (
          <button
            key={t.type}
            onMouseEnter={() => setSel(i)}
            onClick={() => onPick(t.type)}
            style={{
              display: 'flex', gap: 10, alignItems: 'center', width: '100%',
              padding: '7px 9px', borderRadius: 7, border: 'none',
              background: i === sel ? 'var(--bg-active)' : 'transparent',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: 'var(--bg-2)',
              color: t.type === 'ai' ? 'var(--lime)' : 'var(--text-3)',
              border: '1px solid var(--border)',
            }}>
              <Icon name={t.icon} size={13} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <span style={{ font: '600 12px var(--font-sans)', color: 'var(--text)' }}>{t.label}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{t.hint}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

// ─── Inline toolbar ───────────────────────────────────────────────────────────

interface ToolbarPos { x: number; y: number }

function useInlineToolbar(wrapRef: React.RefObject<HTMLDivElement | null>): [ToolbarPos | null, React.Dispatch<React.SetStateAction<ToolbarPos | null>>] {
  const [tb, setTb] = useState<ToolbarPos | null>(null)

  useEffect(() => {
    function onUp() {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setTb(null); return }
      const node = sel.anchorNode
      const testNode = node?.nodeType === 3 ? node.parentNode : node
      if (!node || !wrapRef.current?.contains(testNode as Node)) { setTb(null); return }
      const r = sel.getRangeAt(0).getBoundingClientRect()
      if (!r.width) { setTb(null); return }
      setTb({ x: r.left + r.width / 2, y: r.top - 44 })
    }
    document.addEventListener('mouseup', onUp)
    document.addEventListener('keyup', onUp)
    return () => {
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('keyup', onUp)
    }
  }, [wrapRef])

  return [tb, setTb]
}

interface InlineToolbarProps {
  tb: ToolbarPos | null
  onCmd: (cmd: string) => void
  onColor: (color: string | null) => void
}

function InlineToolbar({ tb, onCmd, onColor }: InlineToolbarProps) {
  if (!tb) return null
  const colors: [string, string][] = [['#CFFF3A', 'lime'], ['#4FE3C1', 'green'], ['#FF6B5C', 'red'], ['#FFB547', 'amber']]

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.max(80, tb.x - 100),
        top: Math.max(8, tb.y),
        zIndex: 200,
        display: 'flex',
        gap: 1,
        background: '#1A1E1A',
        border: '1px solid #2C312C',
        borderRadius: 9,
        padding: 4,
        boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
      }}
      onMouseDown={e => e.preventDefault()}
    >
      <button onClick={() => onCmd('bold')} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#D4D7CE', cursor: 'pointer', borderRadius: 6, font: '800 13px var(--font-sans)', display: 'grid', placeItems: 'center' }} title="Bold">B</button>
      <button onClick={() => onCmd('italic')} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#D4D7CE', cursor: 'pointer', borderRadius: 6, font: '600 13px var(--font-sans)', fontStyle: 'italic', display: 'grid', placeItems: 'center' }} title="Italic">i</button>
      <button onClick={() => onCmd('underline')} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#D4D7CE', cursor: 'pointer', borderRadius: 6, font: '600 13px var(--font-sans)', textDecoration: 'underline', display: 'grid', placeItems: 'center' }} title="Underline">U</button>
      <button onClick={() => onCmd('strikeThrough')} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#D4D7CE', cursor: 'pointer', borderRadius: 6, font: '600 13px var(--font-sans)', textDecoration: 'line-through', display: 'grid', placeItems: 'center' }} title="Strikethrough">S</button>
      <div style={{ width: 1, background: '#2C312C', margin: '0 3px' }} />
      <button onClick={() => onColor(null)} style={{ width: 28, height: 28, border: 'none', background: 'transparent', color: '#8E938A', cursor: 'pointer', borderRadius: 6, font: '600 13px var(--font-sans)', display: 'grid', placeItems: 'center' }} title="Default color">A</button>
      {colors.map(([c]) => (
        <button
          key={c}
          onClick={() => onColor(c)}
          style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 6, display: 'grid', placeItems: 'center', padding: 0 }}
          title={c}
        >
          <span style={{ width: 18, height: 18, borderRadius: 5, background: c, border: '1px solid rgba(0,0,0,0.3)', display: 'block' }} />
        </button>
      ))}
    </div>
  )
}

// ─── RichText ─────────────────────────────────────────────────────────────────

interface RichTextProps {
  html: string
  onChange: (html: string) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  placeholder?: string
  style?: React.CSSProperties
  elRef?: (el: HTMLDivElement | null) => void
  className?: string
}

function RichText({ html, onChange, onKeyDown, placeholder, style, elRef, className }: RichTextProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (html || '')) {
      ref.current.innerHTML = html || ''
    }
    // Only sync on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={el => {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = el
        if (elRef) elRef(el)
      }}
      contentEditable
      suppressContentEditableWarning
      className={'pg-rt ' + (className || '')}
      data-ph={placeholder || ''}
      style={{ outline: 'none', lineHeight: 1.6, ...style }}
      onInput={e => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
      onKeyDown={onKeyDown}
    />
  )
}

// ─── BlockRow ─────────────────────────────────────────────────────────────────

interface BlockRowProps {
  b: EditorBlock
  index: number
  num: number
  isPaper: boolean
  elRef: (el: HTMLDivElement | null) => void
  setHtml: (id: string, html: string) => void
  setBlock: (id: string, patch: Partial<EditorBlock>) => void
  onKey: (e: React.KeyboardEvent<HTMLDivElement>, b: EditorBlock, index: number) => void
  removeBlock: (id: string) => void
  onPlus: () => void
  onMenu: () => void
  openSub: (pageId: string) => void
  subPages: SubPageMeta[]
  addAfter: (index: number, type: EditorBlockType) => EditorBlock
  setFocusId: (id: string) => void
}

function BlockRow({
  b, index, num, isPaper, elRef, setHtml, setBlock, onKey, removeBlock,
  onPlus, onMenu, openSub, subPages, addAfter, setFocusId,
}: BlockRowProps) {
  const handle = (
    <div className="pg-handle">
      <button className="pg-hbtn" onClick={onPlus} title="Add block">
        <Icon name="plus" size={12} />
      </button>
      <button className="pg-hbtn" onClick={onMenu} title="Turn into / options">
        <Icon name="dots" size={12} />
      </button>
    </div>
  )

  if (b.type === 'divider') {
    return (
      <div className="pg-block" data-bid={b.id} style={{ padding: '10px 0' }}>
        {handle}
        <div style={{ height: 1, background: 'var(--pg-line)' }} />
      </div>
    )
  }

  if (b.type === 'subpage') {
    const target = subPages.find(p => p.id === b.pageId)
    return (
      <div className="pg-block" data-bid={b.id}>
        {handle}
        <button
          onClick={() => b.pageId && openSub(b.pageId)}
          style={{
            display: 'flex', gap: 10, alignItems: 'center', width: '100%',
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid var(--pg-line)', background: 'transparent',
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ fontSize: 18 }}>{target?.icon ?? b.pageIcon ?? '📄'}</span>
          <span style={{
            font: '600 14px var(--font-sans)',
            color: 'var(--pg-ink)',
            textDecoration: 'underline',
            textDecorationColor: 'var(--pg-line)',
          }}>
            {target?.title ?? b.pageTitle ?? 'Untitled sub-page'}
          </span>
          <Icon name="arrowUpR" size={13} />
        </button>
      </div>
    )
  }

  if (b.type === 'toggle') {
    return (
      <div className="pg-block" data-bid={b.id}>
        {handle}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <button
            onClick={() => setBlock(b.id, { open: !b.open })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--pg-mute)', padding: '4px 0', marginTop: 2,
            }}
          >
            <span style={{
              display: 'inline-flex',
              transform: b.open ? 'rotate(90deg)' : 'none',
              transition: 'transform .15s',
            }}>
              <Icon name="chevR" size={13} />
            </span>
          </button>
          <div style={{ flex: 1 }}>
            <RichText
              html={b.html}
              placeholder="Toggle title"
              style={{ fontWeight: 600, color: 'var(--pg-ink)', fontSize: 15 }}
              elRef={elRef}
              onChange={h => setHtml(b.id, h)}
              onKeyDown={e => onKey(e, b, index)}
            />
            {b.open && (
              <div style={{ marginTop: 6, paddingLeft: 12, borderLeft: '2px solid var(--pg-line)' }}>
                <RichText
                  html={b.body ?? ''}
                  placeholder="Empty toggle. Click to write."
                  style={{ color: 'var(--pg-ink)', opacity: 0.92, fontSize: 14 }}
                  onChange={h => setBlock(b.id, { body: h })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (b.type === 'callout') {
    const borderColor = calloutBorderColor(b.color ?? 'plain')
    return (
      <div className="pg-block" data-bid={b.id}>
        {handle}
        <div style={{
          background: 'var(--pg-co)',
          border: '1px solid var(--pg-cob)',
          borderLeft: b.color && b.color !== 'plain' ? `3px solid ${borderColor}` : '1px solid var(--pg-cob)',
          borderRadius: 10,
          padding: '13px 15px',
          display: 'flex',
          gap: 11,
        }}>
          <button
            onClick={() => {
              const ni = (CALLOUT_EMOJIS.indexOf(b.emoji ?? '💡') + 1) % CALLOUT_EMOJIS.length
              setBlock(b.id, { emoji: CALLOUT_EMOJIS[ni] })
            }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 16, flexShrink: 0, lineHeight: 1.5, padding: 0,
            }}
            title="Change icon"
          >
            {b.emoji ?? '💡'}
          </button>
          <div style={{ flex: 1 }}>
            <RichText
              html={b.html}
              placeholder="Callout…"
              style={{ color: 'var(--pg-ink)', fontSize: 14 }}
              elRef={elRef}
              onChange={h => setHtml(b.id, h)}
              onKeyDown={e => onKey(e, b, index)}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {CALLOUT_COLORS.map(({ id: cid }) => (
                <button
                  key={cid}
                  onClick={() => setBlock(b.id, { color: cid })}
                  title={cid}
                  style={{
                    width: 14, height: 14, borderRadius: 4, cursor: 'pointer',
                    border: b.color === cid ? '2px solid var(--pg-ink)' : '1px solid var(--pg-line)',
                    background: calloutSwatchBg(cid),
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // text-like blocks
  const styleMap: Record<string, React.CSSProperties> = {
    h1: { font: '700 30px var(--font-sans)', letterSpacing: '-0.01em', margin: '16px 0 2px' },
    h2: { font: '700 23px var(--font-sans)', letterSpacing: '-0.01em', margin: '14px 0 2px' },
    h3: { font: '700 18px var(--font-sans)', margin: '10px 0 2px' },
    text: { font: '400 15px var(--font-sans)', lineHeight: 1.65 },
    quote: {
      font: '400 15px var(--font-sans)', fontStyle: 'italic',
      borderLeft: '3px solid var(--pg-line)', paddingLeft: 14,
    },
  }
  const st: React.CSSProperties = { color: 'var(--pg-ink)', ...(styleMap[b.type] ?? styleMap.text) }

  if (b.type === 'bullet' || b.type === 'numbered' || b.type === 'todo') {
    return (
      <div className="pg-block" data-bid={b.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
        {handle}
        {b.type === 'todo' ? (
          <button
            onClick={() => setBlock(b.id, { checked: !b.checked })}
            style={{
              width: 17, height: 17, marginTop: 3, borderRadius: 5, flexShrink: 0,
              cursor: 'pointer',
              border: `1.5px solid ${b.checked ? '#4FE3C1' : 'var(--pg-mute)'}`,
              background: b.checked ? '#4FE3C1' : 'transparent',
              display: 'grid', placeItems: 'center',
              color: isPaper ? '#fff' : '#0a0a0a',
            }}
          >
            {b.checked && <Icon name="check" size={11} />}
          </button>
        ) : b.type === 'numbered' ? (
          <span style={{
            minWidth: 18, textAlign: 'right', color: 'var(--pg-mute)',
            font: '400 15px var(--font-sans)', marginTop: 1, flexShrink: 0,
          }}>
            {num}.
          </span>
        ) : (
          <span style={{ color: 'var(--pg-ink)', fontSize: 18, lineHeight: 1.2, marginTop: 1, flexShrink: 0 }}>•</span>
        )}
        <RichText
          html={b.html}
          placeholder="List item"
          style={{
            flex: 1, ...st,
            textDecoration: b.checked ? 'line-through' : 'none',
            opacity: b.checked ? 0.55 : 1,
          }}
          elRef={elRef}
          onChange={h => setHtml(b.id, h)}
          onKeyDown={e => onKey(e, b, index)}
        />
      </div>
    )
  }

  return (
    <div className="pg-block" data-bid={b.id}>
      {handle}
      <RichText
        html={b.html}
        placeholder={
          b.type === 'text' ? 'Type, or press / for blocks' :
          b.type.startsWith('h') ? 'Heading' :
          'Quote'
        }
        style={st}
        elRef={elRef}
        onChange={h => setHtml(b.id, h)}
        onKeyDown={e => onKey(e, b, index)}
      />
    </div>
  )
}

// ─── PageEditor ───────────────────────────────────────────────────────────────

export function PageEditor({
  pageId, pageTitle, pageIcon, onBack, onOpenSub, onAIToggle, aiOpen, subPages = [], onNewSubPage,
}: PageEditorProps) {
  const [doc, setDoc] = useState<EditorDoc>(() => loadDoc(pageId, pageTitle))
  const [title, setTitle] = useState(() => loadDoc(pageId, pageTitle).title || pageTitle)
  const [focusId, setFocusId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ index: number; forId: string; transform?: boolean } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const elMap = useRef<Record<string, HTMLDivElement>>({})
  const [tb, setTb] = useInlineToolbar(wrapRef)

  // Persist on change
  useEffect(() => { saveDoc(pageId, doc) }, [pageId, doc])

  // Reload when pageId changes
  useEffect(() => {
    const d = loadDoc(pageId, pageTitle)
    setDoc(d)
    setTitle(d.title || pageTitle)
  }, [pageId, pageTitle])

  // Focus after block creation
  useEffect(() => {
    if (focusId) {
      const el = elMap.current[focusId]
      if (el) {
        el.focus()
        placeCaretEnd(el)
        setFocusId(null)
      }
    }
  })

  const update = useCallback((fn: (blocks: EditorBlock[]) => EditorBlock[]) => {
    setDoc(d => ({ ...d, blocks: fn(d.blocks.slice()) }))
  }, [])

  const setBlock = useCallback((id: string, patch: Partial<EditorBlock>) => {
    update(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b))
  }, [update])

  const setHtml = useCallback((id: string, html: string) => {
    update(bs => bs.map(b => b.id === id ? { ...b, html } : b))
  }, [update])

  const addAfter = useCallback((index: number, type: EditorBlockType): EditorBlock => {
    let nb: EditorBlock
    if (type === 'divider') {
      nb = { id: uid(), type: 'divider', html: '' }
    } else if (type === 'callout') {
      nb = { id: uid(), type: 'callout', color: 'plain', emoji: '💡', html: '' }
    } else if (type === 'toggle') {
      nb = { id: uid(), type: 'toggle', open: true, html: '', body: '' }
    } else if (type === 'todo') {
      nb = { id: uid(), type: 'todo', checked: false, html: '' }
    } else if (type === 'subpage') {
      const sid = 'sub_' + uid()
      const meta: SubPageMeta = { id: sid, title: 'Untitled sub-page', icon: '📄' }
      onNewSubPage?.(meta)
      nb = { id: uid(), type: 'subpage', html: '', pageId: sid, pageTitle: 'Untitled sub-page', pageIcon: '📄' }
    } else {
      nb = { id: uid(), type, html: '' }
    }
    update(bs => { bs.splice(index + 1, 0, nb); return bs })
    if (nb.type !== 'divider' && nb.type !== 'subpage') setFocusId(nb.id)
    return nb
  }, [update, onNewSubPage])

  const removeBlock = useCallback((id: string) => {
    update(bs => {
      const i = bs.findIndex(b => b.id === id)
      if (i > 0) {
        const prev = bs[i - 1]
        if (prev.html != null) setTimeout(() => setFocusId(prev.id), 0)
      }
      return bs.filter(b => b.id !== id)
    })
  }, [update])

  const changeType = useCallback((id: string, type: EditorBlockType | 'ai') => {
    if (type === 'ai') { onAIToggle?.(); setMenu(null); return }
    if (type === 'divider') {
      update(bs => bs.map(b => b.id === id ? { id: b.id, type: 'divider', html: '' } : b))
      setMenu(null); return
    }
    if (type === 'subpage') {
      const sid = 'sub_' + uid()
      const meta: SubPageMeta = { id: sid, title: 'Untitled sub-page', icon: '📄' }
      onNewSubPage?.(meta)
      update(bs => bs.map(b => b.id === id
        ? { id: b.id, type: 'subpage', html: '', pageId: sid, pageTitle: 'Untitled sub-page', pageIcon: '📄' }
        : b
      ))
      setMenu(null); return
    }
    update(bs => bs.map(b => b.id === id ? {
      ...b, type,
      color: type === 'callout' ? (b.color ?? 'plain') : b.color,
      emoji: type === 'callout' ? (b.emoji ?? '💡') : b.emoji,
      open: type === 'toggle' ? true : b.open,
      body: type === 'toggle' ? (b.body ?? '') : b.body,
    } : b))
    setMenu(null)
  }, [update, onAIToggle, onNewSubPage])

  function onKey(e: React.KeyboardEvent<HTMLDivElement>, b: EditorBlock, index: number) {
    if (e.key === 'Enter' && !e.shiftKey && b.type !== 'toggle') {
      e.preventDefault()
      const t: EditorBlockType =
        (b.type === 'bullet' || b.type === 'numbered' || b.type === 'todo') ? b.type : 'text'
      addAfter(index, t)
    } else if (e.key === 'Backspace') {
      const el = elMap.current[b.id]
      if (el && (el.innerHTML === '' || el.innerHTML === '<br>')) {
        e.preventDefault()
        removeBlock(b.id)
      }
    } else if (e.key === '/') {
      const el = elMap.current[b.id]
      if (el && el.textContent === '') {
        e.preventDefault()
        setMenu({ index, forId: b.id })
      }
    }
  }

  function applyCmd(cmd: string) { document.execCommand(cmd, false) }

  function applyColor(c: string | null) {
    if (c) {
      document.execCommand('foreColor', false, c)
    } else {
      document.execCommand('foreColor', false, '#F1F3EE')
    }
    const sel = window.getSelection()
    let node = sel?.anchorNode
    const testNode = node?.nodeType === 3 ? node.parentNode : node
    const blockEl = (testNode as Element)?.closest?.('[data-bid]')
    if (blockEl) {
      const id = blockEl.getAttribute('data-bid')
      const rt = blockEl.querySelector('.pg-rt')
      if (id && rt) setHtml(id, rt.innerHTML)
    }
  }

  // numbered list counters
  const numIndex: Record<string, number> = {}
  let run = 0
  doc.blocks.forEach(b => {
    if (b.type === 'numbered') { run += 1; numIndex[b.id] = run } else run = 0
  })

  const isPaper = doc.theme === 'paper'

  return (
    <div
      className="pg-wrap"
      data-theme={doc.theme}
      ref={wrapRef}
      style={{
        minHeight: '100%',
        background: isPaper ? 'var(--pg-bg)' : 'transparent',
        borderRadius: isPaper ? 16 : 0,
      }}
    >
      <InlineToolbar tb={tb} onCmd={applyCmd} onColor={applyColor} />

      <div
        className="pg-doc"
        style={{
          maxWidth: aiOpen ? 680 : 820,
          margin: '0 auto',
          padding: isPaper ? '30px 56px 80px' : '8px 56px 80px',
          transition: 'max-width .2s',
        }}
      >
        {/* breadcrumb / toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <button
            onClick={onBack}
            className="btn btn-ghost"
            style={{ height: 28, paddingLeft: 6, color: 'var(--text-3)' }}
          >
            <Icon name="chevL" size={13} />
            Pages
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => {
                const t = doc.theme === 'paper' ? 'dark' : 'paper'
                setDoc(d => ({ ...d, theme: t }))
              }}
              className="btn"
              style={{
                height: 28,
                background: isPaper ? '#efe9d4' : 'var(--bg-2)',
                color: isPaper ? '#2b2620' : 'var(--text-2)',
                borderColor: isPaper ? '#e0d8bd' : 'var(--border)',
              }}
            >
              <Icon name={isPaper ? 'eye' : 'doc'} size={13} />
              {isPaper ? 'Paper' : 'Dark'}
            </button>
            <button
              onClick={onAIToggle}
              className={aiOpen ? 'btn btn-primary' : 'btn'}
              style={{ height: 28 }}
            >
              <Icon name="sparkle" size={13} />
              AI
            </button>
          </div>
        </div>

        {/* icon + title */}
        <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 10 }}>{pageIcon}</div>
        <input
          value={title}
          onChange={e => {
            setTitle(e.target.value)
            setDoc(d => ({ ...d, title: e.target.value }))
          }}
          placeholder="Untitled"
          style={{
            width: '100%', background: 'none', border: 'none', outline: 'none',
            color: 'var(--pg-ink)',
            font: isPaper ? '700 38px Georgia, serif' : '700 38px var(--font-sans)',
            letterSpacing: '-0.01em', marginBottom: 18, padding: 0,
          }}
        />

        {/* blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {doc.blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              b={b}
              index={i}
              num={numIndex[b.id] ?? 0}
              isPaper={isPaper}
              elRef={el => { if (el) elMap.current[b.id] = el }}
              setHtml={setHtml}
              setBlock={setBlock}
              onKey={onKey}
              removeBlock={removeBlock}
              onPlus={() => setMenu({ index: i, forId: b.id })}
              onMenu={() => setMenu({ index: i, forId: b.id, transform: true })}
              openSub={onOpenSub}
              subPages={subPages}
              addAfter={addAfter}
              setFocusId={setFocusId}
            />
          ))}
        </div>

        {/* add at end */}
        <button
          onClick={() => addAfter(doc.blocks.length - 1, 'text')}
          style={{
            marginTop: 12, padding: '8px 6px', background: 'none', border: 'none',
            cursor: 'text', color: 'var(--pg-mute)',
            font: '400 14px var(--font-sans)', width: '100%', textAlign: 'left',
            display: 'flex', gap: 8, alignItems: 'center',
          }}
        >
          <Icon name="plus" size={13} />
          Click to add, or press / for blocks
        </button>

        {/* block menu */}
        {menu && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: -8 }}>
              <BlockMenu
                onClose={() => setMenu(null)}
                onPick={type => {
                  if (menu.transform) {
                    changeType(menu.forId, type)
                  } else {
                    if (type === 'ai') {
                      onAIToggle?.()
                    } else {
                      const el = elMap.current[menu.forId]
                      if (el && el.textContent === '' && !menu.transform) {
                        changeType(menu.forId, type)
                      } else {
                        addAfter(menu.index, type)
                      }
                    }
                  }
                  setMenu(null)
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageEditor
