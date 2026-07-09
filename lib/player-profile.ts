import type { StoredReview } from "@/lib/review-store";

export type PlayerProfile = {
  overallGrade: string;
  averageConfidence: number;
  handsReviewed: number;
  biggestLeak: string;
  strongestSkill: string;
  recentGrades: Array<{
    reviewId: string;
    grade: string;
    title: string;
    createdAt: string;
  }>;
  coachRecommendation: string;
  hasReliableTrends: boolean;
};

const gradeScores: Record<string, number> = {
  "A+": 4.3,
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  "D+": 1.3,
  D: 1,
  "D-": 0.7,
};

export function buildPlayerProfile(reviews: StoredReview[]): PlayerProfile {
  const sortedReviews = [...reviews].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const handsReviewed = sortedReviews.length;
  const averageConfidence = average(
    sortedReviews.map((review) => review.report.confidence).filter(isNumber),
  );
  const biggestLeak = mostFrequent(
    sortedReviews.map((review) => review.report.leak).filter(Boolean),
    "Not enough reviews yet",
  );
  const strongestSkill = getStrongestSkill(sortedReviews);

  return {
    overallGrade: averageGrade(sortedReviews),
    averageConfidence: Math.round(averageConfidence),
    handsReviewed,
    biggestLeak,
    strongestSkill,
    recentGrades: sortedReviews.slice(0, 10).map((review) => ({
      reviewId: review.reviewId,
      grade: review.report.grade,
      title: review.title ?? "Poker Hand Review",
      createdAt: review.createdAt,
    })),
    coachRecommendation: getCoachRecommendation(sortedReviews, biggestLeak),
    hasReliableTrends: handsReviewed >= 5,
  };
}

function getStrongestSkill(reviews: StoredReview[]) {
  if (reviews.length < 2) {
    return "Decision review discipline";
  }

  const bestReview = [...reviews]
    .filter((review) => gradeScore(review.report.grade) !== undefined)
    .sort((left, right) => {
      const gradeDiff = (gradeScore(right.report.grade) ?? 0) - (gradeScore(left.report.grade) ?? 0);

      if (gradeDiff !== 0) {
        return gradeDiff;
      }

      return right.report.confidence - left.report.confidence;
    })[0];

  if (!bestReview) {
    return "Decision review discipline";
  }

  return skillFromReview(bestReview);
}

function skillFromReview(review: StoredReview) {
  const text = [
    review.report.keyLesson,
    review.report.biggestMistake,
    review.report.betterDecision,
    review.report.leak,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("river")) {
    return "River decision awareness";
  }

  if (text.includes("turn")) {
    return "Turn planning";
  }

  if (text.includes("flop") || text.includes("c-bet") || text.includes("cbet")) {
    return "Flop strategy";
  }

  if (text.includes("3-bet") || text.includes("preflop")) {
    return "Preflop structure";
  }

  if (text.includes("value")) {
    return "Value betting discipline";
  }

  return "Decision review discipline";
}

function getCoachRecommendation(reviews: StoredReview[], biggestLeak: string) {
  if (reviews.length === 0) {
    return "Start with one meaningful hand. Kevixo will build your profile as your reviews grow.";
  }

  if (reviews.length < 5) {
    return "Review a few more hands before trusting long-term patterns. For now, focus on one clear lesson after each session.";
  }

  return `Your next best step is to collect three more hands around ${biggestLeak.toLowerCase()} and compare the better decision before results bias kicks in.`;
}

function averageGrade(reviews: StoredReview[]) {
  const scores = reviews.map((review) => gradeScore(review.report.grade)).filter(isNumber);

  if (scores.length === 0) {
    return "N/A";
  }

  const score = average(scores);

  if (score >= 3.85) {
    return "A";
  }

  if (score >= 3.5) {
    return "A-";
  }

  if (score >= 3.15) {
    return "B+";
  }

  if (score >= 2.85) {
    return "B";
  }

  if (score >= 2.5) {
    return "B-";
  }

  if (score >= 2.15) {
    return "C+";
  }

  if (score >= 1.85) {
    return "C";
  }

  return "D";
}

function gradeScore(grade: string) {
  return gradeScores[grade.trim().toUpperCase()];
}

function mostFrequent(values: string[], fallback: string) {
  if (values.length === 0) {
    return fallback;
  }

  const counts = new Map<string, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0][0];
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
