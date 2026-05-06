import { ReviewDetailPage } from "@/components/pages/review-detail-page";

export default async function ReviewDetailRoute({ params }) {
  const { id } = await params;
  return <ReviewDetailPage reviewId={id} />;
}
