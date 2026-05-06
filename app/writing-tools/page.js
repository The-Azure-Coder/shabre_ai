import { TextToolPage } from "@/components/tools/text-tool-page";

export default function WritingToolsPage() {
  return (
    <TextToolPage
      title="Writing Tools"
      description="Paraphrase, fix grammar, or adjust tone using the protected utility API."
      endpoint="/api/v1/tools/paraphrase"
      mode="paraphrase"
    />
  );
}
