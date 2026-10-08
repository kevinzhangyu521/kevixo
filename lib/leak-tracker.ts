export type LeakEvidence = {
  reviewId: string;
  createdAt: string;
  title: string;
  source: "hand_history" | "demo" | null;
  decisionTheme: DecisionTheme | null;
};

export type DecisionTheme = "river_overcalling" | "thin_river_value" | "turn_bet_sizing" | "preflop_calling";

const themeDetails: Record<DecisionTheme, { name: string; explanation: string; checkNext: string }> = {
  river_overcalling: { name: "River bluff-catching", explanation: "Several reviewed hands flagged a river call that needed a clearer value-versus-bluff check.", checkNext: "Before calling a large river bet, name the value hands you beat and the missed draws that can bluff." },
  thin_river_value: { name: "Thin river value", explanation: "Several reviewed hands flagged a missed opportunity to target worse bluff-catchers on the river.", checkNext: "Before checking back, list the worse hands that can comfortably call a smaller value bet." },
  turn_bet_sizing: { name: "Turn bet sizing", explanation: "Several reviewed hands flagged a turn size that did not clearly match the range or plan.", checkNext: "Choose a turn size only after deciding which worse hands fold, call, or continue to the river." },
  preflop_calling: { name: "Preflop calling discipline", explanation: "Several reviewed hands flagged a preflop call that needed a clearer positional or range reason.", checkNext: "Before calling preflop, check position, stack depth, and whether the hand belongs in your continuing range." },
};

export function classifyDecisionTheme(leak: string | undefined): DecisionTheme | null {
  const normalized = leak?.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "river overcalling") return "river_overcalling";
  if (normalized === "missed thin value") return "thin_river_value";
  if (normalized === "turn sizing") return "turn_bet_sizing";
  if (normalized === "preflop calling") return "preflop_calling";
  return null;
}

export function buildLeakTracker(reviews: LeakEvidence[]) {
  const eligible = reviews.filter((review) => review.source === "hand_history");
  const patterns = (Object.keys(themeDetails) as DecisionTheme[]).flatMap((theme) => {
    const supportingReviews = eligible.filter((review) => review.decisionTheme === theme);
    const dates = new Set(supportingReviews.map((review) => review.createdAt.slice(0, 10)));
    if (eligible.length < 5 || supportingReviews.length < 3 || dates.size < 2) return [];
    return [{ theme, ...themeDetails[theme], supportingReviews: [...supportingReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), lastSeen: [...supportingReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!.createdAt }];
  });
  return { eligibleReviewCount: eligible.length, patterns };
}
