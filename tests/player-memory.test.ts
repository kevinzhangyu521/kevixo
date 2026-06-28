import {
  buildMemoryEntry,
  createPlayerMemory,
  getAverageGradeTrend,
  getPlayerMemoryInsights,
  saveReviewToMemory,
  type PlayerMemoryEntry,
} from "../lib/player-memory";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

function entry(overrides: Partial<PlayerMemoryEntry>): PlayerMemoryEntry {
  return {
    id: overrides.id ?? "review",
    date: overrides.date ?? "2026-06-28T00:00:00.000Z",
    grade: overrides.grade ?? "B-",
    biggestMistake: overrides.biggestMistake ?? "Called too wide on the river.",
    leak: overrides.leak ?? "River overcalling",
    homework: overrides.homework ?? "Review three river calls for 5 minutes.",
    difficulty: overrides.difficulty ?? 4,
    tags: overrides.tags ?? ["river", "overcalling"],
  };
}

function testKeepsLatestTwentyReviews() {
  const storage = createStorage();
  const memory = createPlayerMemory(storage);

  for (let index = 1; index <= 25; index += 1) {
    saveReviewToMemory(
      memory,
      entry({
        id: `review-${index}`,
        date: `2026-06-${String(index).padStart(2, "0")}T00:00:00.000Z`,
      }),
    );
  }

  const reviews = memory.read();

  assert(reviews.length === 20, "Expected memory to keep exactly 20 reviews.");
  assert(reviews[0]?.id === "review-25", "Expected newest review to be first.");
  assert(reviews.at(-1)?.id === "review-6", "Expected oldest retained review to be review 6.");
}

function testFindsRecentPatterns() {
  const reviews = [
    entry({ id: "5", grade: "B", leak: "River overcalling", tags: ["river", "overcalling"] }),
    entry({ id: "4", grade: "B-", leak: "River overcalling", tags: ["river", "overcalling"] }),
    entry({ id: "3", grade: "C+", leak: "Missed thin value", tags: ["river", "thin-value"] }),
    entry({ id: "2", grade: "C", leak: "Turn sizing", tags: ["turn", "sizing"] }),
    entry({ id: "1", grade: "C+", leak: "Preflop calling", tags: ["preflop"] }),
  ];

  const insights = getPlayerMemoryInsights(reviews);

  assert(
    insights.some((insight) => insight === "3 of your last 5 reviews involved river decisions."),
    "Expected river decision pattern.",
  );
  assert(
    insights.some((insight) => insight === "You keep overcalling large river bets."),
    "Expected repeated overcalling insight.",
  );
  assert(
    insights.some((insight) => insight === "You've improved your average grade from C+ to B."),
    "Expected average grade improvement insight.",
  );
}

function testBuildsMemoryEntryFromReport() {
  const memoryEntry = buildMemoryEntry({
    grade: "B-",
    biggestMistake: "You called the large river bet without enough bluffs.",
    homework: "Take 5 minutes to review three river calls.",
    difficulty: 4,
    leak: "River overcalling",
  });

  assert(memoryEntry.grade === "B-", "Expected grade to be saved.");
  assert(memoryEntry.leak === "River overcalling", "Expected leak to be saved.");
  assert(memoryEntry.tags.includes("river"), "Expected river tag from leak and mistake.");
  assert(memoryEntry.tags.includes("overcalling"), "Expected overcalling tag from leak.");
}

function testAverageGradeTrendCanStayFlat() {
  const trend = getAverageGradeTrend([
    entry({ grade: "B" }),
    entry({ grade: "B-" }),
    entry({ grade: "B" }),
  ]);

  assert(trend === null, "Expected no trend message when there is not enough movement.");
}

testKeepsLatestTwentyReviews();
testFindsRecentPatterns();
testBuildsMemoryEntryFromReport();
testAverageGradeTrendCanStayFlat();

console.log("player memory tests passed");
