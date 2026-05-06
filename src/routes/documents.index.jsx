import { createFileRoute } from '@tanstack/react-router'
import { ResourceListPage } from '@/components/pages/resource-list-pages'

export const Route = createFileRoute('/documents/')({
  component: DocumentsPage,
})

function DocumentsPage() {
  return <ResourceListPage type="documents" />
}
