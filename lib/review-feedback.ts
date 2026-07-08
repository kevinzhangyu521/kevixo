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
export type ReviewFeedbackStatus = "open" | "resolved";

export type ReviewFeedbackEntry = {
  id: string;
  date: string;
  createdAt: string;
  status: ReviewFeedbackStatus;
  usefulPart: UsefulPart;
  improvement: string;
  message: string;
  grade: string;
  email?: string;
  reviewId?: string;
  browser?: string;
  sourcePage?: string;
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

export function updateReviewFeedbackStatus(
  store: ReviewFeedbackStore,
  id: string,
  status: ReviewFeedbackEntry["status"],
) {
  return store.write(
    store.read().map((entry) => (entry.id === id ? { ...entry, status } : entry)),
  );
}

export function deleteReviewFeedback(store: ReviewFeedbackStore, id: string) {
  return store.write(store.read().filter((entry) => entry.id !== id));
}

export function buildReviewFeedbackEntry({
  usefulPart,
  improvement,
  grade,
  browser,
  email,
  reviewId,
  sourcePage = "/review",
}: {
  usefulPart: UsefulPart;
  improvement: string;
  grade: string;
  browser?: string;
  email?: string;
  reviewId?: string;
  sourcePage?: string;
}): ReviewFeedbackEntry {
  const createdAt = new Date().toISOString();
  const message = improvement.trim().slice(0, maxImprovementLength);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: createdAt,
    createdAt,
    status: "open",
    usefulPart,
    improvement: message,
    message,
    grade,
    browser,
    email,
    reviewId,
    sourcePage,
  };
}

export function isReviewFeedbackEntry(value: unknown): value is ReviewFeedbackEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const entry = value as ReviewFeedbackEntry;

  const improvement =
    typeof entry.improvement === "string"
      ? entry.improvement
      : typeof entry.message === "string"
        ? entry.message
        : "";

  if (
    typeof entry.id === "string" &&
    typeof entry.date === "string" &&
    usefulPartOptions.includes(entry.usefulPart) &&
    typeof entry.grade === "string"
  ) {
    entry.improvement = improvement.slice(0, maxImprovementLength);
    entry.message = entry.improvement;
    entry.createdAt = typeof entry.createdAt === "string" ? entry.createdAt : entry.date;
    entry.status = entry.status === "resolved" ? "resolved" : "open";
    entry.sourcePage = typeof entry.sourcePage === "string" ? entry.sourcePage : "/review";
    return entry.improvement.length <= maxImprovementLength;
  }

  return false;
}

export const reviewFeedbackStorageKey = feedbackKey;
