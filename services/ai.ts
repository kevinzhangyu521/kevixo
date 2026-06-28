import {
  HAND_REVIEW_SYSTEM_PROMPT,
  createFollowUpPrompt,
  createHandReviewPrompt,
} from "@/services/prompt";

export type CoachingReport = {
  keyLesson: string;
  biggestMistake: string;
  betterDecision: string;
  why: string;
  evidence: string;
  nextTimeChecklist: string[];
  coachNote: string;
  homework: string;
  leak: string;
  grade: string;
  confidence: number;
  difficulty: number;
  followUpSuggestions: string[];
};

export type AnalyzeResult =
  | { ok: true; report: CoachingReport }
  | { ok: false; error: string };

export type FollowUpResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

const reportSchema = {
  name: "kevixo_hand_review_v2",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "keyLesson",
      "biggestMistake",
      "betterDecision",
      "why",
      "evidence",
      "nextTimeChecklist",
      "coachNote",
      "homework",
      "leak",
      "grade",
      "confidence",
      "difficulty",
      "followUpSuggestions",
    ],
    properties: {
      keyLesson: { type: "string" },
      biggestMistake: { type: "string" },
      betterDecision: { type: "string" },
      why: { type: "string" },
      evidence: { type: "string" },
      nextTimeChecklist: {
        type: "array",
        items: { type: "string" },
      },
      coachNote: { type: "string" },
      homework: { type: "string" },
      leak: { type: "string" },
      grade: { type: "string" },
      confidence: { type: "number" },
      difficulty: { type: "number" },
      followUpSuggestions: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
  strict: true,
};

export async function analyzeHandHistory(handHistory: string): Promise<AnalyzeResult> {
  if (!looksLikeHandHistory(handHistory)) {
    return {
      ok: false,
      error:
        "This does not look like a complete PokerStars or GGPoker hand history yet. Paste the full hand including seats, hole cards, streets, and actions.",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { ok: true, report: getMockReport(handHistory) };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: HAND_REVIEW_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: createHandReviewPrompt(handHistory),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            ...reportSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error:
          "Kevixo could not reach the coaching engine right now. Please try again in a moment.",
      };
    }

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const outputText =
      payload.output_text ??
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === "output_text")?.text;

    if (!outputText) {
      return {
        ok: false,
        error:
          "Kevixo could not read the coaching response. Please try again with a complete hand history.",
      };
    }

    return { ok: true, report: normalizeReport(JSON.parse(outputText)) };
  } catch {
    return {
      ok: false,
      error:
        "The analysis timed out or the network dropped. Please try again with the same hand history.",
    };
  }
}

export async function answerFollowUpQuestion({
  handHistory,
  report,
  question,
}: {
  handHistory: string;
  report: CoachingReport;
  question: string;
}): Promise<FollowUpResult> {
  if (!question.trim()) {
    return { ok: false, error: "Ask a follow-up question first." };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      ok: true,
      answer:
        "Before you call the river, make yourself name three realistic bluffs villain can have. If you cannot find them quickly, folding is not weak. It is disciplined.",
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: HAND_REVIEW_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: createFollowUpPrompt({ handHistory, report, question }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: "Kevixo could not answer that follow-up right now. Try again in a moment.",
      };
    }

    const payload = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{ type?: string; text?: string }>;
      }>;
    };

    const answer =
      payload.output_text ??
      payload.output
        ?.flatMap((item) => item.content ?? [])
        .find((content) => content.type === "output_text")?.text;

    if (!answer) {
      return { ok: false, error: "Kevixo could not read the follow-up answer." };
    }

    return { ok: true, answer };
  } catch {
    return {
      ok: false,
      error: "The follow-up request timed out. Please try again.",
    };
  }
}

function normalizeReport(value: Partial<CoachingReport>): CoachingReport {
  return {
    keyLesson:
      value.keyLesson ??
      "When a river bet is polarized, your first job is to count realistic bluffs. Do not pay off just because your hand looks strong.",
    biggestMistake:
      value.biggestMistake ??
      "Calling the large river bet before identifying enough missed draws or worse value hands.",
    betterDecision:
      value.betterDecision ??
      "Fold the river unless villain has shown a clear tendency to over-bluff this line.",
    why:
      value.why ??
      "Villain's river sizing represents a narrow value-heavy range, and your hand does not block enough of that value.",
    evidence:
      value.evidence ??
      "The line bet-call, bet-call, overbet river contains more strong made hands than natural missed draws.",
    nextTimeChecklist: normalizeChecklist(value.nextTimeChecklist),
    coachNote:
      value.coachNote ??
      "This is the kind of fold that feels uncomfortable in real time, but making it is how your win rate improves.",
    homework:
      value.homework ??
      "Spend 5 minutes reviewing three river overbet hands and write down villain's likely bluffs before checking the result.",
    leak: value.leak ?? "River overcalling",
    grade: value.grade ?? "B-",
    confidence: clampNumber(value.confidence, 0, 100, 92),
    difficulty: clampNumber(value.difficulty, 1, 5, 4),
    followUpSuggestions: Array.isArray(value.followUpSuggestions)
      ? value.followUpSuggestions
      : [
          "What bluffs can villain have here?",
          "How do I know when to fold top pair?",
          "What should I practice next?",
        ],
  };
}

function getMockReport(handHistory: string): CoachingReport {
  const hasRiver = handHistory.toLowerCase().includes("river");

  return {
    keyLesson:
      "Do not bluff-catch rivers on hand strength alone. Count villain's believable bluffs before you put in the call.",
    biggestMistake:
      "You called the large river bet without proving villain had enough missed draws or worse value hands.",
    betterDecision:
      "Check river, face the polar bet, and fold unless you can name enough natural bluffs.",
    why:
      "By the river, villain's range is weighted toward strong value. Your hand beats some pairs, but it does not perform well against the hands that choose this size.",
    evidence:
      "Villain called flop and turn, then used a large river sizing after the board did not complete many obvious missed draws.",
    nextTimeChecklist: [
      "Name villain's value hands before calling.",
      "List at least three natural bluffs.",
      "Fold if the bluff list is too short.",
    ],
    coachNote:
      "You were not far off. The discipline is pausing before the river call and making villain show enough bluffs on paper first.",
    homework:
      "Take 5 minutes to review three river calls and write the value hands and bluff hands before seeing the result.",
    leak: "River overcalling",
    grade: "B-",
    confidence: hasRiver ? 92 : 78,
    difficulty: hasRiver ? 4 : 3,
    followUpSuggestions: [
      "What bluffs can villain have here?",
      "How do I know when to fold top pair?",
      "What should I practice next?",
    ],
  };
}

function normalizeChecklist(value: string[] | undefined) {
  const fallback = [
    "Name villain's value hands before calling.",
    "List at least three natural bluffs.",
    "Fold if the bluff list is too short.",
  ];

  if (!Array.isArray(value)) {
    return fallback;
  }

  return [...value, ...fallback].slice(0, 3);
}

function looksLikeHandHistory(handHistory: string) {
  const text = handHistory.toLowerCase();
  const hasCards = /\[[2-9tjqka][cdhs]\s+[2-9tjqka][cdhs]\]/i.test(handHistory);
  const hasPokerSite = text.includes("pokerstars") || text.includes("ggpoker") || text.includes("hold'em");
  const hasAction = ["raises", "calls", "bets", "checks", "folds"].some((word) => text.includes(word));
  const hasStreet = ["flop", "turn", "river"].some((word) => text.includes(word));

  return handHistory.trim().length >= 120 && hasCards && hasPokerSite && hasAction && hasStreet;
}

function clampNumber(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
