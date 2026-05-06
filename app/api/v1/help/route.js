import { json } from "@/lib/api/http";

export async function GET() {
  return json({
    faq: [
      {
        question: "How do I review an assignment?",
        answer: "Upload a supported file on the dashboard, confirm the extracted preview, then run the review.",
      },
      {
        question: "Which files are supported?",
        answer: "PDF, DOCX, TXT, and PPTX files are supported for assignment upload.",
      },
      {
        question: "Can AI detection prove authorship?",
        answer: "No. AI detection is probabilistic and should be used only as one review signal.",
      },
    ],
    contact: {
      email: "support@smartreview.ai",
      availability: "Available 24/7",
    },
  });
}
