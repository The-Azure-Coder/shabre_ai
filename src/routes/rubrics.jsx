import { createFileRoute } from '@tanstack/react-router'
import { RubricToolPage } from '@/components/tools/specialized-tool-pages'

export const Route = createFileRoute('/rubrics')({
  component: RubricToolPage,
})
