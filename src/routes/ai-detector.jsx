import { createFileRoute } from '@tanstack/react-router'
import { AiDetectorToolPage } from '@/components/tools/specialized-tool-pages'

export const Route = createFileRoute('/ai-detector')({
  component: AiDetectorToolPage,
})
