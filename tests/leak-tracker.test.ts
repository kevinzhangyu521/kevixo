import { buildLeakTracker, type DecisionTheme } from "../lib/leak-tracker";

function assert(value: unknown, message: string) { if (!value) throw new Error(message); }

const base = { source: "hand_history" as const, decisionTheme: "river_overcalling" as DecisionTheme, reviewId: "r", createdAt: "2026-10-01T12:00:00.000Z", title: "Hand" };

function testRequiresFullEvidenceThreshold() {
  const insufficient = buildLeakTracker(Array.from({ length: 4 }, (_, index) => ({ ...base, reviewId: `r${index}` })));
  assert(insufficient.eligibleReviewCount === 4, "Expected eligible review count.");
  assert(insufficient.patterns.length === 0, "Expected no pattern below five reviews.");
}

function testRequiresThreeThemesAcrossTwoDates() {
  const sameDay = buildLeakTracker(Array.from({ length: 5 }, (_, index) => ({ ...base, reviewId: `r${index}` })));
  assert(sameDay.patterns.length === 0, "Expected one-date evidence to be excluded.");
  const qualified = buildLeakTracker([
    { ...base, reviewId: "a", createdAt: "2026-10-01T12:00:00.000Z" },
    { ...base, reviewId: "b", createdAt: "2026-10-02T12:00:00.000Z" },
    { ...base, reviewId: "c", createdAt: "2026-10-03T12:00:00.000Z" },
    { ...base, reviewId: "d", decisionTheme: null },
    { ...base, reviewId: "e", decisionTheme: null },
  ]);
  assert(qualified.patterns.length === 1, "Expected one qualified repeated theme.");
  assert(qualified.patterns[0]?.supportingReviews.length === 3, "Expected each review to count once.");
}

testRequiresFullEvidenceThreshold();
testRequiresThreeThemesAcrossTwoDates();
console.log("leak tracker tests passed");
