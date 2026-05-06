import { createFileRoute } from '@tanstack/react-router'
import { CitationGeneratorPage } from '@/components/pages/citation-generator-page'

export const Route = createFileRoute('/citations')({
  component: CitationGeneratorPage,
})
