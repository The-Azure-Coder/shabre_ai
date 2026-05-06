import { createFileRoute } from '@tanstack/react-router'
import { FormattingCheckerPage } from '@/components/pages/formatting-checker-page'

export const Route = createFileRoute('/formatting')({
  component: FormattingCheckerPage,
})
