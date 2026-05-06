import { createFileRoute } from '@tanstack/react-router'
import { ReviewWorkspace } from '@/components/pages/review-workspace'

export const Route = createFileRoute('/reviews/workspace')({
  component: ReviewWorkspace,
})
