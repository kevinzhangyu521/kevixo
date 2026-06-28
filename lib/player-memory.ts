const memoryKey = "kevixo.playerMemory.v1";
const maxReviews = 20;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type PlayerMemoryEntry = {
  id: string;
  date: string;
  grade: string;
  biggestMistake: string;
  leak: string;
  homework: string;
  difficulty: number;
  tags: string[];
};

export type PlayerMemory = {
  read: () => PlayerMemoryEntry[];
  write: (reviews: PlayerMemoryEntry[]) => PlayerMemoryEntry[];
  clear: () => void;
};

export type ReviewMemorySource = {
  grade: string;
  biggestMistake: string;
  homework: string;
  difficulty: number;
  leak: string;
};

const gradeScores: Record<string, number> = {
  "A+": 12,
  A: 11,
  "A-": 10,
  "B+": 9,
  B: 8,
  "B-": 7,
  "C+": 6,
  C: 5,
  "C-": 4,
  "D+": 3,
  D: 2,
  F: 1,
};

const scoreGrades = [
  "F",
  "F",
  "D",
  "D+",
  "C-",
  "C",
  "C+",
  "B-",
  "B",
  "B+",
  "A-",
  "A",
  "A+",
];

export function createPlayerMemory(storage: StorageLike): PlayerMemory {
  return {
    read() {
      const stored = storage.getItem(memoryKey);

      if (!stored) {
        return [];
      }

      try {
        const parsed = JSON.parse(stored) as PlayerMemoryEntry[];

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.filter(isPlayerMemoryEntry).slice(0, maxReviews);
      } catch {
        return [];
      }
    },
    write(reviews) {
      const nextReviews = reviews.filter(isPlayerMemoryEntry).slice(0, maxReviews);
      storage.setItem(memoryKey, JSON.stringify(nextReviews));
      return nextReviews;
    },
    clear() {
      storage.removeItem(memoryKey);
    },
  };
}

export function saveReviewToMemory(
  memory: PlayerMemory,
  entry: PlayerMemoryEntry,
): PlayerMemoryEntry[] {
  return memory.write([entry, ...memory.read()].slice(0, maxReviews));
}

export function buildMemoryEntry(report: ReviewMemorySource): PlayerMemoryEntry {
  const text = [
    report.biggestMistake,
    report.leak,
    report.homework,
  ].join(" ");

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    grade: report.grade,
    biggestMistake: report.biggestMistake,
    leak: report.leak,
    homework: report.homework,
    difficulty: report.difficulty,
    tags: detectTags(text),
  };
}

export function getPlayerMemoryInsights(reviews: PlayerMemoryEntry[]): string[] {
  if (reviews.length === 0) {
    return [
      "I’ll start remembering your review patterns after this hand.",
      "Your next completed review becomes the first session in local memory.",
    ];
  }

  const insights = [
    getRecentStreetPattern(reviews),
    getAverageGradeTrend(reviews),
    getRepeatedLeakInsight(reviews),
    getDifficultyInsight(reviews),
  ].filter((insight): insight is string => Boolean(insight));

  if (insights.length > 0) {
    return insights.slice(0, 3);
  }

  return [
    `I remember ${reviews.length} local ${reviews.length === 1 ? "review" : "reviews"} so far.`,
    "Keep reviewing one spot at a time and I’ll start spotting stronger patterns.",
  ];
}

export function getAverageGradeTrend(reviews: PlayerMemoryEntry[]): string | null {
  if (reviews.length < 5) {
    return null;
  }

  const recent = averageGrade(reviews.slice(0, 2));
  const earlier = averageGrade(reviews.slice(-3));

  if (recent === null || earlier === null || recent - earlier < 0.75) {
    return null;
  }

  return `You've improved your average grade from ${formatGrade(earlier)} to ${formatGrade(recent)}.`;
}

function getRecentStreetPattern(reviews: PlayerMemoryEntry[]) {
  const recent = reviews.slice(0, 5);
  const riverCount = countTag(recent, "river");

  if (recent.length >= 5 && riverCount >= 3) {
    return `${riverCount} of your last ${recent.length} reviews involved river decisions.`;
  }

  const turnCount = countTag(recent, "turn");

  if (recent.length >= 5 && turnCount >= 3) {
    return `${turnCount} of your last ${recent.length} reviews involved turn decisions.`;
  }

  return null;
}

function getRepeatedLeakInsight(reviews: PlayerMemoryEntry[]) {
  const recent = reviews.slice(0, 6);
  const overcallingCount = countTag(recent, "overcalling");

  if (overcallingCount >= 2) {
    return "You keep overcalling large river bets.";
  }

  const sizingCount = countTag(recent, "sizing");

  if (sizingCount >= 2) {
    return "Bet sizing keeps showing up as a decision point.";
  }

  const thinValueCount = countTag(recent, "thin-value");

  if (thinValueCount >= 2) {
    return "You may be missing thin value in checked river spots.";
  }

  return null;
}

function getDifficultyInsight(reviews: PlayerMemoryEntry[]) {
  const recent = reviews.slice(0, 5);

  if (recent.length < 3) {
    return null;
  }

  const averageDifficulty =
    recent.reduce((sum, review) => sum + review.difficulty, 0) / recent.length;

  if (averageDifficulty >= 4) {
    return "Your recent reviews are mostly difficult spots, so slow river decisions down.";
  }

  return null;
}

function averageGrade(reviews: PlayerMemoryEntry[]) {
  const scores = reviews
    .map((review) => gradeScores[review.grade])
    .filter((score): score is number => typeof score === "number");

  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function formatGrade(score: number) {
  return scoreGrades[Math.max(1, Math.min(12, Math.round(score)))] ?? "B";
}

function countTag(reviews: PlayerMemoryEntry[], tag: string) {
  return reviews.filter((review) => review.tags.includes(tag)).length;
}

function detectTags(text: string) {
  const lowerText = text.toLowerCase();
  const tags = new Set<string>();

  if (lowerText.includes("river")) {
    tags.add("river");
  }

  if (lowerText.includes("turn")) {
    tags.add("turn");
  }

  if (lowerText.includes("flop")) {
    tags.add("flop");
  }

  if (lowerText.includes("preflop") || lowerText.includes("pre-flop")) {
    tags.add("preflop");
  }

  if (
    lowerText.includes("overcall") ||
    lowerText.includes("called too wide") ||
    lowerText.includes("large river bet")
  ) {
    tags.add("overcalling");
  }

  if (lowerText.includes("sizing") || lowerText.includes("size")) {
    tags.add("sizing");
  }

  if (lowerText.includes("thin value")) {
    tags.add("thin-value");
  }

  return [...tags];
}

function isPlayerMemoryEntry(value: unknown): value is PlayerMemoryEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as PlayerMemoryEntry;

  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    typeof entry.grade === "string" &&
    typeof entry.biggestMistake === "string" &&
    typeof entry.leak === "string" &&
    typeof entry.homework === "string" &&
    typeof entry.difficulty === "number" &&
    Array.isArray(entry.tags)
  );
}
