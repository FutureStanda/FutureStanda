'use client'

import React, { useState } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { Icon } from '@/components/ui/icons'
import { INTEGRATIONS_DATA } from '@/lib/data'

type OAuthPhase = 'redirecting' | 'authorize' | 'success'

interface IntegrationItem {
  id: string
  name: string
  status: string
  connectedTo: number
  color: string
  icon: string
}

// ---- OAuth flow modal ----
function OAuthModal({ integration, onClose, onConnected }: { integration: IntegrationItem; onClose: () => void; onConnected: () => void }) {
  const [phase, setPhase] = useState<OAuthPhase>('redirecting')

  React.useEffect(() => {
    if (phase === 'redirecting') {
      const t = setTimeout(() => setPhase('authorize'), 1600)
      return () => clearTimeout(t)
    }
  }, [phase])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
        display: 'grid', placeItems: 'center', padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="fadeup col"
        style={{
          width: 420, maxWidth: '92vw',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: 18, boxShadow: '0 30px 80px #000c',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <span
              style={{
                width: 32, height: 32, borderRadius: 9,
                background: integration.color + '22', color: integration.color,
                display: 'grid', placeItems: 'center',
                font: '700 14px var(--font-sans)', border: `1px solid ${integration.color}33`,
              }}
            >
              {integration.icon}
            </span>
            <span style={{ font: '600 14px var(--font-sans)' }}>{integration.name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8 }}>
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: 32, textAlign: 'center' }} className="col gap-4">
          {/* phase: redirecting */}
          {phase === 'redirecting' && (
            <>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 15,
                  background: integration.color + '22', color: integration.color,
                  display: 'grid', placeItems: 'center',
                  font: '700 22px var(--font-sans)',
                  margin: '0 auto',
                  border: `1px solid ${integration.color}33`,
                }}
              >
                {integration.icon}
              </div>
              <div>
                <div style={{ font: '600 16px var(--font-sans)', marginBottom: 6 }}>
                  Redirecting to {integration.name}…
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Connecting securely via OAuth 2.0
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="live-dot"
                    style={{
                      width: 8, height: 8,
                      animationDelay: `${i * 0.25}s`,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* phase: authorize */}
          {phase === 'authorize' && (
            <>
              <div
                style={{
                  width: 56, height: 56, borderRadius: 15,
                  background: integration.color + '22', color: integration.color,
                  display: 'grid', placeItems: 'center',
                  font: '700 22px var(--font-sans)',
                  margin: '0 auto',
                  border: `1px solid ${integration.color}33`,
                }}
              >
                {integration.icon}
              </div>
              <div>
                <div style={{ font: '600 16px var(--font-sans)', marginBottom: 8 }}>
                  Authorize BizBoost
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>
                  Allow BizBoost to access your <strong style={{ color: 'var(--text)' }}>{integration.name}</strong> account to sync data, manage ads, and report performance.
                </div>
              </div>
              <div
                style={{
                  padding: '14px 16px', borderRadius: 10,
                  background: 'var(--bg-3)', border: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <div className="eyebrow" style={{ marginBottom: 8 }}>BizBoost will be able to:</div>
                {[
                  'Read account and campaign data',
                  'Pull performance metrics in real time',
                  'Post reports and insights to your dashboard',
                ].map((item, i) => (
                  <div key={i} className="row gap-2" style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: 6, alignItems: 'center' }}>
                    <Icon name="check" size={12} color="var(--lime)" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="row gap-3" style={{ justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onClose} style={{ height: 36 }}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ height: 36 }}
                  onClick={() => setPhase('success')}
                >
                  <Icon name="link" size={14} />
                  Authorise
                </button>
              </div>
            </>
          )}

          {/* phase: success */}
          {phase === 'success' && (
            <>
              <span
                style={{
                  width: 56, height: 56, borderRadius: 15,
                  background: 'var(--lime)', color: '#0a0a0a',
                  display: 'grid', placeItems: 'center',
                  margin: '0 auto',
                  boxShadow: '0 0 24px #cfff3a55',
                }}
              >
                <Icon name="check" size={22} />
              </span>
              <div>
                <div style={{ font: '600 16px var(--font-sans)', marginBottom: 6, color: 'var(--text)' }}>
                  {integration.name} connected!
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                  Data will start syncing within a few seconds.
                </div>
              </div>
              <button
                className="btn btn-primary"
                style={{ height: 36 }}
                onClick={() => { onConnected(); onClose() }}
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Integration card ----
function IntegrationCard({ item, onConnect, onManage }: {
  item: IntegrationItem
  onConnect: () => void
  onManage: () => void
}) {
  const isConnected = item.status === 'connected'
  const isPartial = item.status === 'partial'
  const isDisconnected = item.status === 'disconnected'

  return (
    <div
      className="panel"
      style={{
        padding: 16,
        borderColor: isConnected ? '#cfff3a33' : isPartial ? '#ffb54733' : 'var(--border)',
        borderStyle: isDisconnected ? 'dashed' : 'solid',
        background: isConnected
          ? 'linear-gradient(135deg, #cfff3a06, var(--bg-1))'
          : isPartial
          ? 'linear-gradient(135deg, #ffb54706, var(--bg-1))'
          : 'var(--bg-1)',
      }}
    >
      <div className="row between" style={{ marginBottom: 12 }}>
        <span
          style={{
            width: 44, height: 44, borderRadius: 12,
            display: 'grid', placeItems: 'center',
            background: item.color + '22', color: item.color,
            font: '700 18px var(--font-sans)',
            flexShrink: 0, border: `1px solid ${item.color}33`,
          }}
        >
          {item.icon}
        </span>
        {isConnected && (
          <span className="chip chip-lime" style={{ height: 22 }}>
            <span className="dot" />
            Connected
          </span>
        )}
        {isPartial && (
          <span className="chip chip-amber" style={{ height: 22 }}>
            <span className="dot" />
            Partial
          </span>
        )}
        {isDisconnected && (
          <span className="chip chip-dim" style={{ height: 22 }}>Not connected</span>
        )}
      </div>

      <div className="col" style={{ gap: 3, marginBottom: 12 }}>
        <span style={{ font: '600 14px var(--font-sans)', color: 'var(--text)' }}>{item.name}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {isDisconnected
            ? 'Available to connect'
            : `Active on ${item.connectedTo} ${item.connectedTo === 1 ? 'client' : 'clients'}`}
        </span>
      </div>

      {isConnected && (
        <button onClick={onManage} className="btn" style={{ width: '100%', justifyContent: 'center', height: 32 }}>
          Manage
        </button>
      )}
      {isPartial && (
        <button onClick={onManage} className="btn" style={{ width: '100%', justifyContent: 'center', height: 32, color: 'var(--amber)', borderColor: 'var(--amber)' }}>
          Fix setup
        </button>
      )}
      {isDisconnected && (
        <button
          onClick={onConnect}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', height: 32 }}
        >
          <Icon name="link" size={13} />
          Connect
        </button>
      )}
    </div>
  )
}

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(INTEGRATIONS_DATA.map(i => [i.id, i.status]))
  )
  const [oauthTarget, setOauthTarget] = useState<IntegrationItem | null>(null)

  const items = INTEGRATIONS_DATA.map(i => ({ ...i, status: statuses[i.id] || i.status }))

  const connected = items.filter(i => i.status === 'connected').length
  const partial = items.filter(i => i.status === 'partial').length
  const available = items.filter(i => i.status === 'disconnected').length

  function handleConnected(id: string) {
    setStatuses(prev => ({ ...prev, [id]: 'connected' }))
  }

  return (
    <div className="page-root">
      <TopBar crumbs={[{ label: 'Integrations' }]} />
      <div className="page-inner" style={{ maxWidth: 1080 }}>
        {/* header */}
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="col gap-2">
            <div className="eyebrow">{connected} of {items.length} connected</div>
            <div className="h-display" style={{ fontSize: 38 }}>Integrations</div>
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Connect your tools — sync once, works for every client.</span>
          </div>
        </div>

        {/* summary bar */}
        <div
          className="panel"
          style={{
            padding: 0, overflow: 'hidden',
            background: 'linear-gradient(120deg, #14180d, transparent 60%)',
            borderColor: '#cfff3a2e',
          }}
        >
          <div className="row">
            {[
              { label: 'Connected', value: connected, accent: 'var(--lime)', border: true },
              { label: 'Partial', value: partial, accent: 'var(--amber)', border: true },
              { label: 'Available', value: available, accent: 'var(--text-3)', border: false },
            ].map(stat => (
              <div
                key={stat.label}
                className="col gap-1"
                style={{
                  padding: '16px 24px', flex: 1,
                  borderRight: stat.border ? '1px solid var(--border)' : 'none',
                }}
              >
                <span className="eyebrow" style={{ margin: 0 }}>{stat.label}</span>
                <span className="num" style={{ font: '700 26px var(--font-sans)', color: stat.accent, letterSpacing: '-0.02em' }}>
                  {stat.value}
                </span>
              </div>
            ))}
            <div
              className="col gap-1"
              style={{ padding: '16px 24px', flex: 2, justifyContent: 'center' }}
            >
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <span
                  style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: 'var(--lime)', color: '#0a0a0a',
                    display: 'grid', placeItems: 'center',
                    boxShadow: '0 0 14px #cfff3a44',
                  }}
                >
                  <Icon name="link" size={14} />
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.45 }}>
                  Connect a source once and it syncs for every client — no per-account setup.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {items.map(item => (
            <IntegrationCard
              key={item.id}
              item={item}
              onConnect={() => setOauthTarget(item)}
              onManage={() => alert(`Manage ${item.name} — coming soon`)}
            />
          ))}
        </div>
      </div>

      {/* OAuth modal */}
      {oauthTarget && (
        <OAuthModal
          integration={oauthTarget}
          onClose={() => setOauthTarget(null)}
          onConnected={() => handleConnected(oauthTarget.id)}
        />
      )}
    </div>
  )
}
