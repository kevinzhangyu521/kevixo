import {
  detectHandHistoryPlatform,
  type HandHistoryPlatform,
  type PlatformDetection,
} from "@/lib/hand-history/detector";
import { normalizeHandHistory } from "@/lib/hand-history/normalizer";

export type HandHistoryValidationCode =
  | "missing_actions"
  | "missing_board_cards"
  | "unknown_blind_level"
  | "incomplete_showdown";

export type HandHistoryValidationIssue = {
  code: HandHistoryValidationCode;
  label: string;
  message: string;
};

export type ParsedHandHistory = {
  rawText: string;
  normalizedText: string;
  platform: HandHistoryPlatform;
  detection: PlatformDetection;
  isCompleteEnough: boolean;
  validation: {
    missing: HandHistoryValidationIssue[];
    messages: string[];
  };
  normalizationNotes: string[];
};

const validationIssues: Record<HandHistoryValidationCode, Omit<HandHistoryValidationIssue, "code">> = {
  missing_actions: {
    label: "Missing actions",
    message: "We couldn't find enough betting actions yet.",
  },
  missing_board_cards: {
    label: "Missing board cards",
    message: "We couldn't find the board cards for this hand.",
  },
  unknown_blind_level: {
    label: "Unknown blind level",
    message: "We couldn't find the blind level or stakes.",
  },
  incomplete_showdown: {
    label: "Incomplete showdown",
    message: "We couldn't find the final action or showdown.",
  },
};

export function parseHandHistory(input: string): ParsedHandHistory {
  const normalized = normalizeHandHistory(input);
  const detection = detectHandHistoryPlatform(normalized.text);
  const missing = getMissingIssues(normalized.text);

  return {
    rawText: input,
    normalizedText: normalized.text,
    platform: detection.platform,
    detection,
    isCompleteEnough: isCompleteEnough(normalized.text, missing),
    validation: {
      missing,
      messages:
        missing.length > 0
          ? [
              "A few hand details are missing before Kevixo can review this hand.",
              ...missing.map((issue) => issue.message),
            ]
          : ["This hand looks ready for review."],
    },
    normalizationNotes: normalized.notes,
  };
}

function getMissingIssues(text: string) {
  const missing: HandHistoryValidationIssue[] = [];

  if (!hasActions(text)) {
    missing.push(toIssue("missing_actions"));
  }

  if (!hasBoardCards(text)) {
    missing.push(toIssue("missing_board_cards"));
  }

  if (!hasBlindLevel(text)) {
    missing.push(toIssue("unknown_blind_level"));
  }

  if (!hasFinalAction(text)) {
    missing.push(toIssue("incomplete_showdown"));
  }

  return missing;
}

function toIssue(code: HandHistoryValidationCode): HandHistoryValidationIssue {
  return {
    code,
    ...validationIssues[code],
  };
}

function isCompleteEnough(text: string, missing: HandHistoryValidationIssue[]) {
  const hasCards = /\b[AKQJT2-9][cdhs]\b/i.test(text) || /\[[^\]]*[AKQJT2-9][cdhs][^\]]*\]/i.test(text);
  const hasPokerContext = /hold'?em|hole cards|dealt to|flop|turn|river|small blind|big blind/i.test(text);

  return text.trim().length >= 120 && hasCards && hasPokerContext && missing.length <= 1;
}

function hasActions(text: string) {
  const actionCount = (text.match(/\b(posts?|folds?|checks?|calls?|bets?|raises?|all-in|collected)\b/gi) ?? [])
    .length;

  return actionCount >= 3;
}

function hasBoardCards(text: string) {
  const streetLine = /\b(flop|turn|river)\b.*(?:[AKQJT2-9][cdhs].*){1,3}/i.test(text);
  const bracketBoard = /\[[AKQJT2-9][cdhs]\s+[AKQJT2-9][cdhs]\s+[AKQJT2-9][cdhs](?:\s+[AKQJT2-9][cdhs])?(?:\s+[AKQJT2-9][cdhs])?\]/i.test(text);

  return streetLine || bracketBoard;
}

function hasBlindLevel(text: string) {
  return (
    /\(\$?\d+(?:\.\d+)?\/\$?\d+(?:\.\d+)?/.test(text) ||
    /\b(?:small blind|big blind|posts? blind|blinds?)\b.*\d/i.test(text) ||
    /\b\d+(?:\.\d+)?\/\d+(?:\.\d+)?\b/.test(text)
  );
}

function hasFinalAction(text: string) {
  return /\b(show down|showdown|shows|mucks|collected|uncalled bet|wins pot|won pot|folds)\b/i.test(text);
}
