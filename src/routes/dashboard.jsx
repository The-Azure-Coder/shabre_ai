import { createFileRoute } from '@tanstack/react-router'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Suspense } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading Dashboard...</div>}>
      <DashboardShell />
    </Suspense>
  )
}
