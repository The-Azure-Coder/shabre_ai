import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8),
  name: z.string().min(2).max(80),
});

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const reviewSchema = z.object({
  documentId: z.string().min(8),
  style: z.enum(["APA", "MLA", "Custom"]).default("APA"),
  rubric: z
    .object({
      criteria: z
        .array(
          z.object({
            name: z.string().min(1),
            maxScore: z.number().min(1).max(100),
            description: z.string().optional(),
          }),
        )
        .default([]),
    })
    .optional(),
});

export const summarizeSchema = z.object({
  text: z.string().min(1),
  mode: z.enum(["short", "standard"]).default("short"),
});

export const paraphraseSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(["academic", "clear", "natural"]).default("academic"),
  preserveMeaning: z.boolean().default(true),
});

export const formattingSchema = z.object({
  text: z.string().min(1),
  style: z.enum(["APA", "MLA", "Custom"]),
  customRules: z.string().max(2000).optional(),
});

export const aiDetectionSchema = z.object({
  text: z.string().min(40),
});

export const humanizeSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(["natural", "academic", "clear"]).default("natural"),
});

export const citationSchema = z.object({
  sourceType: z.enum(["book", "article", "website"]).default("website"),
  style: z.enum(["APA", "MLA"]).default("APA"),
  title: z.string().default(""),
  author: z.string().default(""),
  year: z.string().default(""),
  publisher: z.string().max(120).optional(),
  url: z.string().url().optional().or(z.literal("")),
}).superRefine((value, ctx) => {
  const hasUrl = Boolean(value.url?.trim());
  const hasManualCore = Boolean(value.title.trim() && value.author.trim() && value.year.trim());

  if (!hasUrl && !hasManualCore) {
    if (!value.title.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["title"], message: "Title is required when no URL is provided." });
    }
    if (!value.author.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["author"], message: "Author is required when no URL is provided." });
    }
    if (!value.year.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["year"], message: "Year is required when no URL is provided." });
    }
  }
});

export const rubricEvaluationSchema = z.object({
  text: z.string().min(1),
  rubricText: z.string().optional(),
  criteria: z
    .array(
      z.object({
        name: z.string().min(1),
        maxScore: z.number().min(1).max(100),
        description: z.string().optional(),
      }),
    )
    .default([]),
});

export const reviewResultSchema = z.object({
  reviewId: z.string(),
  documentId: z.string(),
  status: z.literal("completed"),
  summary: z.string(),
  scores: z.array(
    z.object({
      criterion: z.string(),
      score: z.number(),
      maxScore: z.number(),
      explanation: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
  checklist: z.array(
    z.object({
      item: z.string(),
      completed: z.boolean().default(false),
    }),
  ),
  suggestions: z.array(
    z.object({
      type: z.enum(["grammar", "clarity", "logic"]),
      severity: z.enum(["low", "medium", "high"]),
      location: z.object({ paragraph: z.number() }),
      original: z.string(),
      suggestion: z.string(),
      reason: z.string(),
    }),
  ),
  formattingViolations: z.array(
    z.object({
      style: z.enum(["APA", "MLA", "Custom"]),
      severity: z.enum(["low", "medium", "high"]),
      location: z.string(),
      message: z.string(),
    }),
  ),
  disclaimer: z.string(),
});
