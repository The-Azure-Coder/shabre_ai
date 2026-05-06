import { createFileRoute } from '@tanstack/react-router'
import { ReviewDetailPage } from '@/components/pages/review-detail-page'

export const Route = createFileRoute('/reviews/$id')({
  component: ReviewDetailRoute,
})

function ReviewDetailRoute() {
  const { id } = Route.useParams()
  return <ReviewDetailPage reviewId={id} />
}
