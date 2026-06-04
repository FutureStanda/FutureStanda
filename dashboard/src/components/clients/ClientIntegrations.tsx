'use client'

import React, { useState, useEffect } from 'react'
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/charts'
import type { Client } from '@/types'

// ---- Integration catalogue ----

type IntegrationCategory = 'Advertising' | 'Analytics' | 'Presence' | 'Payments' | 'Comms'

interface IntegItem {
  id: string
  name: string
  description: string
  category: IntegrationCategory
  color: string
  icon: string
}

const INTEGRATIONS: IntegItem[] = [
  // Advertising
  { id: 'meta',  name: 'Meta Ads',             description: 'Facebook & Instagram ad campaigns, ROAS tracking', category: 'Advertising', color: '#1877F2', icon: 'M' },
  { id: 'gads',  name: 'Google Ads',           description: 'Search and Performance Max campaigns',            category: 'Advertising', color: '#34A853', icon: 'G' },
  // Analytics
  { id: 'ga',    name: 'Google Analytics 4',   description: 'Website traffic, conversions, visitor behaviour', category: 'Analytics',   color: '#F9AB00', icon: 'G' },
  { id: 'gsc',   name: 'Google Search Console',description: 'Organic search rankings and impressions',         category: 'Analytics',   color: '#4285F4', icon: 'G' },
  // Presence
  { id: 'gbp',   name: 'Google Business',      description: 'Reviews, star rating, map visibility',            category: 'Presence',    color: '#34A853', icon: 'G' },
  { id: 'ig',    name: 'Facebook Page',        description: 'Page insights, follower growth, posts',           category: 'Presence',    color: '#1877F2', icon: 'f' },
  // Payments
  { id: 'stripe',name: 'Stripe',               description: 'Revenue tracking, bookings, payment events',      category: 'Payments',    color: '#635BFF', icon: 'S' },
  // Comms
  { id: 'wa',    name: 'WhatsApp Business',    description: 'Missed call recovery, chatbot routing',           category: 'Comms',       color: '#25D366', icon: 'W' },
  { id: 'cal',   name: 'Cal.com',              description: 'Booking calendar, availability, confirmations',   category: 'Comms',       color: '#006BFF', icon: 'C' },
  { id: 'sms',   name: 'SMS / Text-back',      description: 'Auto-reply to missed calls within 60 seconds',   category: 'Comms',       color: '#FFB347', icon: 'T' },
]

// ---- Which metrics each integration unlocks ----
const METRIC_SOURCES: Record<string, { label: string; needs: string[] }> = {
  leads30:    { label: 'Leads · 30d',      needs: ['meta', 'ga', 'gbp'] },
  bookings30: { label: 'Bookings',         needs: ['cal', 'stripe'] },
  revenue30:  { label: 'Revenue',          needs: ['stripe'] },
  roas:       { label: 'ROAS',             needs: ['meta', 'gads'] },
  reviews:    { label: 'Reviews',          needs: ['gbp'] },
  website:    { label: 'Website traffic',  needs: ['ga'] },
  social:     { label: 'Social following', needs: ['ig', 'meta'] },
  calls:      { label: 'Missed calls',     needs: ['wa'] },
}

type ConnState = 'connected' | 'connecting' | 'requested' | undefined

interface Props {
  c: Client
  onConnected?: (ids: string[]) => void
}

interface ConnectCardProps {
  item: IntegItem
  state: ConnState
  onConnect: (id: string) => void
  onDisconnect: (id: string) => void
  onRequest: (id: string) => void
}

function ConnectCard({ item, state, onConnect, onDisconnect, onRequest }: ConnectCardProps) {
  const isConnected  = state === 'connected'
  const isConnecting = state === 'connecting'
  const isRequested  = state === 'requested'

  return (
    <div
      className="panel"
      style={{
        padding: 16,
        border: `1px solid ${isConnected ? item.color + '44' : 'var(--border)'}`,
        background: isConnected ? item.color + '08' : 'var(--bg-1)',
        transition: 'border-color .2s, background .2s',
      }}
    >
      {/* Top row */}
      <div className="row between" style={{ marginBottom: 10 }}>
        <div className="row gap-3">
          {/* Icon */}
          <span style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: item.color + '22',
            border: `1px solid ${item.color}44`,
            display: 'grid', placeItems: 'center',
            fontSize: 14, fontWeight: 700, color: item.color,
          }}>
            {item.icon}
          </span>
          <div className="col" style={{ gap: 2 }}>
            <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>{item.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{item.description}</span>
          </div>
        </div>

        {/* Status chip */}
        {isConnected && (
          <span className="chip chip-lime" style={{ flexShrink: 0, fontSize: 10.5 }}>
            <span className="dot" />Connected
          </span>
        )}
        {isRequested && (
          <span className="chip chip-amber" style={{ flexShrink: 0, fontSize: 10.5 }}>
            Requested
          </span>
        )}
        {isConnecting && (
          <span className="chip chip-dim" style={{ flexShrink: 0, fontSize: 10.5 }}>
            Connecting…
          </span>
        )}
        {!isConnected && !isConnecting && !isRequested && (
          <span className="chip chip-dim" style={{ flexShrink: 0, fontSize: 10.5 }}>
            Not connected
          </span>
        )}
      </div>

      {/* Action button */}
      <div className="row gap-2" style={{ marginTop: 2 }}>
        {isConnected ? (
          <button
            onClick={() => onDisconnect(item.id)}
            className="btn"
            style={{ height: 28, fontSize: 12 }}
          >
            Disconnect
          </button>
        ) : isConnecting ? (
          <button disabled className="btn" style={{ height: 28, fontSize: 12, opacity: 0.6 }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              border: '2px solid var(--border-strong)',
              borderTopColor: 'var(--lime)',
              animation: 'spin .7s linear infinite',
              flexShrink: 0,
            }} />
            Connecting…
          </button>
        ) : isRequested ? (
          <button
            onClick={() => onConnect(item.id)}
            className="btn"
            style={{ height: 28, fontSize: 12 }}
          >
            <Icon name="link" size={12} />Connect now
          </button>
        ) : (
          <button
            onClick={() => onConnect(item.id)}
            className="btn btn-primary"
            style={{ height: 28, fontSize: 12 }}
          >
            <Icon name="link" size={12} />Connect
          </button>
        )}
      </div>
    </div>
  )
}

export function ClientIntegrations({ c, onConnected }: Props) {
  const [connState, setConnState] = useState<Record<string, ConnState>>(() => {
    const o: Record<string, ConnState> = {}
    ;(c.connected || []).forEach(id => { o[id] = 'connected' })
    return o
  })

  // Notify parent when connected list changes
  useEffect(() => {
    const ids = Object.keys(connState).filter(k => connState[k] === 'connected')
    onConnected?.(ids)
  }, [connState]) // eslint-disable-line react-hooks/exhaustive-deps

  function connect(id: string) {
    setConnState(s => ({ ...s, [id]: 'connecting' }))
    setTimeout(() => {
      setConnState(s => ({ ...s, [id]: 'connected' }))
    }, 1100)
  }

  function disconnect(id: string) {
    setConnState(s => {
      const n = { ...s }
      delete n[id]
      return n
    })
  }

  function request(id: string) {
    setConnState(s => ({ ...s, [id]: 'requested' }))
  }

  const connectedIds = Object.keys(connState).filter(k => connState[k] === 'connected')
  const total = INTEGRATIONS.length
  const connectedCount = connectedIds.length
  const pendingItems = INTEGRATIONS.filter(i => !connState[i.id] || connState[i.id] === 'requested')

  const CATEGORIES: IntegrationCategory[] = ['Advertising', 'Analytics', 'Presence', 'Payments', 'Comms']

  return (
    <div className="col gap-4 fadeup">
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: 18,
          background: 'linear-gradient(120deg,#101810,transparent 60%)',
          borderColor: '#cfff3a2e',
        }}
      >
        <div className="row between">
          <div className="row gap-3">
            <Ring pct={Math.round(connectedCount / total * 100)} size={48} stroke={5} color="var(--lime)">
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--lime)', fontVariantNumeric: 'tabular-nums' }}>
                {connectedCount}/{total}
              </span>
            </Ring>
            <div className="col" style={{ gap: 2 }}>
              <span style={{ font: '600 15px var(--font-sans)' }}>Connected accounts</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Everything we need to run {c.name} end-to-end
              </span>
            </div>
          </div>
          {pendingItems.length > 0 && (
            <button
              onClick={() => pendingItems.forEach(p => request(p.id))}
              className="btn"
              style={{ height: 32 }}
            >
              <Icon name="mail" size={13} />
              Request access pack ({pendingItems.length})
            </button>
          )}
        </div>

        {/* Live metrics status */}
        <div
          className="row gap-2"
          style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}
        >
          {Object.entries(METRIC_SOURCES).map(([key, src]) => {
            const isLive = src.needs.some(n => connectedIds.includes(n))
            return (
              <span
                key={key}
                className="chip"
                style={{
                  background: isLive ? '#cfff3a12' : 'var(--bg-2)',
                  color: isLive ? 'var(--lime)' : 'var(--text-3)',
                  borderColor: isLive ? '#cfff3a3a' : 'var(--border)',
                }}
              >
                {isLive
                  ? <Icon name="check" size={11} />
                  : <Icon name="link" size={11} />
                }
                {src.label}
              </span>
            )
          })}
        </div>
      </div>

      {/* Category sections */}
      {CATEGORIES.map(cat => {
        const items = INTEGRATIONS.filter(i => i.category === cat)
        if (!items.length) return null
        return (
          <div key={cat} className="col gap-2">
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--text-3)',
            }}>
              {cat}
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {items.map(it => (
                <ConnectCard
                  key={it.id}
                  item={it}
                  state={connState[it.id]}
                  onConnect={connect}
                  onDisconnect={disconnect}
                  onRequest={request}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Spin keyframe (inline so no global CSS needed) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default ClientIntegrations
