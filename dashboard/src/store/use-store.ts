'use client'

import { create } from 'zustand'
import { CLIENTS, TASKS, OBJECTIVES, ACTIVITY } from '@/lib/data'
import type { Client, Task, Objective, ActivityFeedItem } from '@/types'

interface UIState {
  cmdOpen: boolean
  quickOpen: boolean
  leadOpen: boolean
  clientOpen: boolean
  taskCompose: Partial<Task> | null
  aiOpen: boolean
  sidebarCollapsed: boolean
  setCmdOpen: (v: boolean) => void
  setQuickOpen: (v: boolean) => void
  setLeadOpen: (v: boolean) => void
  setClientOpen: (v: boolean) => void
  setTaskCompose: (t: Partial<Task> | null) => void
  setAiOpen: (v: boolean) => void
  setSidebarCollapsed: (v: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  cmdOpen: false,
  quickOpen: false,
  leadOpen: false,
  clientOpen: false,
  taskCompose: null,
  aiOpen: false,
  sidebarCollapsed: false,
  setCmdOpen: (v) => set({ cmdOpen: v }),
  setQuickOpen: (v) => set({ quickOpen: v }),
  setLeadOpen: (v) => set({ leadOpen: v }),
  setClientOpen: (v) => set({ clientOpen: v }),
  setTaskCompose: (t) => set({ taskCompose: t }),
  setAiOpen: (v) => set({ aiOpen: v }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
}))

interface DataState {
  tasks: Task[]
  objectives: Objective[]
  activity: ActivityFeedItem[]
  addTask: (t: Partial<Task>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
}

export const useData = create<DataState>((set) => ({
  tasks: [...TASKS],
  objectives: [...OBJECTIVES],
  activity: [...ACTIVITY],
  addTask: (t) => set((s) => ({
    tasks: [...s.tasks, {
      id: 't' + Date.now(),
      title: t.title || '',
      description: t.description ?? null,
      status: t.status || 'todo',
      priority: t.priority || 'P2',
      category: t.category || 'Internal',
      client_id: t.client_id ?? null,
      assignee: t.assignee ?? null,
      due_date: t.due_date ?? null,
      objective_id: t.objective_id ?? null,
      archived: false,
      created_at: new Date().toISOString(),
    }],
  })),
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t),
  })),
  toggleTask: (id) => set((s) => ({
    tasks: s.tasks.map(t => t.id === id
      ? { ...t, status: t.status === 'done' ? 'todo' : 'done' }
      : t),
  })),
  removeTask: (id) => set((s) => ({
    tasks: s.tasks.filter(t => t.id !== id),
  })),
}))
