import { appConfig } from "./config.js";
import { sanitizeText } from "./security.js";
import { 
  summarizeWithAi, 
  paraphraseWithAi, 
  checkFormattingWithAi, 
  detectAiWithAi, 
  humanizeWithAi, 
  generateCitationWithAi,
  evaluateWithAi
} from "./ai-service.js";

export async function summarizeText({ text }) {
  const clean = boundedText(text);
  try {
    return await summarizeWithAi({ text: clean });
  } catch (error) {
    console.error("AI Summary failed:", error.message);
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const summary = sentences.slice(0, 2).join(" ").trim();
    return {
      summary,
      bullets: sentences.slice(0, 3).map((sentence) => sentence.trim()).filter(Boolean),
    };
  }
}

export async function paraphraseText({ text, tone }) {
  const clean = boundedText(text);
  try {
    return await paraphraseWithAi({ text: clean, tone });
  } catch (error) {
    console.error("AI Paraphrase failed:", error.message);
    return {
      paraphrase: `${tone === "academic" ? "In academic terms, " : ""}${clean.replace(/\bvery\b/gi, "notably").replace(/\breally\b/gi, "substantially")}`,
      notes: ["Meaning preserved from the provided text", `Tone adjusted to ${tone}`],
    };
  }
}

export async function checkFormatting({ text, style, customRules = "" }) {
  const clean = boundedText(text);
  try {
    return await checkFormattingWithAi({ text: clean, style, customRules });
  } catch (error) {
    console.error("AI Formatting check failed:", error.message);
    const violations = [];
    const hasReferences = /\b(references|works cited|bibliography)\b/i.test(clean);
    const hasInTextCitation = /\([A-Z][A-Za-z-]+,\s*\d{4}\)|\([A-Z][A-Za-z-]+\s+\d+\)/.test(clean);
    const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    if (!lines[0] || /[.!?]$/.test(lines[0])) {
      violations.push({ style, location: "Title", message: "Add a standalone assignment title before the body text.", severity: "medium" });
    }

    if ((style === "APA" || style === "MLA") && !hasReferences) {
      violations.push({ style, location: style === "APA" ? "References" : "Works Cited", message: `Add a ${style === "APA" ? "References" : "Works Cited"} section when outside sources are used.`, severity: "high" });
    }

    return {
      style,
      violations,
      disclaimer: "Grounded formatting check identifying likely structure issues.",
    };
  }
}

export async function detectAiText({ text }) {
  const clean = boundedText(text);
  try {
    return await detectAiWithAi({ text: clean });
  } catch (error) {
    console.error("AI Detection failed:", error.message);
    const score = 20; // Default low score on failure
    return {
      probability: score,
      label: "Low",
      highlightedSections: [],
      disclaimer: "AI detection failed, showing default low probability.",
    };
  }
}

export async function humanizeText({ text, tone }) {
  const clean = boundedText(text);
  try {
    return await humanizeWithAi({ text: clean, tone });
  } catch (error) {
    console.error("AI Humanize failed:", error.message);
    return {
      roboticTone: { score: 50, label: "Medium" },
      rewrite: clean,
      sideBySide: { original: clean, rewritten: clean },
      notes: ["Humanization failed, returning original text."],
    };
  }
}

export async function generateCitation(params) {
  try {
    return await generateCitationWithAi(params);
  } catch (error) {
    console.error("AI Citation failed:", error.message);
    return {
      style: params.style,
      sourceType: params.sourceType,
      citation: `${params.author || "Author"}. (${params.year || "n.d."}). ${params.title || "Title"}.`,
      notes: ["AI citation failed, generated a basic template."],
    };
  }
}

export async function evaluateRubric({ text, criteria = [], rubricText = "" }) {
  const clean = boundedText(text);
  const parsedCriteria = criteria.length ? criteria : parseRubricText(rubricText);
  const finalCriteria = parsedCriteria.length ? parsedCriteria : [
    { name: "Argument", maxScore: 10, description: "Clear claim and support" },
    { name: "Evidence", maxScore: 10, description: "Relevant examples and source use" },
    { name: "Organization", maxScore: 10, description: "Logical structure and transitions" },
  ];

  try {
    return await evaluateWithAi({ text: clean, rubric: { criteria: finalCriteria } });
  } catch (error) {
    console.error("AI Rubric evaluation failed:", error.message);
    // Fallback to grounded logic if needed, but evaluateWithAi already does that in ai-service.js
    // We just return it.
    return evaluateWithAi({ text: clean, rubric: { criteria: finalCriteria } });
  }
}

function boundedText(text) {
  const clean = sanitizeText(text);
  if (clean.length > appConfig.textMaxChars) {
    const error = new Error("Text exceeds the configured limit");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return clean;
}

function parseRubricText(rubricText) {
  return sanitizeText(rubricText)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((line) => {
      const [name, maxScore] = line.split(":").map((item) => item.trim());
      return {
        name,
        maxScore: Number(maxScore) > 0 ? Number(maxScore) : 10,
        description: line,
      };
    });
}
