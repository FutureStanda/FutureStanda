'use client'

import React, { useEffect } from 'react'
import { TopBar } from '@/components/layout/TopBar'
import { useUI } from '@/store/use-store'
import { CommandPalette } from '@/components/overlays/CommandPalette'
import { QuickAdd } from '@/components/overlays/QuickAdd'
import { AIPanel } from '@/components/overlays/AIPanel'
import { TaskComposer } from '@/components/overlays/TaskComposer'
import { LeadIntake } from '@/components/overlays/LeadIntake'
import { ClientOnboarding } from '@/components/overlays/ClientOnboarding'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const {
    cmdOpen, setCmdOpen,
    quickOpen, setQuickOpen,
    leadOpen, setLeadOpen,
    clientOpen, setClientOpen,
    taskCompose, setTaskCompose,
    aiOpen, setAiOpen,
  } = useUI()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      } else if (e.key === 'Escape') {
        setCmdOpen(false)
        setQuickOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCmdOpen, setQuickOpen])

  return (
    <>
      {children}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} onNewLead={() => { setCmdOpen(false); setLeadOpen(true) }} onNewTask={() => { setCmdOpen(false); setTaskCompose({}) }} />
      <QuickAdd open={quickOpen} onClose={() => setQuickOpen(false)} onNewLead={() => { setQuickOpen(false); setLeadOpen(true) }} onNewTask={() => { setQuickOpen(false); setTaskCompose({}) }} />
      <LeadIntake open={leadOpen} onClose={() => setLeadOpen(false)} />
      <ClientOnboarding open={clientOpen} onClose={() => setClientOpen(false)} />
      <TaskComposer open={!!taskCompose} initial={taskCompose || {}} onClose={() => setTaskCompose(null)} />
      {aiOpen && <AIPanel onClose={() => setAiOpen(false)} />}
    </>
  )
}
