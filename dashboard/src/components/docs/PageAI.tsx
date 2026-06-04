'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'
import type { EditorBlock, EditorDoc } from './PageEditor'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'ai'
  text: string
}

interface PageAIProps {
  doc: EditorDoc
  title: string
  onClose: () => void
  onInsert: (blocks: EditorBlock[]) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function stripHtml(h: string): string {
  return (h || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function docToPlainText(doc: EditorDoc, title: string): string {
  const lines: string[] = [title ? '# ' + title : '']
  ;(doc.blocks || []).forEach(b => {
    if (b.type === 'divider') { lines.push('---'); return }
    if (b.type === 'subpage') { lines.push('→ ' + (b.pageTitle ?? 'sub-page')); return }
    const t = stripHtml(b.html)
    if (b.type === 'h1') lines.push('\n# ' + t)
    else if (b.type === 'h2') lines.push('\n## ' + t)
    else if (b.type === 'h3') lines.push('\n### ' + t)
    else if (b.type === 'bullet') lines.push('• ' + t)
    else if (b.type === 'numbered') lines.push('1. ' + t)
    else if (b.type === 'todo') lines.push('[' + (b.checked ? 'x' : ' ') + '] ' + t)
    else if (b.type === 'toggle') lines.push('▸ ' + t + (b.body ? '\n   ' + stripHtml(b.body) : ''))
    else if (b.type === 'callout') lines.push('» ' + t)
    else if (b.type === 'quote') lines.push('> ' + t)
    else if (t) lines.push(t)
  })
  return lines.join('\n')
}

const PAGE_AI_PROMPTS = [
  { label: 'Summarise this page', q: 'Summarise this page in 3-4 tight bullet points.' },
  { label: 'Tighten the writing', q: 'Suggest a tighter, punchier rewrite of the key sections. Keep my voice.' },
  { label: 'Find weak spots', q: "I'm a sales agency owner. Poke holes in this — where would a prospect push back, and how should I respond?" },
  { label: 'Add an objection', q: 'Write one more objection-handling response in the same style as the others on this page.' },
]

// ─── PageAI ───────────────────────────────────────────────────────────────────

export function PageAI({ doc, title, onClose, onInsert }: PageAIProps) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([{
    role: 'ai',
    text: "I can see this whole page. Ask me to summarise, tighten, rewrite a section, or draft something new — I'll use what's here.",
  }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [msgs, busy])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || busy) return
    setInput('')
    setBusy(true)
    setMsgs(m => [...m, { role: 'user', text: q }])

    const context = docToPlainText(doc, title)
    const prompt = `You are an AI assistant embedded in a Notion-style page editor inside "BizBoost", a marketing-agency command centre. The user owns the agency.\n\nHere is the current page content:\n"""\n${context.slice(0, 6000)}\n"""\n\nUser request: ${q}\n\nBe concise, practical and write in a confident, plain-spoken voice. Use short paragraphs or bullet lines. Do not use markdown headers.`

    try {
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          system: 'You are Boost, an expert business writing assistant inside BizBoost.',
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json() as { text?: string }
      const reply = (data.text ?? '').trim()
      setMsgs(m => [...m, { role: 'ai', text: reply || "I couldn't generate a response — try rephrasing." }])
    } catch (_e) {
      setMsgs(m => [...m, { role: 'ai', text: 'Something went wrong reaching the model. Try again in a moment.' }])
    }
    setBusy(false)
  }

  function insertReply(text: string) {
    const blocks: EditorBlock[] = text
      .split(/\n+/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        if (/^[-•]\s+/.test(line)) return { id: uid(), type: 'bullet' as const, html: line.replace(/^[-•]\s+/, '') }
        if (/^\d+[.)]\s+/.test(line)) return { id: uid(), type: 'numbered' as const, html: line.replace(/^\d+[.)]\s+/, '') }
        return { id: uid(), type: 'text' as const, html: line }
      })
    onInsert(blocks)
  }

  return (
    <aside style={{
      position: 'fixed', right: 0, top: 52, bottom: 0,
      width: 340, zIndex: 50,
      borderLeft: '1px solid var(--border)',
      background: 'linear-gradient(180deg, #0d0f0d, #0a0b0a)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        padding: '13px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'var(--lime)', color: '#0a0a0a',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="sparkle" size={13} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>Page AI</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>knows this page</span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'grid', placeItems: 'center', color: 'var(--text-3)',
          }}
        >
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', padding: 14,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}
      >
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '92%' }}>
            {m.role === 'ai' && (
              <div style={{
                display: 'flex', gap: 5, alignItems: 'center',
                marginBottom: 5, color: 'var(--text-3)', fontSize: 10,
              }}>
                <Icon name="sparkle" size={11} />
                Page AI
              </div>
            )}
            <div style={{
              padding: '10px 13px', borderRadius: 13,
              fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap',
              background: m.role === 'user' ? 'var(--lime)' : 'var(--bg-2)',
              color: m.role === 'user' ? '#0a0a0a' : 'var(--text-2)',
              border: m.role === 'user' ? 'none' : '1px solid var(--border)',
              fontWeight: m.role === 'user' ? 500 : 400,
            }}>
              {m.text}
            </div>
            {m.role === 'ai' && i > 0 && (
              <button
                onClick={() => insertReply(m.text)}
                className="btn btn-ghost"
                style={{ height: 24, marginTop: 5, fontSize: 11, color: 'var(--lime)' }}
              >
                <Icon name="plus" size={11} />
                Insert into page
              </button>
            )}
          </div>
        ))}
        {busy && (
          <div style={{
            alignSelf: 'flex-start', color: 'var(--text-3)',
            fontSize: 12, display: 'flex', gap: 7, alignItems: 'center',
          }}>
            <span className="live-dot" style={{ background: '#8B7CFF' }} />
            thinking…
          </div>
        )}
      </div>

      {/* quick prompts + input */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 9 }}>
          {PAGE_AI_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => send(p.q)}
              disabled={busy}
              style={{
                textAlign: 'left', padding: '7px 11px', borderRadius: 9,
                cursor: busy ? 'default' : 'pointer',
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                color: 'var(--text-2)', font: '500 11.5px var(--font-sans)',
                opacity: busy ? 0.5 : 1, transition: 'border-color .12s',
              }}
              onMouseEnter={e => { if (!busy) (e.currentTarget as HTMLButtonElement).style.borderColor = '#cfff3a55' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{
          display: 'flex', gap: 6,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '6px 6px 6px 12px',
          alignItems: 'center',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Ask about this page…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', font: '400 12.5px var(--font-sans)',
            }}
          />
          <button
            onClick={() => send()}
            disabled={busy}
            className="btn btn-primary"
            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center', opacity: busy ? 0.5 : 1 }}
          >
            <Icon name="arrowR" size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default PageAI
