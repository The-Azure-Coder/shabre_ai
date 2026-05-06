import { createFileRoute } from '@tanstack/react-router'
import { SettingsClientPage } from '@/components/pages/settings-page'

export const Route = createFileRoute('/settings')({
  component: SettingsClientPage,
})
