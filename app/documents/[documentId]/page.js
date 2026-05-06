import { DocumentDetailPage } from "@/components/pages/document-detail-page";

export default async function DocumentDetailRoute({ params }) {
  const { documentId } = await params;
  return <DocumentDetailPage documentId={documentId} />;
}
