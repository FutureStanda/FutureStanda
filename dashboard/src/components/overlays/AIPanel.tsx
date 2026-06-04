'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'

interface Message { role: 'user' | 'assistant'; content: string }

export function AIPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi, I'm Boost — your AI for the BizBoost Command Centre. I have full context on all 9 clients, your tasks, objectives, and live metrics. What do you want to tackle?" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const QUICK_PROMPTS = [
    "What needs my attention today?",
    "Which clients are at risk this week?",
    "Summarise Greenway Fitness situation",
    "Write a retention email for Greenway",
  ]

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), stream: true }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try { assistantText += JSON.parse(data).text; setMessages(prev => { const msgs = [...prev]; msgs[msgs.length - 1] = { role: 'assistant', content: assistantText }; return msgs }) } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, zIndex: 90, background: 'var(--bg-1)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.4)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, #0e1a0e, transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 16px #CFFF3A40' }}>
            <Icon name="sparkle" size={14} color="#0a0a0a" />
          </span>
          <div>
            <div style={{ font: '600 13.5px var(--font-sans)' }}>Ask Boost</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 11, color: 'var(--text-2)' }}>claude-sonnet-4-6</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', width: 28, height: 28, display: 'grid', placeItems: 'center', borderRadius: 8 }}>
          <Icon name="x" size={15} />
        </button>
      </div>

      {/* messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {m.role === 'assistant' ? (
                <span style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}>
                  <Icon name="sparkle" size={12} color="#0a0a0a" />
                </span>
              ) : (
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#cfff3a', color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2, font: '700 10px var(--font-sans)' }}>B</span>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, font: '600 11.5px var(--font-sans)', color: m.role === 'assistant' ? 'var(--lime)' : 'var(--text-2)', marginBottom: 4 }}>
                  {m.role === 'assistant' ? 'Boost' : 'You'}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.content || (loading && i === messages.length - 1 ? '…' : '')}</div>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* quick prompts */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 18px 12px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)} style={{ fontSize: 12, padding: '6px 11px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 999, cursor: 'pointer', color: 'var(--text-2)', transition: 'all .12s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--lime)'; e.currentTarget.style.color = 'var(--lime)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
            >{p}</button>
          ))}
        </div>
      )}

      {/* input */}
      <div style={{ padding: '12px 18px 18px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Ask anything about your clients…"
            rows={2}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', font: '400 13.5px var(--font-sans)', resize: 'none', lineHeight: 1.5 }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{ width: 32, height: 32, borderRadius: 8, background: input.trim() ? 'var(--lime)' : 'var(--bg-3)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'grid', placeItems: 'center', flexShrink: 0, alignSelf: 'flex-end' }}
          >
            <Icon name="arrowR" size={14} color={input.trim() ? '#0a0a0a' : 'var(--text-3)'} />
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 7, textAlign: 'center' }}>↵ send · ⇧↵ newline</div>
      </div>
    </div>
  )
}
