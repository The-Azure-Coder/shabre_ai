import { createFileRoute } from '@tanstack/react-router'
import { HelpClientPage } from '@/components/pages/help-page'

export const Route = createFileRoute('/help')({
  component: HelpClientPage,
})
