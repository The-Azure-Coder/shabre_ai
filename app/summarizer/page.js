import { TextToolPage } from "@/components/tools/text-tool-page";

export default function SummarizerPage() {
  return (
    <TextToolPage
      title="Summarizer"
      description="Summarize assignment notes or draft sections using the protected utility API."
      endpoint="/api/v1/tools/summarize"
      mode="summarize"
    />
  );
}
