'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { INTEGRATIONS_DATA } from '@/lib/data'

interface IntegrationItem {
  id: string
  name: string
  status: string
  connectedTo: number
  color: string
  icon: string
}

// ---- Connect animation: spinner → Connected chip ----
function ConnectButton({ onConnected }: { onConnected: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle')

  function handleClick() {
    setPhase('spinning')
    setTimeout(() => {
      setPhase('done')
      onConnected()
    }, 1100)
  }

  if (phase === 'spinning') {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 30, padding: '0 12px', borderRadius: 9,
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          font: '500 13px var(--font-sans)', color: 'var(--text-2)',
          cursor: 'default',
        }}
      >
        <span
          style={{
            width: 12, height: 12, borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--lime)',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }}
        />
        Connecting…
      </span>
    )
  }

  return (
    <button
      className="btn"
      style={{ height: 30 }}
      onClick={handleClick}
    >
      Connect
    </button>
  )
}

// ---- Single integration row ----
function IntegrationRow({ item, onConnect }: { item: IntegrationItem; onConnect: () => void }) {
  const isConnected = item.status === 'connected'
  const isPartial = item.status === 'partial'

  return (
    <div
      className="panel"
      style={{
        padding: 16,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}
    >
      <span
        style={{
          width: 42, height: 42, borderRadius: 11,
          display: 'grid', placeItems: 'center',
          background: item.color + '22', color: item.color,
          font: '700 18px var(--font-sans)', flexShrink: 0,
          border: `1px solid ${item.color}33`,
        }}
      >
        {item.icon}
      </span>

      <div className="col" style={{ gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{ font: '600 13.5px var(--font-sans)', color: 'var(--text)' }}>
          {item.name}
        </span>
        <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
          {item.status === 'disconnected'
            ? 'Available to connect'
            : `Active on ${item.connectedTo} ${item.connectedTo === 1 ? 'client' : 'clients'}`}
        </span>
      </div>

      {isConnected && (
        <span className="chip chip-lime">
          <span className="dot" />
          Connected
        </span>
      )}
      {isPartial && (
        <button
          className="btn"
          style={{ height: 30, color: 'var(--amber)', borderColor: 'var(--amber)' }}
        >
          Fix setup
        </button>
      )}
      {!isConnected && !isPartial && (
        <ConnectButton onConnected={onConnect} />
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(INTEGRATIONS_DATA.map(i => [i.id, i.status]))
  )

  const items: IntegrationItem[] = INTEGRATIONS_DATA.map(i => ({
    ...i,
    status: statuses[i.id] || i.status,
  }))

  const connected = items.filter(i => i.status === 'connected').length

  function handleConnected(id: string) {
    setStatuses(prev => ({ ...prev, [id]: 'connected' }))
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div className="page-root">
        <TopBar crumbs={[{ label: 'Integrations' }]} />
        <div className="page-inner col gap-4 fadeup" style={{ maxWidth: 1080 }}>

          {/* Header */}
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div className="col gap-2">
              <div className="eyebrow">{connected} of {items.length} connected</div>
              <div className="h-display" style={{ fontSize: 38 }}>Integrations</div>
            </div>
            <button className="btn">
              <Icon name="plus" size={14} />
              Browse all
            </button>
          </div>

          {/* Info banner */}
          <div
            className="panel"
            style={{
              padding: 18,
              background: 'linear-gradient(120deg, #14180d, transparent 60%)',
              borderColor: '#cfff3a2e',
            }}
          >
            <div className="row gap-3">
              <span
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'var(--lime)', color: '#0a0a0a',
                  display: 'grid', placeItems: 'center',
                  boxShadow: '0 0 20px #cfff3a44',
                  flexShrink: 0,
                }}
              >
                <Icon name="link" size={16} />
              </span>
              <div className="col" style={{ gap: 2 }}>
                <span style={{ font: '600 14px var(--font-sans)' }}>Everything flows into one place</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                  Connect a source once and it syncs for every client that uses it — no per-account setup.
                </span>
              </div>
            </div>
          </div>

          {/* Grid of rows */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {items.map(item => (
              <IntegrationRow
                key={item.id}
                item={item}
                onConnect={() => handleConnected(item.id)}
              />
            ))}
          </div>

        </div>
      </div>
    </>
  )
}
