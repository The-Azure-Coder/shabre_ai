import { createFileRoute } from '@tanstack/react-router'
import { ResourceListPage } from '@/components/pages/resource-list-pages'

export const Route = createFileRoute('/reviews/')({
  component: ReviewsPage,
})

function ReviewsPage() {
  return <ResourceListPage type="reviews" />
}
