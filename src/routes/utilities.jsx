import { createFileRoute } from '@tanstack/react-router'
import { FileUtilitiesPage } from '@/components/tools/file-utilities-page'

export const Route = createFileRoute('/utilities')({
  component: FileUtilitiesPage,
})
