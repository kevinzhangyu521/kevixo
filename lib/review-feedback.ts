const feedbackKey = "kevixo.reviewFeedback.v1";
const maxImprovementLength = 500;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const usefulPartOptions = [
  "Biggest Mistake",
  "Better Decision",
  "Coach Note",
  "Homework",
  "Other",
] as const;

export type UsefulPart = (typeof usefulPartOptions)[number];

export type ReviewFeedbackEntry = {
  id: string;
  date: string;
  usefulPart: UsefulPart;
  improvement: string;
  grade: string;
};

export type ReviewFeedbackStore = {
  read: () => ReviewFeedbackEntry[];
  write: (feedback: ReviewFeedbackEntry[]) => ReviewFeedbackEntry[];
  clear: () => void;
};

export function createReviewFeedbackStore(storage: StorageLike): ReviewFeedbackStore {
  return {
    read() {
      const stored = storage.getItem(feedbackKey);

      if (!stored) {
        return [];
      }

      try {
        const parsed = JSON.parse(stored) as ReviewFeedbackEntry[];

        if (!Array.isArray(parsed)) {
          return [];
        }

        return parsed.filter(isReviewFeedbackEntry);
      } catch {
        return [];
      }
    },
    write(feedback) {
      const validFeedback = feedback.filter(isReviewFeedbackEntry);
      storage.setItem(feedbackKey, JSON.stringify(validFeedback));
      return validFeedback;
    },
    clear() {
      storage.removeItem(feedbackKey);
    },
  };
}

export function saveReviewFeedback(
  store: ReviewFeedbackStore,
  entry: ReviewFeedbackEntry,
) {
  return store.write([entry, ...store.read()]);
}

export function buildReviewFeedbackEntry({
  usefulPart,
  improvement,
  grade,
}: {
  usefulPart: UsefulPart;
  improvement: string;
  grade: string;
}): ReviewFeedbackEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    usefulPart,
    improvement: improvement.trim().slice(0, maxImprovementLength),
    grade,
  };
}

function isReviewFeedbackEntry(value: unknown): value is ReviewFeedbackEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as ReviewFeedbackEntry;

  return (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    usefulPartOptions.includes(entry.usefulPart) &&
    typeof entry.improvement === "string" &&
    entry.improvement.length <= maxImprovementLength &&
    typeof entry.grade === "string"
  );
}
