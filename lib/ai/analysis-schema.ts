import "server-only";

import { z } from "zod";

export const articleAnalysisOutputSchema = z.object({
  summary: z
    .string()
    .min(80)
    .max(1_600)
    .describe(
      "A concise, neutral, fact-focused summary using only claims supported by the article.",
    ),
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe("The article tone from -1 negative to 1 positive."),
  sentimentLabel: z
    .enum(["positive", "neutral", "negative"])
    .describe("The sentiment label matching sentimentScore."),
  politicalFramingLabel: z
    .enum(["left", "center", "right", "mixed", "unclear"])
    .describe(
      "An AI-estimated political framing label based only on the article text.",
    ),
  leftPercentage: z.number().int().min(0).max(100),
  centerPercentage: z.number().int().min(0).max(100),
  rightPercentage: z.number().int().min(0).max(100),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence in the political framing estimate."),
  framingNotes: z
    .string()
    .min(40)
    .max(2_000)
    .describe(
      "Concrete textual framing evidence and uncertainty, without inferring from the publisher.",
    ),
  loadedTerms: z
    .array(z.string().min(2).max(80))
    .max(12)
    .describe("Loaded terms that appear verbatim in the article text."),
});

export type ArticleAnalysisOutput = z.infer<
  typeof articleAnalysisOutputSchema
>;

export type AnalysisValidationResult =
  | { ok: true; value: ArticleAnalysisOutput }
  | { ok: false; reason: string };

const SENTIMENT_THRESHOLD = 0.15;
const DECISIVE_FRAMING_MARGIN = 10;

function expectedSentimentLabel(score: number) {
  if (score > SENTIMENT_THRESHOLD) return "positive" as const;
  if (score < -SENTIMENT_THRESHOLD) return "negative" as const;
  return "neutral" as const;
}

export function validateAnalysisInvariants(
  output: ArticleAnalysisOutput,
  articleText: string,
): AnalysisValidationResult {
  if (
    output.leftPercentage +
      output.centerPercentage +
      output.rightPercentage !==
    100
  ) {
    return { ok: false, reason: "percentages_do_not_total_100" };
  }

  if (output.sentimentLabel !== expectedSentimentLabel(output.sentimentScore)) {
    return { ok: false, reason: "sentiment_label_score_mismatch" };
  }

  const percentages = [
    ["left", output.leftPercentage],
    ["center", output.centerPercentage],
    ["right", output.rightPercentage],
  ] as const;
  const ranked = [...percentages].sort((a, b) => b[1] - a[1]);
  const strongest = ranked[0];
  const margin = strongest[1] - ranked[1][1];
  const decisive = output.confidence >= 0.5 && margin >= DECISIVE_FRAMING_MARGIN;

  if (
    decisive &&
    ["left", "center", "right"].includes(output.politicalFramingLabel) &&
    output.politicalFramingLabel !== strongest[0]
  ) {
    return { ok: false, reason: "framing_label_percentage_mismatch" };
  }
  if (
    decisive &&
    margin >= 20 &&
    output.confidence >= 0.65 &&
    ["mixed", "unclear"].includes(output.politicalFramingLabel)
  ) {
    return { ok: false, reason: "framing_label_unjustifiably_ambiguous" };
  }
  if (
    output.politicalFramingLabel === "unclear" &&
    output.confidence > 0.6
  ) {
    return { ok: false, reason: "unclear_with_high_confidence" };
  }

  const normalizedArticle = articleText.toLocaleLowerCase();
  const uniqueLoadedTerms = new Set<string>();
  for (const term of output.loadedTerms) {
    const normalized = term.trim().toLocaleLowerCase();
    if (!normalizedArticle.includes(normalized)) {
      return { ok: false, reason: "loaded_term_not_grounded" };
    }
    uniqueLoadedTerms.add(term.trim());
  }

  return {
    ok: true,
    value: {
      ...output,
      loadedTerms: [...uniqueLoadedTerms],
    },
  };
}

