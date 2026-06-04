'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Icon } from '@/components/ui/icons'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string
  kind: 'trigger' | 'action' | 'filter'
  name: string
  icon: string
  x: number
  y: number
  hook: string | null
  template: string
  tType?: string
  cond?: Record<string, string>
}

export interface CanvasEdge {
  from: string
  to: string
}

export interface CanvasGraph {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

export interface Automation {
  id: string
  name: string
  trigger: string
  triggerSource: string
  steps: number
  client: string | null
  enabled: boolean
  runCount: number
  lastRun: string
  icon: string
  accent: string
}

interface AutomationCanvasProps {
  open: boolean
  automation: Automation | null
  onClose: () => void
  onSave: (nodes: CanvasNode[], edges: CanvasEdge[]) => void
}

// ─── Constants ─────────────────────────────────────────────────────────────

const NODE_HOOKS = [
  { id: 'meta', name: 'Meta / Facebook', icon: 'megaphone', color: '#4A90E2' },
  { id: 'google', name: 'Google Ads', icon: 'trend', color: '#34A853' },
  { id: 'gbp', name: 'Google Business', icon: 'star', color: '#FFB547' },
  { id: 'wa', name: 'WhatsApp', icon: 'msg', color: '#25D366' },
  { id: 'stripe', name: 'Stripe', icon: 'euro', color: '#8B7CFF' },
  { id: 'cal', name: 'Calendar', icon: 'calendar', color: '#5BCEFA' },
  { id: 'ai', name: 'AI Agent', icon: 'sparkle', color: '#CFFF3A' },
  { id: 'sms', name: 'SMS / Phone', icon: 'phoneMissed', color: '#FF7A8A' },
  { id: 'email', name: 'Email / Gmail', icon: 'mail', color: '#EA4335' },
  { id: 'slack', name: 'Slack', icon: 'msg', color: '#E01E5A' },
  { id: 'telegram', name: 'Telegram', icon: 'bell', color: '#2AABEE' },
  { id: 'sheets', name: 'Google Sheets', icon: 'layers', color: '#0F9D58' },
  { id: 'hubspot', name: 'HubSpot CRM', icon: 'users', color: '#FF7A59' },
  { id: 'notion', name: 'Notion', icon: 'doc', color: '#cfcfcf' },
  { id: 'openai', name: 'OpenAI / GPT', icon: 'sparkle', color: '#10A37F' },
  { id: 'webhook', name: 'Webhook / HTTP', icon: 'link', color: '#9b8cff' },
  { id: 'zapier', name: 'Zapier', icon: 'bolt', color: '#FF4F00' },
]

const TRIGGER_TYPES_LIST = [
  { id: 'status', name: 'Status change', icon: 'euro', ex: '→ Paid / Onboarding / Live' },
  { id: 'lead', name: 'New lead', icon: 'inbox', ex: 'from any source' },
  { id: 'inbound', name: 'Inbound message', icon: 'msg', ex: 'DM / WhatsApp / SMS' },
  { id: 'missed', name: 'Missed call', icon: 'phoneMissed', ex: 'on a client line' },
  { id: 'review', name: 'New review', icon: 'star', ex: 'Google / Facebook' },
  { id: 'schedule', name: 'Schedule', icon: 'clock', ex: 'hourly / daily / weekly' },
]

const NODE_PALETTE = [
  { kind: 'action' as const, name: 'Run AI agent', icon: 'sparkle', desc: 'Agent evaluates & acts' },
  { kind: 'action' as const, name: 'Send message', icon: 'msg', desc: 'SMS / WhatsApp / email' },
  { kind: 'action' as const, name: 'Create task', icon: 'checkSquare', desc: 'Adds a task to the queue' },
  { kind: 'action' as const, name: 'Book / calendar', icon: 'calendar', desc: 'Creates a booking' },
  { kind: 'action' as const, name: 'Post content', icon: 'megaphone', desc: 'Drafts & schedules a post' },
  { kind: 'action' as const, name: 'Notify you', icon: 'bell', desc: 'Telegram + in-app ping' },
  { kind: 'filter' as const, name: 'Condition', icon: 'shield', desc: 'Only continue if…' },
  { kind: 'action' as const, name: 'Wait / delay', icon: 'clock', desc: 'Pause then continue' },
]

const NW = 210 // node width
const NH = 78  // node height

// ─── Utility ───────────────────────────────────────────────────────────────

function genBlankGraph(): CanvasGraph {
  return {
    nodes: [{ id: 'n_trigger', kind: 'trigger', name: 'Trigger', icon: 'bolt', x: 60, y: 200, hook: null, template: '' }],
    edges: [],
  }
}

function genGraphFromAutomation(automation: Automation): CanvasGraph {
  const triggerNode: CanvasNode = {
    id: 'n_trigger',
    kind: 'trigger',
    name: automation.trigger,
    icon: 'bolt',
    x: 60,
    y: 200,
    hook: null,
    template: '',
  }
  const nodes: CanvasNode[] = [triggerNode]
  const stepCount = automation.steps
  for (let i = 0; i < stepCount; i++) {
    nodes.push({
      id: 'n' + i,
      kind: 'action',
      name: i === 0 ? 'AI processes' : automation.trigger,
      icon: i === 0 ? 'sparkle' : automation.icon,
      x: 320 + i * 270,
      y: 200,
      hook: null,
      template: '',
    })
  }
  const edges: CanvasEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id })
  }
  return { nodes, edges }
}

// ─── Node Config Panel ─────────────────────────────────────────────────────

interface NodeConfigProps {
  node: CanvasNode
  accent: string
  onPatch: (patch: Partial<CanvasNode>) => void
  onDelete: () => void
  onClose: () => void
}

function NodeConfig({ node, accent, onPatch, onDelete, onClose }: NodeConfigProps) {
  const isTrigger = node.kind === 'trigger'
  const hookMeta = NODE_HOOKS.find(h => h.id === node.hook)
  const [sec, setSec] = useState<string>(isTrigger ? 'event' : 'connect')

  useEffect(() => {
    setSec(isTrigger ? 'event' : 'connect')
  }, [node.id, isTrigger])

  const sections = isTrigger
    ? [
        { id: 'event', label: 'Event', icon: 'bolt' },
        { id: 'source', label: 'Source', icon: 'link' },
        { id: 'detail', label: 'Details', icon: 'clock' },
      ]
    : [
        { id: 'connect', label: 'Connect', icon: 'link' },
        { id: 'action', label: 'Action', icon: 'msg' },
      ]

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 52,
    right: 0,
    bottom: 0,
    width: 320,
    background: 'var(--bg-1)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 260,
    overflowY: 'auto',
  }

  return (
    <div style={panelStyle} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 11px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          {isTrigger ? 'Trigger' : 'Configure node'}
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: 6 }}>
          <Icon name="x" size={14} />
        </button>
      </div>

      {/* Name input */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)' }}>{isTrigger ? 'Trigger name' : 'Step name'}</label>
          <input
            value={node.name}
            onChange={e => onPatch({ name: e.target.value })}
            style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', font: '400 13px var(--font-sans)', outline: 'none' }}
          />
        </div>
        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSec(s.id)}
              style={{
                flex: 1, height: 30, borderRadius: 8, border: '1px solid', cursor: 'pointer',
                background: sec === s.id ? accent + '1f' : 'var(--bg-2)',
                borderColor: sec === s.id ? accent + '88' : 'var(--border)',
                color: sec === s.id ? accent : 'var(--text-3)',
                font: '500 11.5px var(--font-sans)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <Icon name={s.icon} size={12} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section content */}
      <div style={{ padding: 16, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* TRIGGER EVENT */}
        {isTrigger && sec === 'event' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)' }}>What happens?</label>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>Pick the event that kicks this automation off.</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {TRIGGER_TYPES_LIST.map(t => {
                const active = node.tType === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => onPatch({ tType: t.id })}
                    style={{
                      padding: '9px 10px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      background: active ? 'var(--lime)1f' : 'var(--bg-2)',
                      border: '1px solid ' + (active ? 'var(--lime)' : 'var(--border)'),
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <span style={{ width: 24, height: 24, borderRadius: 7, display: 'grid', placeItems: 'center', background: active ? 'var(--lime)' : 'var(--bg-3)', color: active ? '#0a0a0a' : 'var(--lime)', flexShrink: 0 }}>
                      <Icon name={t.icon} size={12} />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                      <span style={{ font: '600 11px var(--font-sans)', color: active ? '#fff' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <span style={{ fontSize: 9.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.ex}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* TRIGGER DETAIL */}
        {isTrigger && sec === 'detail' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)' }}>Setup details</label>
            <textarea
              value={node.template || ''}
              onChange={e => onPatch({ template: e.target.value })}
              rows={5}
              placeholder="Describe when this trigger should fire and what data it captures…"
              style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', font: '400 13px var(--font-sans)', resize: 'vertical', lineHeight: 1.5, outline: 'none' }}
            />
          </div>
        )}

        {/* SOURCE / CONNECT */}
        {((isTrigger && sec === 'source') || (!isTrigger && sec === 'connect')) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)' }}>{isTrigger ? 'Which app fires this?' : 'What powers this step?'}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {NODE_HOOKS.map(h => {
                const active = node.hook === h.id
                return (
                  <button
                    key={h.id}
                    onClick={() => onPatch({ hook: active ? null : h.id })}
                    style={{
                      padding: '8px 9px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                      background: active ? h.color + '1f' : 'var(--bg-2)',
                      border: '1px solid ' + (active ? h.color : 'var(--border)'),
                      display: 'flex', alignItems: 'center', gap: 7,
                    }}
                  >
                    <span style={{ width: 22, height: 22, borderRadius: 6, display: 'grid', placeItems: 'center', background: active ? h.color : 'var(--bg-3)', color: active ? '#0a0a0a' : h.color, flexShrink: 0 }}>
                      <Icon name={h.icon} size={11} />
                    </span>
                    <span style={{ font: '500 10.5px var(--font-sans)', color: active ? '#fff' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</span>
                  </button>
                )
              })}
            </div>
            {hookMeta && (
              <div style={{ padding: '10px 12px', background: hookMeta.color + '11', border: '1px solid ' + hookMeta.color + '33', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ color: hookMeta.color }}><Icon name="check" size={14} /></span>
                <span style={{ font: '500 12px var(--font-sans)', color: hookMeta.color }}>Connected: {hookMeta.name}</span>
              </div>
            )}
          </div>
        )}

        {/* ACTION TEMPLATE */}
        {!isTrigger && sec === 'action' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ font: '500 11px var(--font-sans)', color: 'var(--text-3)' }}>What it does</label>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>
              The message, content, or rule this step runs{hookMeta ? ' through ' + hookMeta.name : ''}.
            </span>
            <textarea
              value={node.template || ''}
              onChange={e => onPatch({ template: e.target.value })}
              rows={6}
              placeholder={`e.g. "Hi {{name}}, thanks for getting in touch — when suits for a quick call?"`}
              style={{ width: '100%', padding: '9px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', font: '400 13px var(--font-sans)', resize: 'vertical', lineHeight: 1.55, outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: node.hook ? accent : 'var(--text-3)', flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: node.hook ? accent : 'var(--text-3)' }}>
            {isTrigger
              ? (node.tType ? 'Trigger is set' : 'Pick an event to activate')
              : (node.hook ? 'Connected & ready' : 'Pick what powers this step')}
          </span>
        </div>
      </div>

      {/* Delete */}
      {!isTrigger && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', font: '500 12.5px var(--font-sans)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name="trash" size={13} />
            Delete node
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Trigger Picker (blank slate) ──────────────────────────────────────────

interface TriggerPickerProps {
  onPick: (tType: string) => void
}

function TriggerPicker({ onPick }: TriggerPickerProps) {
  return (
    <div style={{ width: 280, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 12px' }}>
        <span style={{ font: '600 11px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Choose a trigger</span>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.45 }}>What kicks this automation off?</p>
      </div>
      <div style={{ padding: '0 12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TRIGGER_TYPES_LIST.map(t => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            style={{
              padding: '11px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'border-color .15s, background .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lime)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-2)'; }}
          >
            <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg-3)', color: 'var(--lime)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={t.icon} size={15} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>{t.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.ex}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Node Palette ───────────────────────────────────────────────────────────

interface NodePaletteProps {
  accent: string
  onAdd: (p: { kind: 'action' | 'filter'; name: string; icon: string }) => void
  onClose: () => void
}

function NodePalette({ accent, onAdd, onClose }: NodePaletteProps) {
  return (
    <div style={{ width: 260, background: 'var(--bg-1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 11px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Add a node</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 5 }}>
          <Icon name="x" size={13} />
        </button>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {NODE_PALETTE.map((p, i) => (
          <button
            key={i}
            onClick={() => onAdd(p)}
            style={{
              padding: '10px 11px', borderRadius: 9, cursor: 'pointer', textAlign: 'left',
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 9,
              transition: 'border-color .13s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = accent + '88'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
          >
            <span style={{ width: 30, height: 30, borderRadius: 8, background: accent + '22', color: accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={p.icon} size={14} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
              <span style={{ font: '600 12.5px var(--font-sans)', color: 'var(--text)' }}>{p.name}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{p.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Run Log ────────────────────────────────────────────────────────────────

interface RunLogProps {
  log: Array<{ node: string; via: string }>
  running: boolean
  onClose: () => void
}

function RunLog({ log, running, onClose }: RunLogProps) {
  return (
    <div
      style={{
        position: 'absolute', bottom: 20, left: 20, width: 280,
        background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 12,
        padding: 14, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ font: '600 11px var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Run log</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', width: 22, height: 22, display: 'grid', placeItems: 'center' }}>
          <Icon name="x" size={12} />
        </button>
      </div>
      {log.length === 0 ? (
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Hit Run to watch it flow through every node.</span>
      ) : (
        log.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeup 0.3s ease both', animationDelay: i * 0.05 + 's' }}>
            <span style={{ color: 'var(--lime)', flexShrink: 0 }}><Icon name="check" size={12} /></span>
            <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1 }}>{r.node}</span>
            <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{r.via}</span>
          </div>
        ))
      )}
      {running && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span className="live-dot" />
          <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Executing…</span>
        </div>
      )}
    </div>
  )
}

// ─── Main Canvas ────────────────────────────────────────────────────────────

export default function AutomationCanvas({ open, automation, onClose, onSave }: AutomationCanvasProps) {
  const [graph, setGraph] = useState<CanvasGraph>(genBlankGraph)
  const [selId, setSelId] = useState<string | null>(null)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [runLog, setRunLog] = useState<Array<{ node: string; via: string }>>([])
  const [showLog, setShowLog] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [triggerPicker, setTriggerPicker] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)
  const graphRef = useRef<CanvasGraph>(graph)
  graphRef.current = graph

  const dragRef = useRef<{ id: string; startX: number; startY: number; ox: number; oy: number; moved: boolean } | null>(null)
  const panRef = useRef<{ sx: number; sy: number; sl: number; st: number; moved: boolean } | null>(null)
  const wireRef = useRef<{ from: string; rect: DOMRect } | null>(null)
  const [wireLive, setWireLive] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)

  const accent = automation?.accent ?? 'var(--lime)'

  // Init graph when automation changes
  useEffect(() => {
    if (!open) return
    if (automation) {
      setGraph(genGraphFromAutomation(automation))
      setTriggerPicker(false)
    } else {
      setGraph(genBlankGraph())
      setTriggerPicker(true)
    }
    setSelId(null)
    setConnectFrom(null)
    setShowPalette(false)
    setShowLog(false)
    setRunLog([])
  }, [open, automation])

  const getNode = useCallback((id: string) => graphRef.current.nodes.find(n => n.id === id), [])

  function commit(g: CanvasGraph) {
    setGraph(g)
    graphRef.current = g
  }

  // ── Panning ────────────────────────────────────────────────

  function onCanvasPointerDown(e: React.PointerEvent) {
    const target = e.target as HTMLElement
    if (target.closest('[data-node]') || target.closest('[data-cfg]')) return
    const el = canvasRef.current!
    panRef.current = { sx: e.clientX, sy: e.clientY, sl: el.scrollLeft, st: el.scrollTop, moved: false }
    el.style.cursor = 'grabbing'
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!panRef.current) return
      const p = panRef.current
      const dx = e.clientX - p.sx
      const dy = e.clientY - p.sy
      if (Math.abs(dx) + Math.abs(dy) > 3) p.moved = true
      const el = canvasRef.current
      if (el) { el.scrollLeft = p.sl - dx; el.scrollTop = p.st - dy }
    }
    function onUp() {
      if (!panRef.current) return
      panRef.current = null
      if (canvasRef.current) canvasRef.current.style.cursor = ''
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  // ── Node dragging ───────────────────────────────────────────

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    const target = e.target as HTMLElement
    if (target.closest('[data-port]') || target.closest('[data-cfg]')) return
    const n = getNode(id)
    if (!n) return
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ox: n.x, oy: n.y, moved: false }
    e.stopPropagation()
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragRef.current) return
      const d = dragRef.current
      const dx = e.clientX - d.startX
      const dy = e.clientY - d.startY
      if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
      setGraph(g => ({ ...g, nodes: g.nodes.map(n => n.id === d.id ? { ...n, x: Math.max(0, d.ox + dx), y: Math.max(0, d.oy + dy) } : n) }))
    }
    function onUp() {
      if (!dragRef.current) return
      const { moved, id } = dragRef.current
      dragRef.current = null
      if (!moved) setSelId(s => (s === id ? s : id))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  // ── Wire drawing ────────────────────────────────────────────

  function onOutPortPointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    wireRef.current = { from: id, rect }
    setConnectFrom(id)
  }

  function onInPortClick(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!connectFrom || connectFrom === id) return
    const exists = graphRef.current.edges.some(ed => ed.from === connectFrom && ed.to === id)
    if (!exists) {
      commit({ ...graphRef.current, edges: [...graphRef.current.edges, { from: connectFrom, to: id }] })
    }
    setConnectFrom(null)
    wireRef.current = null
    setWireLive(null)
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!wireRef.current) return
      const w = wireRef.current
      const el = canvasRef.current!
      const x = e.clientX - w.rect.left + el.scrollLeft
      const y = e.clientY - w.rect.top + el.scrollTop
      const a = graphRef.current.nodes.find(n => n.id === w.from)
      if (!a) return
      setWireLive({ x1: a.x + NW, y1: a.y + NH / 2, x2: x, y2: y })
    }
    function onUp(e: PointerEvent) {
      if (!wireRef.current) return
      const w = wireRef.current
      wireRef.current = null
      setWireLive(null)
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const port = el?.closest?.('[data-nodein]') as HTMLElement | null
      if (port) {
        const to = port.getAttribute('data-nodein')
        if (to && to !== w.from) {
          const g = graphRef.current
          if (!g.edges.some(ed => ed.from === w.from && ed.to === to)) {
            commit({ ...g, edges: [...g.edges, { from: w.from, to }] })
          }
        }
      }
      setConnectFrom(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  // ── Graph mutations ────────────────────────────────────────

  function addNode(p: { kind: 'action' | 'filter'; name: string; icon: string }) {
    const id = 'n_' + Date.now().toString(36)
    const last = graph.nodes[graph.nodes.length - 1]
    const nn: CanvasNode = { id, kind: p.kind, name: p.name, icon: p.icon, x: (last ? last.x + 60 : 320), y: (last ? last.y + 110 : 200), hook: null, template: '' }
    commit({ ...graph, nodes: [...graph.nodes, nn] })
    setShowPalette(false)
    setSelId(id)
  }

  function removeEdge(idx: number) {
    commit({ ...graph, edges: graph.edges.filter((_, i) => i !== idx) })
  }

  function delNode(id: string) {
    if (id === 'n_trigger') return
    commit({ nodes: graph.nodes.filter(n => n.id !== id), edges: graph.edges.filter(e => e.from !== id && e.to !== id) })
    setSelId(null)
  }

  function patchNode(id: string, patch: Partial<CanvasNode>) {
    commit({ ...graph, nodes: graph.nodes.map(n => n.id === id ? { ...n, ...patch } : n) })
  }

  function pickTrigger(tType: string) {
    const triggerType = TRIGGER_TYPES_LIST.find(t => t.id === tType)
    patchNode('n_trigger', { tType, name: triggerType?.name ?? 'Trigger' })
    setTriggerPicker(false)
  }

  // ── Run simulation ─────────────────────────────────────────

  async function run() {
    setRunning(true)
    setShowLog(true)
    setRunLog([])
    const order: string[] = []
    const seen = new Set<string>()
    function walk(id: string) {
      if (seen.has(id)) return
      seen.add(id)
      order.push(id)
      graphRef.current.edges.filter(e => e.from === id).forEach(e => walk(e.to))
    }
    walk('n_trigger')
    graphRef.current.nodes.forEach(n => { if (!seen.has(n.id)) order.push(n.id) })
    for (const id of order) {
      const n = graphRef.current.nodes.find(nd => nd.id === id)
      if (!n) continue
      setActiveNode(id)
      const hook = NODE_HOOKS.find(h => h.id === n.hook)
      setRunLog(l => [...l, { node: n.name, via: hook ? hook.name : (n.kind === 'trigger' ? 'Trigger fired' : 'Ran') }])
      await new Promise<void>(r => setTimeout(r, 620))
    }
    setActiveNode(null)
    setRunning(false)
  }

  // ── Close on escape ────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (connectFrom) { setConnectFrom(null); return }
        if (selId) { setSelId(null); return }
        onClose()
      }
    }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, connectFrom, selId, onClose])

  if (!open) return null

  const selNode = selId ? graph.nodes.find(n => n.id === selId) ?? null : null
  const hasRightPanel = selNode !== null
  const hasLeftPanel = triggerPicker || showPalette

  const canvasAreaStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0, bottom: 0,
    left: hasLeftPanel ? (triggerPicker ? 280 : 260) : 0,
    right: hasRightPanel ? 320 : 0,
    overflow: 'scroll',
    cursor: connectFrom ? 'crosshair' : 'default',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 250,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Toolbar ── */}
      <div
        style={{
          height: 52, flexShrink: 0,
          background: 'var(--bg-1)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px',
          zIndex: 10,
        }}
      >
        <button onClick={onClose} className="btn" style={{ height: 34, gap: 6 }}>
          <Icon name="chevL" size={13} />
          Close
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

        {/* Automation info */}
        {automation && (
          <>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: accent + '1f', color: accent, border: '1px solid ' + accent + '44', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Icon name={automation.icon} size={13} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0, marginRight: 4 }}>
              <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{automation.name}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-3)' }}>{graph.nodes.length} nodes · {graph.edges.length} connections</span>
            </div>
          </>
        )}
        {!automation && (
          <span style={{ font: '600 13px var(--font-sans)', color: 'var(--text)' }}>New automation</span>
        )}

        {/* Node count badge */}
        <span
          style={{
            height: 22, padding: '0 9px', borderRadius: 99, border: '1px solid var(--border)',
            background: 'var(--bg-2)', color: 'var(--text-3)', font: '500 11px var(--font-sans)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {graph.nodes.length} nodes
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, alignItems: 'center' }}>
          <button
            onClick={() => { setShowPalette(s => !s); setTriggerPicker(false) }}
            className="btn"
            style={{ height: 34 }}
          >
            <Icon name="plus" size={13} />
            Add node
          </button>

          <button
            onClick={() => setShowLog(s => !s)}
            className="btn"
            style={{ height: 34, background: showLog ? 'var(--bg-3)' : undefined }}
          >
            <Icon name="layers" size={13} />
            Run log
          </button>

          <button
            onClick={run}
            disabled={running}
            className="btn btn-primary"
            style={{ height: 34, gap: 6, opacity: running ? 0.7 : 1 }}
          >
            {running ? (
              <>
                <span className="live-dot" style={{ background: '#0a0a0a' }} />
                Running…
              </>
            ) : (
              <>
                <Icon name="play" size={13} />
                Run
              </>
            )}
          </button>

          <button
            onClick={() => onSave(graph.nodes, graph.edges)}
            className="btn btn-primary"
            style={{ height: 34, background: 'var(--bg-2)', borderColor: 'var(--border)', color: 'var(--text)' }}
          >
            <Icon name="check" size={13} />
            Save
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* Left panel: trigger picker or node palette */}
        {triggerPicker && <TriggerPicker onPick={pickTrigger} />}
        {showPalette && !triggerPicker && <NodePalette accent={accent} onAdd={addNode} onClose={() => setShowPalette(false)} />}

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={canvasAreaStyle}
          onPointerDown={onCanvasPointerDown}
          onClick={e => {
            if (panRef.current?.moved) return
            setSelId(null)
            setConnectFrom(null)
          }}
        >
          {/* Connection hint bar */}
          {connectFrom && (
            <div
              style={{
                position: 'sticky', top: 0, left: 0, right: 0, zIndex: 5,
                background: 'var(--lime)', color: '#0a0a0a', padding: '8px 16px',
                font: '600 12px var(--font-sans)', display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Icon name="link" size={13} />
              Click the input port (left side) of another node to connect — or{' '}
              <button
                onClick={e => { e.stopPropagation(); setConnectFrom(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textDecoration: 'underline' }}
              >
                cancel
              </button>
            </div>
          )}

          {/* Infinite scroll area */}
          <div style={{ position: 'relative', width: 3000, height: 1600 }}>
            {/* SVG wires */}
            <svg
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
              width={3000}
              height={1600}
            >
              {graph.edges.map((e, i) => {
                const a = graph.nodes.find(n => n.id === e.from)
                const b = graph.nodes.find(n => n.id === e.to)
                if (!a || !b) return null
                const x1 = a.x + NW, y1 = a.y + NH / 2
                const x2 = b.x, y2 = b.y + NH / 2
                const mx = (x1 + x2) / 2
                const isActive = running && activeNode === e.to
                return (
                  <g key={i} style={{ pointerEvents: 'all' }}>
                    <path
                      d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={isActive ? accent : 'var(--border-strong)'}
                      strokeWidth={isActive ? 3 : 2}
                    />
                    {/* Delete button on wire midpoint */}
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r={9}
                      fill="var(--bg-2)"
                      stroke="var(--border-strong)"
                      style={{ cursor: 'pointer' }}
                      onClick={ev => { ev.stopPropagation(); removeEdge(i) }}
                    />
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 + 3.5}
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--text-3)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      ×
                    </text>
                  </g>
                )
              })}
              {/* Live wire while dragging */}
              {wireLive && (
                <path
                  d={`M ${wireLive.x1} ${wireLive.y1} C ${(wireLive.x1 + wireLive.x2) / 2} ${wireLive.y1}, ${(wireLive.x1 + wireLive.x2) / 2} ${wireLive.y2}, ${wireLive.x2} ${wireLive.y2}`}
                  fill="none"
                  stroke="var(--lime)"
                  strokeWidth="2.5"
                  strokeDasharray="6 5"
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </svg>

            {/* Nodes */}
            {graph.nodes.map(n => {
              const hook = NODE_HOOKS.find(h => h.id === n.hook)
              const isTrigger = n.kind === 'trigger'
              const isActive = activeNode === n.id
              const isSelected = selId === n.id
              const nodeAccent = isTrigger ? 'var(--lime)' : (hook?.color ?? accent)

              return (
                <div
                  key={n.id}
                  data-node={n.id}
                  style={{
                    position: 'absolute',
                    left: n.x,
                    top: n.y,
                    width: NW,
                    height: NH,
                    background: 'var(--bg-2)',
                    border: '1px solid ' + (isActive ? accent : isSelected ? 'var(--border-strong)' : isTrigger ? '#cfff3a55' : 'var(--border)'),
                    borderRadius: 12,
                    padding: '10px 12px',
                    cursor: 'grab',
                    userSelect: 'none',
                    boxShadow: isActive ? '0 0 0 2px ' + accent + '44, 0 8px 24px rgba(0,0,0,0.4)' : isSelected ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                    transition: 'border-color .15s, box-shadow .15s',
                    animation: 'fadeup 0.3s ease both',
                  }}
                  onPointerDown={e => onNodePointerDown(e, n.id)}
                  onClick={e => { e.stopPropagation(); setSelId(n.id) }}
                >
                  {/* Input port */}
                  {!isTrigger && (
                    <span
                      data-port="in"
                      data-nodein={n.id}
                      onClick={e => onInPortClick(e, n.id)}
                      style={{
                        position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)',
                        width: 14, height: 14, borderRadius: '50%',
                        background: connectFrom ? 'var(--lime)' : 'var(--bg-3)',
                        border: '2px solid ' + (connectFrom ? 'var(--lime)' : 'var(--border-strong)'),
                        cursor: connectFrom ? 'pointer' : 'default',
                        zIndex: 2,
                        transition: 'background .15s, border-color .15s',
                      }}
                    />
                  )}

                  {/* Node body */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: nodeAccent + '22', color: nodeAccent, display: 'grid', placeItems: 'center' }}>
                      <Icon name={n.icon} size={13} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <span style={{ font: '600 9.5px var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', color: isTrigger ? 'var(--lime)' : 'var(--text-3)' }}>
                        {isTrigger ? 'TRIGGER' : n.kind === 'filter' ? 'CONDITION' : 'ACTION'}
                      </span>
                      <span style={{ font: '600 12px var(--font-sans)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</span>
                    </div>
                    {/* Config button */}
                    <button
                      data-cfg
                      onClick={e => { e.stopPropagation(); setSelId(n.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', width: 20, height: 20, display: 'grid', placeItems: 'center', borderRadius: 5, flexShrink: 0 }}
                    >
                      <Icon name="edit" size={11} />
                    </button>
                  </div>

                  {/* Hook chip */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {hook ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: hook.color, border: '1px solid ' + hook.color + '55', borderRadius: 99, padding: '1px 7px', background: hook.color + '11' }}>
                        <Icon name="link" size={9} />
                        {hook.name}
                      </span>
                    ) : (
                      <span
                        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: 99, padding: '1px 7px', cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setSelId(n.id) }}
                      >
                        <Icon name="link" size={9} />
                        Not hooked up
                      </span>
                    )}
                    {/* Delete button for non-trigger nodes */}
                    {!isTrigger && (
                      <button
                        onClick={e => { e.stopPropagation(); delNode(n.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 4 }}
                      >
                        <Icon name="x" size={10} />
                      </button>
                    )}
                  </div>

                  {/* Output port */}
                  <span
                    data-port="out"
                    data-nodeout={n.id}
                    onPointerDown={e => onOutPortPointerDown(e, n.id)}
                    style={{
                      position: 'absolute', right: -7, top: '50%', transform: 'translateY(-50%)',
                      width: 14, height: 14, borderRadius: '50%',
                      background: connectFrom === n.id ? 'var(--lime)' : 'var(--bg-3)',
                      border: '2px solid ' + (connectFrom === n.id ? 'var(--lime)' : 'var(--border-strong)'),
                      cursor: 'crosshair',
                      zIndex: 2,
                      transition: 'background .15s, border-color .15s',
                    }}
                  />
                </div>
              )
            })}

            {/* Run log inside canvas */}
            {showLog && (
              <RunLog log={runLog} running={running} onClose={() => setShowLog(false)} />
            )}
          </div>
        </div>

        {/* Right panel: node config */}
        {selNode && (
          <NodeConfig
            node={selNode}
            accent={accent}
            onPatch={patch => patchNode(selNode.id, patch)}
            onDelete={() => delNode(selNode.id)}
            onClose={() => setSelId(null)}
          />
        )}
      </div>
    </div>
  )
}
