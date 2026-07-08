export type ImportMethodId = "screenshot" | "paste" | "manual";

export type SeatPosition = "SB" | "BB" | "UTG" | "HJ" | "CO" | "BTN" | "Unknown";

export type BettingRound = "preflop" | "flop" | "turn" | "river";

export type HandAction = {
  round: BettingRound;
  actor: string;
  action: "post" | "fold" | "check" | "call" | "bet" | "raise" | "unknown";
  amount?: string;
  raw?: string;
};

export type HandPlayer = {
  id: string;
  label: string;
  position: SeatPosition;
  stack?: string;
  isHero?: boolean;
  cards?: string[];
};

export type UnifiedHandModel = {
  id: string;
  source: {
    method: ImportMethodId;
    provider?: string;
    confidence: number;
  };
  game: {
    variant: "Texas Hold'em" | "Unknown";
    format: "cash" | "tournament" | "unknown";
    stakes?: string;
    tableSize?: number;
  };
  hero: {
    position: SeatPosition;
    cards: string[];
  };
  players: HandPlayer[];
  board: {
    flop: string[];
    turn?: string;
    river?: string;
  };
  actions: HandAction[];
  rawInput?: string;
  importNotes: string[];
};

export type ImportProviderConfig = {
  id: ImportMethodId;
  label: string;
  shortLabel: string;
  badge?: string;
  description: string;
};

export const HAND_IMPORT_STORAGE_KEY = "kevixo.latestImportedHand";

export const importProviderConfigs: ImportProviderConfig[] = [
  {
    id: "screenshot",
    label: "Upload Screenshot",
    shortLabel: "Screenshot",
    badge: "Recommended",
    description: "Use the visual hand summary you already have. OCR can be connected later.",
  },
  {
    id: "paste",
    label: "Paste Hand History",
    shortLabel: "Paste",
    description: "Paste any text export and normalize it before analysis.",
  },
  {
    id: "manual",
    label: "Manual Hand Builder",
    shortLabel: "Manual",
    description: "Build the hand from positions, cards, board, and key action.",
  },
];

export function buildScreenshotHandModel(fileName?: string): UnifiedHandModel {
  return createBaseHandModel("screenshot", {
    rawInput: fileName ? `Screenshot file: ${fileName}` : "Screenshot pending upload",
    importNotes: [
      "Screenshot import stores the source separately from provider parsing.",
      "A future OCR adapter can fill the same model without changing analysis code.",
    ],
    sourceConfidence: fileName ? 42 : 25,
  });
}

export function buildPastedHandModel(handHistory: string): UnifiedHandModel {
  const cards = extractCards(handHistory);

  return createBaseHandModel("paste", {
    rawInput: handHistory,
    heroCards: cards.slice(0, 2),
    boardCards: cards.slice(2, 7),
    actions: extractActions(handHistory),
    importNotes: [
      "Text was normalized into Kevixo's provider-agnostic hand model.",
      "Provider-specific parser plugins can improve positions, stacks, and action sizing later.",
    ],
    sourceConfidence: handHistory.trim().length > 80 ? 68 : 35,
  });
}

export function buildManualHandModel(input: {
  heroPosition: SeatPosition;
  heroCards: string;
  flop: string;
  turn: string;
  river: string;
  keyAction: string;
}): UnifiedHandModel {
  const heroCards = splitCardInput(input.heroCards).slice(0, 2);
  const flop = splitCardInput(input.flop).slice(0, 3);
  const turn = splitCardInput(input.turn)[0];
  const river = splitCardInput(input.river)[0];

  return createBaseHandModel("manual", {
    heroPosition: input.heroPosition,
    heroCards,
    boardCards: [...flop, turn, river].filter(Boolean),
    actions: input.keyAction.trim()
      ? [
          {
            round: "river",
            actor: "Hero",
            action: "unknown",
            raw: input.keyAction.trim(),
          },
        ]
      : [],
    rawInput: input.keyAction,
    importNotes: [
      "Manual input created a structured model without relying on any room-specific format.",
      "Missing streets can be completed later before analysis.",
    ],
    sourceConfidence: heroCards.length === 2 ? 74 : 38,
  });
}

export function handModelToReviewText(model: UnifiedHandModel) {
  if (model.source.method === "paste" && model.rawInput?.trim()) {
    return model.rawInput;
  }

  const board = [...model.board.flop, model.board.turn, model.board.river]
    .filter(Boolean)
    .join(" ");
  const actions = model.actions.map((action) => action.raw ?? action.action).join("\n");

  return [
    `Kevixo Imported Hand (${model.source.method})`,
    `Game: ${model.game.variant}`,
    `Hero position: ${model.hero.position}`,
    `Hero cards: ${model.hero.cards.join(" ") || "Unknown"}`,
    `Board: ${board || "Unknown"}`,
    actions ? `Actions:\n${actions}` : "Actions: Pending",
    model.rawInput ? `Source:\n${model.rawInput}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function saveImportedHandModel(storage: Storage, model: UnifiedHandModel) {
  storage.setItem(
    HAND_IMPORT_STORAGE_KEY,
    JSON.stringify({
      model,
      reviewText: handModelToReviewText(model),
      savedAt: new Date().toISOString(),
    }),
  );
}

export function readImportedHandModel(storage: Storage) {
  const raw = storage.getItem(HAND_IMPORT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { reviewText?: string };
    return typeof parsed.reviewText === "string" ? parsed.reviewText : null;
  } catch {
    return null;
  }
}

function createBaseHandModel(
  method: ImportMethodId,
  options: {
    heroPosition?: SeatPosition;
    heroCards?: string[];
    boardCards?: string[];
    actions?: HandAction[];
    rawInput?: string;
    importNotes?: string[];
    sourceConfidence?: number;
  } = {},
): UnifiedHandModel {
  const [flopOne, flopTwo, flopThree, turn, river] = options.boardCards ?? [];

  return {
    id: `hand-${method}`,
    source: {
      method,
      confidence: options.sourceConfidence ?? 30,
    },
    game: {
      variant: "Texas Hold'em",
      format: "unknown",
    },
    hero: {
      position: options.heroPosition ?? "Unknown",
      cards: options.heroCards ?? [],
    },
    players: [
      {
        id: "hero",
        label: "Hero",
        position: options.heroPosition ?? "Unknown",
        isHero: true,
        cards: options.heroCards ?? [],
      },
      {
        id: "villain",
        label: "Villain",
        position: "Unknown",
      },
    ],
    board: {
      flop: [flopOne, flopTwo, flopThree].filter(Boolean),
      turn,
      river,
    },
    actions: options.actions ?? [],
    rawInput: options.rawInput,
    importNotes: options.importNotes ?? [],
  };
}

function extractCards(input: string) {
  return Array.from(input.matchAll(/\b([AKQJT2-9][cdhs])\b/gi), (match) =>
    normalizeCard(match[1]),
  );
}

function splitCardInput(input: string) {
  return input
    .split(/[\s,]+/)
    .map((card) => normalizeCard(card))
    .filter(Boolean);
}

function normalizeCard(card: string) {
  const trimmed = card.trim();

  if (!/^[AKQJT2-9][cdhs]$/i.test(trimmed)) {
    return "";
  }

  return `${trimmed[0].toUpperCase()}${trimmed[1].toLowerCase()}`;
}

function extractActions(input: string): HandAction[] {
  const rounds: BettingRound[] = ["preflop", "flop", "turn", "river"];
  let activeRound: BettingRound = "preflop";

  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const street = rounds.find((round) => line.toLowerCase().includes(round));

      if (street) {
        activeRound = street;
        return [];
      }

      const action = parseAction(line);

      if (!action) {
        return [];
      }

      return [{ ...action, round: activeRound, raw: line }];
    })
    .slice(0, 12);
}

function parseAction(line: string): Omit<HandAction, "round"> | null {
  const lower = line.toLowerCase();
  const actor = line.split(/\s+/)[0] || "Unknown";

  if (lower.includes("fold")) {
    return { actor, action: "fold" };
  }

  if (lower.includes("check")) {
    return { actor, action: "check" };
  }

  if (lower.includes("call")) {
    return { actor, action: "call", amount: extractAmount(line) };
  }

  if (lower.includes("bet")) {
    return { actor, action: "bet", amount: extractAmount(line) };
  }

  if (lower.includes("raise")) {
    return { actor, action: "raise", amount: extractAmount(line) };
  }

  if (lower.includes("post")) {
    return { actor, action: "post", amount: extractAmount(line) };
  }

  return null;
}

function extractAmount(line: string) {
  return line.match(/[$€£]?\d+(?:\.\d+)?/)?.[0];
}
