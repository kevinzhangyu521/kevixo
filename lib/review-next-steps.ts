export type ReviewNextStepsSource = {
  report: {
    betterDecision?: unknown;
    homework?: unknown;
    keyLesson?: unknown;
    nextTimeChecklist?: unknown;
  };
  reviewCount: number;
  patternInsight?: string;
};

export type ReviewNextSteps = {
  nextDecision: string;
  nextCheck: string;
  practice: string;
  historyMessage: string;
};

export function buildReviewNextSteps({
  report,
  reviewCount,
  patternInsight,
}: ReviewNextStepsSource): ReviewNextSteps {
  const normalizedReviewCount = Math.max(0, reviewCount);
  const keyLesson = readableText(
    report.keyLesson,
    "Review the decision before checking the result.",
  );

  return {
    nextDecision: readableText(report.betterDecision, keyLesson),
    nextCheck: firstChecklistItem(report.nextTimeChecklist) ?? keyLesson,
    practice: readableText(
      report.homework,
      "Save one decision rule from this review and use it in your next similar spot.",
    ),
    historyMessage: buildHistoryMessage(normalizedReviewCount, patternInsight),
  };
}

function firstChecklistItem(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.find((item): item is string => typeof item === "string" && item.trim().length > 0) ?? null;
}

function readableText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function buildHistoryMessage(reviewCount: number, patternInsight?: string) {
  if (patternInsight) {
    return `A recurring decision theme in your saved reviews: ${patternInsight}`;
  }

  if (reviewCount <= 1) {
    return "This is your first saved review. Add two more hands before Kevixo looks for a repeat pattern.";
  }

  if (reviewCount === 2) {
    return "You have two saved reviews. Add one more hand before Kevixo looks for a repeat pattern.";
  }

  return "You have three saved reviews, but there is not enough consistent evidence to call a recurring decision theme yet.";
}
