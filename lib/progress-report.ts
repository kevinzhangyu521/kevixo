import type { StoredReview } from "@/lib/review-store";

export type WeeklyProgressReport = {
  reviewsThisWeek: number;
  averageGradeTrend: string;
  confidenceTrend: string;
  biggestImprovement: string;
  biggestLeak: string;
  coachSummary: string;
  focusForNextWeek: string;
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
  D: 1,
};

export function buildWeeklyProgressReport(reviews: StoredReview[], now = new Date()): WeeklyProgressReport {
  const sortedReviews = [...reviews].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  const weekStart = startOfWeek(now);
  const reviewsThisWeek = sortedReviews.filter((review) => new Date(review.createdAt) >= weekStart);
  const recentReviews = sortedReviews.slice(0, 5);
  const previousReviews = sortedReviews.slice(5, 10);
  const biggestLeak = mostFrequent(
    recentReviews.map((review) => review.report.leak).filter(Boolean),
    "Not enough reviews yet",
  );
  const biggestImprovement = getBiggestImprovement(recentReviews, previousReviews);
  const hasReliableTrends = sortedReviews.length >= 5;

  return {
    reviewsThisWeek: reviewsThisWeek.length,
    averageGradeTrend: describeGradeTrend(recentReviews, previousReviews),
    confidenceTrend: describeConfidenceTrend(recentReviews, previousReviews),
    biggestImprovement,
    biggestLeak,
    coachSummary: getCoachSummary(sortedReviews, biggestLeak, biggestImprovement),
    focusForNextWeek: getFocusForNextWeek(sortedReviews, biggestLeak),
    hasReliableTrends,
  };
}

function describeGradeTrend(recentReviews: StoredReview[], previousReviews: StoredReview[]) {
  const recent = average(recentReviews.map((review) => gradeScore(review.report.grade)).filter(isNumber));
  const previous = average(previousReviews.map((review) => gradeScore(review.report.grade)).filter(isNumber));

  if (!recent) {
    return "No grade trend yet";
  }

  if (!previous) {
    return `${scoreToGrade(recent)} current average`;
  }

  const diff = recent - previous;

  if (Math.abs(diff) < 0.15) {
    return `${scoreToGrade(recent)} and steady`;
  }

  return diff > 0
    ? `Up from ${scoreToGrade(previous)} to ${scoreToGrade(recent)}`
    : `Down from ${scoreToGrade(previous)} to ${scoreToGrade(recent)}`;
}

function describeConfidenceTrend(recentReviews: StoredReview[], previousReviews: StoredReview[]) {
  const recent = average(recentReviews.map((review) => review.report.confidence).filter(isNumber));
  const previous = average(previousReviews.map((review) => review.report.confidence).filter(isNumber));

  if (!recent) {
    return "No confidence trend yet";
  }

  if (!previous) {
    return `${Math.round(recent)}% current average`;
  }

  const diff = Math.round(recent - previous);

  if (Math.abs(diff) < 3) {
    return `${Math.round(recent)}% and steady`;
  }

  return diff > 0
    ? `Up ${diff} points to ${Math.round(recent)}%`
    : `Down ${Math.abs(diff)} points to ${Math.round(recent)}%`;
}

function getBiggestImprovement(recentReviews: StoredReview[], previousReviews: StoredReview[]) {
  if (recentReviews.length === 0) {
    return "No improvement signal yet";
  }

  const recentSkills = skillCounts(recentReviews);
  const previousSkills = skillCounts(previousReviews);
  const bestSkill = [...recentSkills.entries()].sort((left, right) => {
    const leftGain = left[1] - (previousSkills.get(left[0]) ?? 0);
    const rightGain = right[1] - (previousSkills.get(right[0]) ?? 0);
    return rightGain - leftGain || right[1] - left[1];
  })[0]?.[0];

  return bestSkill ?? "Decision review discipline";
}

function getCoachSummary(reviews: StoredReview[], biggestLeak: string, biggestImprovement: string) {
  if (reviews.length === 0) {
    return "Start by reviewing one meaningful hand. Kevixo will turn each review into a clearer weekly picture.";
  }

  if (reviews.length < 5) {
    return "You are building the habit. Review a few more hands before treating the trends as reliable.";
  }

  return `Your recent work shows progress in ${biggestImprovement.toLowerCase()}, while ${biggestLeak.toLowerCase()} is still the pattern to watch. Keep reviewing hands while the decision is fresh.`;
}

function getFocusForNextWeek(reviews: StoredReview[], biggestLeak: string) {
  if (reviews.length < 5) {
    return "Review at least 5 hands so Kevixo can separate one-off spots from real habits.";
  }

  return `Tag three hands involving ${biggestLeak.toLowerCase()} and write the better decision before checking the result.`;
}

function skillCounts(reviews: StoredReview[]) {
  const counts = new Map<string, number>();

  reviews.forEach((review) => {
    const skill = skillFromReview(review);
    counts.set(skill, (counts.get(skill) ?? 0) + 1);
  });

  return counts;
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
    return "River decisions";
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
    return "Value betting";
  }

  return "Decision review discipline";
}

function scoreToGrade(score: number) {
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

function startOfWeek(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}
