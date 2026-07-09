export type HandHistoryPlatform =
  | "PokerStars"
  | "GGPoker"
  | "WPT Global"
  | "ACR Poker"
  | "888Poker"
  | "Winamax"
  | "CoinPoker"
  | "Generic Unknown";

export type PlatformDetection = {
  platform: HandHistoryPlatform;
  confidence: number;
  markers: string[];
};

const platformMarkers: Array<{
  platform: Exclude<HandHistoryPlatform, "Generic Unknown">;
  markers: RegExp[];
}> = [
  {
    platform: "PokerStars",
    markers: [/PokerStars Hand #/i, /Table '.+' \d+-max/i, /\*\*\* HOLE CARDS \*\*\*/i],
  },
  {
    platform: "GGPoker",
    markers: [/GGPoker/i, /GGNetwork/i, /Rush & Cash/i, /Hand History for Game/i],
  },
  {
    platform: "WPT Global",
    markers: [/WPT Global/i, /WPTGlobal/i, /WPT\s+Hand/i],
  },
  {
    platform: "ACR Poker",
    markers: [/America'?s Cardroom/i, /Winning Poker Network/i, /\bACR\b/i],
  },
  {
    platform: "888Poker",
    markers: [/888Poker/i, /888poker/i, /Pacific Poker/i, /888 Hand History/i],
  },
  {
    platform: "Winamax",
    markers: [/Winamax/i, /HandId:/i, /Tournament ".*" buyIn/i],
  },
  {
    platform: "CoinPoker",
    markers: [/CoinPoker/i, /Coin Poker/i, /\bCHP\b/i],
  },
];

export function detectHandHistoryPlatform(input: string): PlatformDetection {
  const matches = platformMarkers
    .map((candidate) => {
      const markers = candidate.markers
        .filter((marker) => marker.test(input))
        .map((marker) => marker.source);

      return {
        platform: candidate.platform,
        confidence: confidenceFromMarkers(markers.length, candidate.markers.length),
        markers,
      };
    })
    .filter((candidate) => candidate.markers.length > 0)
    .sort((left, right) => right.confidence - left.confidence);

  if (matches[0]) {
    return matches[0];
  }

  return {
    platform: "Generic Unknown",
    confidence: looksPokerLike(input) ? 38 : 12,
    markers: looksPokerLike(input) ? ["generic poker hand markers"] : [],
  };
}

function confidenceFromMarkers(matches: number, total: number) {
  return Math.min(96, Math.max(45, Math.round((matches / total) * 100)));
}

function looksPokerLike(input: string) {
  return /hold'?em|hole cards|flop|turn|river|small blind|big blind|dealt to/i.test(input);
}
