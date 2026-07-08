export function looksLikeHandHistory(handHistory: string) {
  const text = handHistory.toLowerCase();
  const hasCards = /\[[2-9tjqka][cdhs]\s+[2-9tjqka][cdhs]\]/i.test(handHistory);
  const hasPokerSite =
    text.includes("pokerstars") || text.includes("ggpoker") || text.includes("hold'em");
  const hasAction = ["raises", "calls", "bets", "checks", "folds"].some((word) =>
    text.includes(word),
  );
  const hasStreet = ["flop", "turn", "river"].some((word) => text.includes(word));

  return handHistory.trim().length >= 120 && hasCards && hasPokerSite && hasAction && hasStreet;
}
