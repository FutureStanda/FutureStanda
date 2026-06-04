'use client'

import React, { useState, useRef, useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { TASKS } from '@/lib/data'

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface AgentLocal {
  id: string
  name: string
  role: string
  icon: string
  color: string
  status: 'active' | 'paused'
  tools: string[]
  can: string[]
  runs: number
  kind: 'agent'
}

interface PersonLocal {
  id: string
  name: string
  role: string
  color: string
  kind: 'person'
}

// ────────────────────────────────────────────────────────────────────────────
// Seed data
// ────────────────────────────────────────────────────────────────────────────

const SEED_AGENTS: AgentLocal[] = [
  { id: 'research', name: 'Research Agent', role: 'Competitor & market research', color: '#8B7CFF', icon: 'sparkle', tools: ['Google Search', 'Notion', 'Webhooks'], can: ['Research competitors', 'Pull market data', 'Write a findings brief'], status: 'active', runs: 142, kind: 'agent' },
  { id: 'content', name: 'Content Agent', role: 'Drafts & schedules posts', color: '#4FE3C1', icon: 'megaphone', tools: ['Meta', 'Instagram', 'Content hub'], can: ['Draft posts', 'Schedule content', 'Repurpose reviews'], status: 'active', runs: 318, kind: 'agent' },
  { id: 'outreach', name: 'Outreach Agent', role: 'Follow-ups & booking', color: '#FFB547', icon: 'msg', tools: ['WhatsApp', 'SMS', 'Calendly'], can: ['Reply to enquiries', 'Qualify leads', 'Book calls'], status: 'active', runs: 506, kind: 'agent' },
  { id: 'reputation', name: 'Reputation Agent', role: 'Reviews & replies', color: '#FF7A8A', icon: 'star', tools: ['Google Business', 'Meta'], can: ['Request reviews', 'Reply to reviews', 'Flag bad ones'], status: 'active', runs: 211, kind: 'agent' },
]

const PEOPLE: PersonLocal[] = [
  { id: 'p1', name: 'Bartek Standa', role: 'Founder', color: '#CFFF3A', kind: 'person' },
  { id: 'p2', name: "Sarah O'Brien", role: 'Campaign Manager', color: '#8B7CFF', kind: 'person' },
  { id: 'p3', name: 'Conor Walsh', role: 'Account Executive', color: '#4FE3C1', kind: 'person' },
]

const BUILD_SUGGESTIONS = [
  'Research my clients\' competitors and write me a brief',
  'Reply to all my Google reviews automatically',
  'Draft 4 social posts a week per client',
  'Chase every unpaid invoice',
]

// ────────────────────────────────────────────────────────────────────────────
// Build an agent modal
// ────────────────────────────────────────────────────────────────────────────

interface BuildAgentProps {
  onClose: () => void
  onBuilt: (agent: AgentLocal) => void
}

function BuildAgent({ onClose, onBuilt }: BuildAgentProps) {
  const [desc, setDesc] = useState('')
  const [provisioning, setProvisioning] = useState(false)

  function build() {
    if (!desc.trim()) return
    setProvisioning(true)
    setTimeout(() => {
      const colors = ['#8B7CFF', '#4FE3C1', '#FFB547', '#FF7A8A', '#5BCEFA', '#CFFF3A']
      const icons = ['sparkle', 'megaphone', 'msg', 'star', 'trend', 'shield', 'inbox']
      const newAgent: AgentLocal = {
        id: 'ag_' + Date.now().toString(36),
        name: desc.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase() + w.slice(1)).join(' ') + ' Agent',
        role: desc.trim().slice(0, 60),
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
        status: 'active',
        tools: ['Webhooks', 'Notion'],
        can: [`Handle: ${desc.trim().slice(0, 40)}`, 'Report back with results', 'Escalate when needed'],
        runs: 0,
        kind: 'agent',
      }
      onBuilt(newAgent)
    }, 2000)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 240, background: 'rgba(4,5,5,0.6)', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} className="fadeup col" style={{ width: 540, maxWidth: '94vw', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: '0 30px 90px rgba(0,0,0,0.75)', overflow: 'hidden' }}>
        {/* header */}
        <div className="row between" style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 20px #cfff3a44' }}>
              <Icon name="sparkle" size={16} />
            </span>
            <div className="col" style={{ gap: 1 }}>
              <span style={{ font: '600 15px var(--font-sans)' }}>Build an agent</span>
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Describe the job · Claude provisions it</span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 30, height: 30, borderRadius: 8, padding: 0, display: 'grid', placeItems: 'center' }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        {provisioning ? (
          /* provisioning animation */
          <div className="col" style={{ alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 16 }}>
            <span style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 30px #cfff3a55', animation: 'pulse 1.2s infinite' }}>
              <Icon name="sparkle" size={24} />
            </span>
            <span style={{ font: '600 15px var(--font-sans)', color: 'var(--text)' }}>Provisioning your agent…</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Wiring its tools & remit</span>
          </div>
        ) : (
          <>
            <div className="col gap-4" style={{ padding: 20 }}>
              <div className="col gap-2">
                <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>Describe what this agent should do</label>
                <textarea
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  rows={4}
                  placeholder="e.g. Research my clients' top competitors and write me a one-page brief with their ad strategy, reviews, and positioning…"
                  style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '10px 12px', outline: 'none', resize: 'vertical', lineHeight: 1.55 }}
                  onFocus={e => (e.target.style.borderColor = '#cfff3a66')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              {/* suggestion chips */}
              <div className="col gap-2">
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Suggestions</span>
                <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                  {BUILD_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => setDesc(s)} className="chip" style={{ cursor: 'pointer', background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)', height: 26, fontSize: 11.5 }}>
                      {s.slice(0, 36)}{s.length > 36 ? '…' : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="row between" style={{ padding: '13px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <button onClick={onClose} className="btn">Cancel</button>
              <button onClick={build} disabled={!desc.trim()} className="btn btn-primary" style={{ opacity: desc.trim() ? 1 : 0.5 }}>
                <Icon name="sparkle" size={13} />Build it
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Agent detail right panel (600px)
// ────────────────────────────────────────────────────────────────────────────

interface AgentDetailProps {
  agent: AgentLocal
  onClose: () => void
  onToggleStatus: (id: string) => void
}

function AgentDetail({ agent: a, onClose, onToggleStatus }: AgentDetailProps) {
  const [chat, setChat] = useState<{ role: 'me' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const agentTasks = TASKS.filter(t => t.assignee === a.name || t.assignee === a.id)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chat, busy])

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setChat(c => [...c, { role: 'me', text }])
    setInput('')
    setBusy(true)
    await new Promise(r => setTimeout(r, 1500))
    const mockReplies = [
      `On it. I'll handle that and report back once complete.`,
      `Got it — I'll use ${(a.tools || []).slice(0, 2).join(' and ') || 'my tools'} to get this done and update you shortly.`,
      `Understood. Based on my role as ${a.role}, I can do this. Starting now.`,
      `Sure thing. I'll prioritise this and have results back for you within the hour.`,
    ]
    const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)]
    setChat(c => [...c, { role: 'ai', text: reply }])
    setBusy(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(4,5,5,0.55)', backdropFilter: 'blur(3px)' }} />
      <div className="col" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 600, maxWidth: '96vw',
        background: 'var(--bg-1)', borderLeft: '1px solid var(--border)',
        boxShadow: '-24px 0 70px rgba(0,0,0,0.55)',
        animation: 'slideInR 0.22s ease',
        overflow: 'hidden',
      }}>
        {/* agent header */}
        <div className="panel" style={{
          padding: 22, margin: 0, borderRadius: 0,
          background: `linear-gradient(120deg, ${a.color}14, transparent 55%)`,
          borderColor: a.color + '33',
          borderLeft: 'none', borderRight: 'none', borderTop: 'none',
        }}>
          <div className="row between" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div className="row gap-4" style={{ minWidth: 0 }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: a.color, color: '#0a0a0a', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={a.icon} size={24} />
              </span>
              <div className="col" style={{ gap: 4, minWidth: 0 }}>
                <span style={{ font: '600 22px var(--font-sans)', letterSpacing: '-0.02em', color: 'var(--text)' }}>{a.name}</span>
                <span style={{ fontSize: 13, color: 'var(--text-3)' }}>{a.role}</span>
                <div className="row gap-2" style={{ marginTop: 4 }}>
                  <span className="chip" style={{ background: 'transparent', borderColor: a.status === 'active' ? '#cfff3a44' : 'var(--border)', color: a.status === 'active' ? 'var(--lime)' : 'var(--text-3)' }}>
                    {a.status === 'active' && <span className="live-dot" />}
                    {a.status === 'active' ? 'Active' : 'Paused'}
                  </span>
                  <span className="chip chip-dim">{a.runs.toLocaleString()} runs</span>
                </div>
              </div>
            </div>
            <div className="row gap-2">
              <button onClick={() => onToggleStatus(a.id)} className="btn">
                {a.status === 'active' ? 'Pause agent' : 'Activate'}
              </button>
              <button onClick={onClose} className="btn btn-ghost" style={{ width: 34, height: 34, padding: 0, display: 'grid', placeItems: 'center', borderRadius: 9 }}>
                <Icon name="x" size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="row" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* left column: capabilities + tasks */}
          <div className="col gap-0" style={{ width: 240, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', padding: 16 }}>
            <div className="col gap-2" style={{ marginBottom: 18 }}>
              <span className="eyebrow" style={{ margin: '0 0 8px' }}>What it can do</span>
              {(a.can || []).map((c, i) => (
                <div key={i} className="row gap-2" style={{ fontSize: 12.5, color: 'var(--text-2)' }}>
                  <span style={{ color: a.color, flexShrink: 0 }}><Icon name="check" size={13} /></span>
                  {c}
                </div>
              ))}
              {!(a.can || []).length && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No capabilities defined.</span>}
            </div>

            <div className="col gap-2" style={{ marginBottom: 18 }}>
              <span className="eyebrow" style={{ margin: '0 0 8px' }}>Connected tools</span>
              <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                {(a.tools || []).map(t => (
                  <span key={t} className="chip chip-dim" style={{ height: 24, fontSize: 11 }}>
                    <Icon name="link" size={10} />{t}
                  </span>
                ))}
                {!(a.tools || []).length && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No tools connected.</span>}
              </div>
            </div>

            <div className="col gap-2">
              <span className="eyebrow" style={{ margin: '0 0 8px' }}>Working on</span>
              {agentTasks.slice(0, 4).map(t => (
                <div key={t.id} className="row gap-2" style={{ fontSize: 12, color: 'var(--text-2)', padding: '7px 9px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: t.status === 'done' ? 'var(--lime)' : t.status === 'doing' ? 'var(--amber)' : 'var(--text-3)', flexShrink: 0 }} />
                  <span className="truncate" style={{ flex: 1 }}>{t.title}</span>
                </div>
              ))}
              {agentTasks.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Nothing assigned.</span>}
            </div>
          </div>

          {/* right column: chat */}
          <div className="col" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div className="row gap-2" style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: a.color + '22', color: a.color, display: 'grid', placeItems: 'center' }}>
                <Icon name={a.icon} size={13} />
              </span>
              <div className="col" style={{ gap: 0 }}>
                <span style={{ font: '600 13px var(--font-sans)' }}>Chat with {a.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>Brief it, ask for an update, delegate</span>
              </div>
            </div>

            <div ref={scrollRef} className="col gap-3" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {chat.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: 'var(--text-3)', fontSize: 12.5, lineHeight: 1.55 }}>
                  Say hi to {a.name} or give it a job — delegate directly here.
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                  {m.role === 'ai' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={{ width: 20, height: 20, borderRadius: 6, background: a.color + '22', color: a.color, display: 'grid', placeItems: 'center' }}>
                        <Icon name={a.icon} size={11} />
                      </span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{a.name}</span>
                    </span>
                  )}
                  <div style={{
                    padding: '9px 13px', borderRadius: 12, fontSize: 12.5, lineHeight: 1.55,
                    background: m.role === 'me' ? a.color : 'var(--bg-2)',
                    color: m.role === 'me' ? '#0a0a0a' : 'var(--text-2)',
                    border: m.role === 'me' ? 'none' : '1px solid var(--border)',
                    fontWeight: m.role === 'me' ? 500 : 400,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div className="row gap-2" style={{ padding: '9px 13px', borderRadius: 12, background: 'var(--bg-2)', border: '1px solid var(--border)', alignItems: 'center' }}>
                    <span className="live-dot" /><span style={{ fontSize: 12, color: 'var(--text-3)' }}>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            <div className="row gap-2" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={`Message ${a.name}…`}
                style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', font: '400 13px var(--font-sans)', padding: '9px 12px', outline: 'none' }}
                onFocus={e => (e.target.style.borderColor = a.color + '88')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')} />
              <button onClick={send} disabled={!input.trim() || busy} style={{ width: 36, height: 36, borderRadius: 9, border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'default', background: a.color, color: '#0a0a0a', display: 'grid', placeItems: 'center', opacity: input.trim() && !busy ? 1 : 0.4 }}>
                <Icon name="arrowR" size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Agent card
// ────────────────────────────────────────────────────────────────────────────

function AgentCard({ agent: a, onClick }: { agent: AgentLocal; onClick: () => void }) {
  const agentTasks = TASKS.filter(t => t.assignee === a.name || t.assignee === a.id)
  const activeTasks = agentTasks.filter(t => t.status === 'doing' || t.status === 'review')

  return (
    <div onClick={onClick} className="panel" style={{ padding: 16, cursor: 'pointer', transition: 'border-color .15s' }}>
      <div className="row between" style={{ marginBottom: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: a.color + '22', color: a.color, border: `1px solid ${a.color}44`, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name={a.icon} size={18} />
        </span>
        <span className="chip" style={{ background: 'transparent', borderColor: a.status === 'active' ? '#cfff3a44' : 'var(--border)', color: a.status === 'active' ? 'var(--lime)' : 'var(--text-3)' }}>
          {a.status === 'active' ? <><span className="live-dot" />Active</> : 'Paused'}
        </span>
      </div>

      <span style={{ font: '600 15px var(--font-sans)', color: 'var(--text)' }}>{a.name}</span>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 12px', lineHeight: 1.45 }}>{a.role}</p>

      <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {(a.tools || []).slice(0, 4).map(t => (
          <span key={t} className="chip chip-dim" style={{ height: 20, fontSize: 9.5 }}>{t}</span>
        ))}
        {!(a.tools || []).length && <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No tools connected yet</span>}
      </div>

      <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{a.runs.toLocaleString()} runs</span>
        {activeTasks.length > 0
          ? <span className="row gap-2" style={{ fontSize: 11, color: 'var(--amber)' }}><span className="live-dot" style={{ background: 'var(--amber)' }} />{activeTasks.length} active</span>
          : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Idle</span>}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentLocal[]>(SEED_AGENTS)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)

  const detailAgent = agents.find(a => a.id === detailId)

  function toggleStatus(id: string) {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' : 'active' } : a))
  }

  function handleBuilt(newAgent: AgentLocal) {
    setAgents(prev => [newAgent, ...prev])
    setBuilding(false)
    setDetailId(newAgent.id)
  }

  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <>
      <style>{`
        @keyframes slideInR {
          from { transform: translateX(100%); opacity: 0.7; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div className="page-root">
        <TopBar crumbs={[{ label: 'Agents' }]} />
        <div className="page-inner" style={{ maxWidth: 1100 }}>
          {/* header */}
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="col gap-2">
              <div className="row gap-2 eyebrow" style={{ margin: 0 }}>
                <span className="live-dot" />{agents.length} agents · {activeCount} active
              </div>
              <div className="h-display" style={{ fontSize: 40 }}>Agents</div>
              <span style={{ color: 'var(--text-3)', fontSize: 14 }}>
                Your AI workforce — they run automations, take tasks off your plate and report back.
              </span>
            </div>
            <button onClick={() => setBuilding(true)} className="btn btn-primary" style={{ height: 40 }}>
              <Icon name="sparkle" size={14} />Build an agent
            </button>
          </div>

          {/* agents grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {agents.map(a => (
              <AgentCard key={a.id} agent={a} onClick={() => setDetailId(a.id)} />
            ))}
            {/* build tile */}
            <button onClick={() => setBuilding(true)} className="panel" style={{ padding: 16, cursor: 'pointer', border: '1px dashed var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 150 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--lime)', color: '#0a0a0a', display: 'grid', placeItems: 'center', boxShadow: '0 0 18px #cfff3a44' }}>
                <Icon name="sparkle" size={18} />
              </span>
              <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text-2)' }}>Build a new agent</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Describe a role — Claude provisions it</span>
            </button>
          </div>

          {/* people section */}
          <div className="col gap-3">
            <span className="eyebrow" style={{ margin: 0 }}>People</span>
            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              {PEOPLE.map(p => (
                <div key={p.id} className="panel" style={{ padding: '12px 16px', display: 'flex', gap: 11, alignItems: 'center' }}>
                  <span style={{ width: 34, height: 34, borderRadius: 10, background: p.color + '22', color: p.color, display: 'grid', placeItems: 'center', font: '600 14px var(--font-sans)' }}>
                    {p.name[0]}
                  </span>
                  <div className="col" style={{ gap: 1 }}>
                    <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Agent detail panel */}
      {detailAgent && (
        <AgentDetail
          agent={detailAgent}
          onClose={() => setDetailId(null)}
          onToggleStatus={toggleStatus}
        />
      )}

      {/* Build agent modal */}
      {building && (
        <BuildAgent
          onClose={() => setBuilding(false)}
          onBuilt={handleBuilt}
        />
      )}
    </>
  )
}
