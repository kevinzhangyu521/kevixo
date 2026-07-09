export type DailyChallengeOption = {
  id: string;
  label: string;
  isBest: boolean;
};

export type DailyChallenge = {
  id: string;
  title: string;
  dateKey: string;
  board: string[];
  position: string;
  situation: string;
  options: DailyChallengeOption[];
  bestOptionId: string;
  explanation: string;
  takeaway: string;
};

export type DailyChallengeProgress = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDay: string | null;
  completedDays: string[];
};

export type DailyCompletion = {
  dateKey: string;
  challengeId: string;
  selectedOptionId: string;
  completedAt: string;
};

const challenges = [
  {
    id: "river-overbet-call",
    title: "River Pressure Spot",
    board: ["Ah", "9d", "4s", "2c", "Jd"],
    position: "Button vs Big Blind",
    situation:
      "You c-bet flop, checked back turn, and now face a large river bet after the big blind leads for 85% pot.",
    options: [
      { id: "call", label: "Call and bluff-catch", isBest: false },
      { id: "fold", label: "Fold the weakest bluff-catchers", isBest: true },
      { id: "raise", label: "Raise as a bluff", isBest: false },
    ],
    bestOptionId: "fold",
    explanation:
      "This river favors the big blind's value range after you check back turn. Calling too wide turns a small missed value spot into a repeated leak against strong river sizing.",
    takeaway: "When the story is value-heavy and your hand blocks few bluffs, protect your win rate by folding the bottom of your bluff-catchers.",
  },
  {
    id: "missed-cbet-dry-board",
    title: "Missed C-Bet Opportunity",
    board: ["Kc", "7d", "2s"],
    position: "Cutoff vs Big Blind",
    situation:
      "You open cutoff, the big blind calls, and the flop comes dry with one high card. You hold a range advantage.",
    options: [
      { id: "bet-small", label: "Bet small with range advantage", isBest: true },
      { id: "check-back", label: "Check back most hands", isBest: false },
      { id: "overbet", label: "Overbet immediately", isBest: false },
    ],
    bestOptionId: "bet-small",
    explanation:
      "A small c-bet applies pressure to many weak big blind hands while risking little. Checking too often gives away initiative on a board your range is allowed to attack.",
    takeaway: "On dry high-card flops, small bets can create fold equity without needing a big commitment.",
  },
  {
    id: "turn-barrel-equity",
    title: "Turn Barrel Decision",
    board: ["Qh", "8h", "3c", "Ts"],
    position: "Hijack vs Button",
    situation:
      "You c-bet flop with a gutshot and backdoor hearts. The turn adds an open-ended draw and your opponent checks again.",
    options: [
      { id: "give-up", label: "Give up and check", isBest: false },
      { id: "barrel", label: "Barrel with improved equity", isBest: true },
      { id: "jam", label: "Move all in", isBest: false },
    ],
    bestOptionId: "barrel",
    explanation:
      "The turn improves your equity and keeps pressure on one-pair hands. A measured barrel tells a believable story while giving you several clean river cards.",
    takeaway: "Good barrels combine fold equity, improved outs, and a credible value story.",
  },
  {
    id: "thin-value-river",
    title: "Thin Value River",
    board: ["Kd", "8s", "5c", "5h", "2d"],
    position: "Small Blind vs Big Blind",
    situation:
      "You reach the river with top pair after betting flop and checking turn. The big blind checks to you again.",
    options: [
      { id: "check", label: "Check back and show down", isBest: false },
      { id: "bet-small", label: "Bet small for thin value", isBest: true },
      { id: "overbet", label: "Overbet for max value", isBest: false },
    ],
    bestOptionId: "bet-small",
    explanation:
      "A small river value bet gets called by worse kings and stubborn pairs. Checking back misses value, while overbetting folds too much of the range you want to target.",
    takeaway: "Thin value works best when worse hands can comfortably call your size.",
  },
  {
    id: "three-bet-pot-flop",
    title: "3-Bet Pot Control",
    board: ["Jh", "7c", "4d"],
    position: "Big Blind vs Button",
    situation:
      "You 3-bet from the big blind, the button calls, and you miss the flop with ace-king on a medium connected board.",
    options: [
      { id: "range-bet", label: "Bet small with your range", isBest: false },
      { id: "check-evaluate", label: "Check and evaluate", isBest: true },
      { id: "pot-bet", label: "Pot bet to deny equity", isBest: false },
    ],
    bestOptionId: "check-evaluate",
    explanation:
      "This board connects well with the caller's flats. Checking protects your range, controls the pot, and avoids forcing ace-high into an expensive guessing game.",
    takeaway: "In 3-bet pots, board texture matters more than simply being the preflop aggressor.",
  },
];

const utcDayInMs = 24 * 60 * 60 * 1000;

export function getTodayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getDailyChallenge(date = new Date()): DailyChallenge {
  const dateKey = getTodayKey(date);
  const index = Math.abs(dayNumber(dateKey)) % challenges.length;
  const challenge = challenges[index];

  return {
    ...challenge,
    dateKey,
  };
}

export function createInitialProgress(): DailyChallengeProgress {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDay: null,
    completedDays: [],
  };
}

export function completeDailyChallenge(
  progress: DailyChallengeProgress,
  completion: DailyCompletion,
): DailyChallengeProgress {
  const completedDays = Array.from(new Set([...progress.completedDays, completion.dateKey])).sort();
  const currentStreak = calculateCurrentStreak(completedDays, completion.dateKey);
  const longestStreak = Math.max(progress.longestStreak, calculateLongestStreak(completedDays));

  return {
    currentStreak,
    longestStreak,
    lastCompletedDay: completion.dateKey,
    completedDays,
  };
}

function calculateCurrentStreak(completedDays: string[], todayKey: string) {
  const completed = new Set(completedDays);
  let streak = 0;
  let cursor = parseUtcDay(todayKey);

  while (completed.has(formatUtcDay(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - utcDayInMs);
  }

  return streak;
}

function calculateLongestStreak(completedDays: string[]) {
  if (completedDays.length === 0) {
    return 0;
  }

  let longest = 1;
  let current = 1;
  const sortedDays = completedDays.map(parseUtcDay).sort((left, right) => left.getTime() - right.getTime());

  for (let index = 1; index < sortedDays.length; index += 1) {
    const diff = sortedDays[index].getTime() - sortedDays[index - 1].getTime();

    if (diff === utcDayInMs) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
  }

  return longest;
}

function dayNumber(dateKey: string) {
  return Math.floor(parseUtcDay(dateKey).getTime() / utcDayInMs);
}

function parseUtcDay(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function formatUtcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}
