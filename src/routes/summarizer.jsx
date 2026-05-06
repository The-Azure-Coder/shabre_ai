import { createFileRoute } from '@tanstack/react-router'
import { TextToolPage } from '@/components/tools/text-tool-page'

export const Route = createFileRoute('/summarizer')({
  component: () => (
    <TextToolPage
      title="Summarizer"
      description="Summarize assignment notes or draft sections using the protected utility API."
      endpoint="/api/v1/tools/summarize"
      mode="summarize"
    />
  ),
})
