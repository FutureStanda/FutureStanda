// ─── BizBoost Command Centre — TypeScript types ──────────────────────────────

export interface Client {
  id: string                    // e.g. 'murphy-plumbing'
  name: string
  handle: string | null
  city: string | null
  niche: string | null
  plan: 'Domination' | 'Growth' | 'Starter' | string
  mrr: number
  since: string | null
  onboarded: number             // days onboarded
  health: number                // 0–100
  owner: string | null
  avatar: string | null         // single letter or URL
  color: string                 // hex colour for accent
  leads30: number
  leads_delta: number           // fractional e.g. 0.32 = +32%
  bookings30: number
  bookings_delta: number
  revenue30: number
  revenue_delta: number
  roas: number
  missed_calls: number
  reviews_count: number
  reviews_rating: number
  reviews_new30: number
  ad_spend: number
  website_visits30: number
  website_visits_delta: number
  website_conv: number          // conversion % as decimal
  followers_ig: number
  followers_fb: number
  followers_tt: number
  pending_tasks: number
  last_touch: string | null
  next_due: string | null
  flag: string | null
  services: string[]
  sparkline: number[]
  connected: string[]           // integration provider ids
  memory: ClientMemory
  onboarding_active: boolean
  onboarding_done: string[]
  onboarding_started: string | null
  created_at: string
}

export interface ClientMemory {
  why?: string         // founder story / positioning
  ideal?: string       // ideal customer profile
  vibe?: string        // brand tone
  competitor?: string  // main competitor name
  [key: string]: string | undefined
}

export interface Lead {
  id: string
  business_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  meeting_time: string | null
  booking_link: string | null
  niche: string | null
  area: string | null
  current_process: string | null
  google_url: string | null
  social_urls: string | null
  services: string | null
  dream_client: string | null
  blockers: string | null
  scale_priority: number        // 1–10
  what_changes: string | null
  why_now: string | null
  status:
    | 'New lead'
    | 'Contacted'
    | 'Meeting booked'
    | 'Proposal sent'
    | 'Closed'
    | 'Lost'
    | string
  telegram_status: 'pending' | 'sent' | 'replied' | string
  intro_sent: boolean
  research_status: 'pending' | 'in_progress' | 'done' | string
  research_data: Record<string, unknown> | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'doing' | 'done' | string
  priority: 'P0' | 'P1' | 'P2' | 'P3' | string
  category: string
  client_id: string | null
  assignee: string | null
  due_date: string | null
  objective_id: string | null
  archived: boolean
  created_at: string
}

export interface KeyResult {
  kr: string
  measure: 'metric' | 'tasks' | 'manual' | string
  metric?: string
  progress?: number             // 0–1
  current?: string | number
  target?: string | number
  start_num?: number
  target_num?: number
  task_ids?: string[]
  checkpoints?: Checkpoint[]
}

export interface Checkpoint {
  at: string
  value: string
  note?: string
}

export interface Objective {
  id: string
  title: string
  owner: string | null
  current_value: number
  target_value: number
  progress: number              // 0–1
  progress_mode: 'krs' | 'manual' | 'tasks' | string
  key_results: KeyResult[]
  linked_tasks: string[]
  created_at: string
}

export type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'bullet'
  | 'numbered'
  | 'todo'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'code'
  | 'image'
  | 'table'

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean             // for todo blocks
  language?: string             // for code blocks
  children?: Block[]            // for toggle / nested
  meta?: Record<string, unknown>
}

export interface Page {
  id: string
  title: string
  parent_id: string | null
  content_blocks: Block[]
  theme: 'dark' | 'light' | string
  tags: string[]
  icon: string                  // emoji or icon name
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  title: string
  type:
    | 'Script'
    | 'Creative'
    | 'SOP'
    | 'Sequence'
    | 'Doc'
    | 'Templates'
    | 'Deck'
    | 'Playbook'
    | 'Brand'
    | string
  tag: string | null
  body: string | null
  created_at: string
}

export interface AutomationStep {
  id: string
  type: string
  config: Record<string, unknown>
}

export interface AutomationNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export interface AutomationEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface Automation {
  id: string
  name: string
  trigger_type: string | null
  trigger_source: string | null
  steps: AutomationStep[]
  nodes: AutomationNode[]
  edges: AutomationEdge[]
  is_enabled: boolean
  client_id: string | null
  run_count: number
  last_run: string | null
  created_at: string
}

export interface Agent {
  id: string
  name: string
  role: string | null
  type: 'ai' | 'person'
  tools: string[]
  capabilities: string | null
  status: 'idle' | 'running' | 'error' | string
  run_count: number
  avatar: string | null
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'client'
  client_id: string | null      // for client-role users
  avatar_url: string | null
  created_at: string
}

export interface ActivityFeedItem {
  id: string
  type:
    | 'lead'
    | 'booking'
    | 'review'
    | 'ad'
    | 'missed'
    | 'ai'
    | 'task'
    | 'note'
    | string
  client_id: string | null
  message: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Integration {
  id: string
  client_id: string
  provider: string
  is_connected: boolean
  connected_at: string | null
  created_at: string
}

export interface MarketingData {
  id: string
  client_id: string
  date: string
  leads: number
  spend: number
  revenue: number
  roas: number
  created_at: string
}

// ─── View / UI helpers ────────────────────────────────────────────────────────

export type SortDir = 'asc' | 'desc'

export type ClientSortKey =
  | 'name'
  | 'health'
  | 'mrr'
  | 'leads30'
  | 'revenue30'
  | 'roas'
  | 'pending_tasks'

export interface BriefingWin {
  t: string
  client: string | null
  metric: string
  why: string
  action: string
  actionKind: string
}

export interface BriefingRisk extends BriefingWin {
  urgent?: boolean
}

export interface BriefingToday {
  t: string
  client?: string
  metric: string
  why: string
  action: string
  actionKind: string
}

export interface Briefing {
  date: string
  headline: string
  wins: BriefingWin[]
  risks: BriefingRisk[]
  today: BriefingToday[]
}
