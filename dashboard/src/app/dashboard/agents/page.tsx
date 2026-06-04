'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { Modal } from '@/components/ui/shared'
import { AGENTS_DATA } from '@/lib/data'
import type { Agent } from '@/types'

// ---- Status badge ----
function StatusBadge({ status }: { status: string }) {
  if (status === 'running') {
    return (
      <span className="chip" style={{ background: '#cfff3a18', borderColor: '#cfff3a44', color: 'var(--lime)' }}>
        <span className="live-dot" />
        Running
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="chip chip-red">
        Error
      </span>
    )
  }
  return (
    <span className="chip chip-dim">Idle</span>
  )
}

// ---- Agent modal ----
function AgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title={agent.name} width={480}>
      <div style={{ padding: 20 }} className="col gap-4">
        {/* avatar + role */}
        <div
          className="panel"
          style={{
            padding: 18,
            background: `linear-gradient(120deg, var(--bg-2), var(--bg-1))`,
            display: 'flex', gap: 14, alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 32, width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--bg-3)', border: '1px solid var(--border)' }}>
            {agent.avatar}
          </span>
          <div className="col" style={{ gap: 4 }}>
            <span style={{ font: '600 17px var(--font-sans)', color: 'var(--text)' }}>{agent.name}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{agent.role}</span>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              <StatusBadge status={agent.status} />
              <span className="chip chip-dim">{agent.run_count.toLocaleString()} runs</span>
              <span className="chip" style={{ background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text-2)' }}>
                {agent.type === 'ai' ? '🤖 AI' : '👤 Person'}
              </span>
            </div>
          </div>
        </div>

        {/* capabilities */}
        {agent.capabilities && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Capabilities</div>
            <div
              style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'var(--bg-2)', border: '1px solid var(--border)',
                fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55,
              }}
            >
              {agent.capabilities}
            </div>
          </div>
        )}

        {/* tools */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Tools</div>
          <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
            {(agent.tools || []).map(t => (
              <span key={t} className="chip chip-dim" style={{ height: 26 }}>
                <Icon name="link" size={11} />
                {t}
              </span>
            ))}
            {(!agent.tools || agent.tools.length === 0) && (
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No tools connected yet.</span>
            )}
          </div>
        </div>

        {/* run history */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Run history summary</div>
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: 10,
            }}
          >
            {[
              { label: 'Total runs', value: agent.run_count.toLocaleString(), accent: 'var(--lime)' },
              { label: 'Status', value: agent.status === 'running' ? 'Active now' : agent.status === 'error' ? 'Error' : 'Idle', accent: agent.status === 'running' ? 'var(--lime)' : agent.status === 'error' ? 'var(--red)' : 'var(--text-3)' },
              { label: 'Type', value: agent.type === 'ai' ? 'AI Agent' : 'Person', accent: 'var(--text-2)' },
              { label: 'Active', value: agent.is_active ? 'Yes' : 'No', accent: agent.is_active ? 'var(--lime)' : 'var(--text-3)' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  padding: '11px 13px', borderRadius: 9,
                  background: 'var(--bg-2)', border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 4 }}>{stat.label}</div>
                <div style={{ font: '700 16px var(--font-sans)', color: stat.accent, letterSpacing: '-0.02em' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn" onClick={onClose} style={{ height: 36 }}>Close</button>
      </div>
    </Modal>
  )
}

// ---- Agent card ----
function AgentCard({ agent, isBoost, onClick }: { agent: Agent; isBoost: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="panel"
      style={{
        padding: 18, cursor: 'pointer',
        borderColor: isBoost ? 'var(--lime)' : 'var(--border)',
        background: isBoost ? 'linear-gradient(135deg, #cfff3a0a, var(--bg-1))' : 'var(--bg-1)',
        transition: 'border-color .15s, transform .15s',
        position: 'relative',
      }}
    >
      {isBoost && (
        <div
          style={{
            position: 'absolute', top: 10, right: 10,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            color: '#0a0a0a', background: 'var(--lime)',
            padding: '2px 6px', borderRadius: 99,
            textTransform: 'uppercase',
          }}
        >
          Core
        </div>
      )}
      <div className="row between" style={{ marginBottom: 12 }}>
        <span
          style={{
            fontSize: 28, width: 44, height: 44, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            background: isBoost ? 'var(--lime)' : 'var(--bg-2)',
            border: `1px solid ${isBoost ? 'var(--lime)' : 'var(--border)'}`,
            flexShrink: 0,
            boxShadow: isBoost ? '0 0 18px #cfff3a44' : 'none',
          }}
        >
          {agent.avatar}
        </span>
        <StatusBadge status={agent.status} />
      </div>

      <span style={{ font: '600 15px var(--font-sans)', color: 'var(--text)' }}>{agent.name}</span>
      <p style={{ fontSize: 12.5, color: 'var(--text-3)', margin: '4px 0 12px', lineHeight: 1.45 }}>{agent.role}</p>

      {/* tools */}
      <div className="row gap-2" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        {(agent.tools || []).slice(0, 3).map(t => (
          <span key={t} className="chip chip-dim" style={{ height: 20, fontSize: 9.5 }}>{t}</span>
        ))}
        {(agent.tools || []).length > 3 && (
          <span className="chip chip-dim" style={{ height: 20, fontSize: 9.5 }}>+{(agent.tools || []).length - 3}</span>
        )}
        {(!agent.tools || agent.tools.length === 0) && (
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No tools connected</span>
        )}
      </div>

      <div className="row between" style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        <span className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {agent.run_count.toLocaleString()} runs
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {agent.type === 'ai' ? '🤖 AI' : '👤 Person'}
        </span>
      </div>
    </div>
  )
}

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  const activeCount = AGENTS_DATA.filter(a => a.status === 'running').length

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Agents' }]} />
      <div className="page-inner" style={{ maxWidth: 1100 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="row gap-2 eyebrow" style={{ margin: 0 }}>
              <span className="live-dot" />
              {AGENTS_DATA.length} agents · {activeCount} running
            </div>
            <div className="h-display" style={{ fontSize: 38 }}>Agents</div>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>
              Your AI workforce — they run automations and take tasks off your plate.
            </span>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn btn-primary" style={{ height: 40 }}>
            <Icon name="sparkle" size={14} />
            New agent
          </button>
        </div>

        {/* agents grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {AGENTS_DATA.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              isBoost={agent.name === 'Boost'}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}

          {/* build new tile */}
          <button
            onClick={() => setShowNewModal(true)}
            className="panel"
            style={{
              padding: 18, cursor: 'pointer',
              border: '1px dashed var(--border)',
              background: 'var(--bg-1)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, minHeight: 160, color: 'var(--text-3)',
            }}
          >
            <span
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--lime)', color: '#0a0a0a',
                display: 'grid', placeItems: 'center',
                boxShadow: '0 0 18px #cfff3a44',
              }}
            >
              <Icon name="sparkle" size={18} />
            </span>
            <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text-2)' }}>Build a new agent</span>
            <span style={{ fontSize: 11 }}>Describe a role — Claude provisions it</span>
          </button>
        </div>
      </div>

      {/* Agent detail modal */}
      {selectedAgent && (
        <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {/* New agent modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Build an agent" width={440}>
        <div
          style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
        >
          <span
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'var(--lime)', color: '#0a0a0a',
              display: 'grid', placeItems: 'center',
              boxShadow: '0 0 22px #cfff3a55',
            }}
          >
            <Icon name="sparkle" size={24} />
          </span>
          <div>
            <div style={{ font: '600 16px var(--font-sans)', marginBottom: 6 }}>Agent builder</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.55 }}>
              Describe the agent&apos;s role and tools — Claude will provision it for you. Coming soon.
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewModal(false)} style={{ height: 38, marginTop: 4 }}>
            <Icon name="sparkle" size={14} />
            Coming soon
          </button>
        </div>
      </Modal>
    </div>
  )
}
