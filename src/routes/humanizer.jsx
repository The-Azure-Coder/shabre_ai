import { createFileRoute } from '@tanstack/react-router'
import { HumanizerToolPage } from '@/components/tools/specialized-tool-pages'

export const Route = createFileRoute('/humanizer')({
  component: HumanizerToolPage,
})
