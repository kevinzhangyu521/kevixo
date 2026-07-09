import type { CoachingReport } from "@/services/ai";

const reviewStoreKey = "kevixo.reviews.v1";
const maxStoredReviews = 20;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type StoredReview = {
  reviewId: string;
  createdAt: string;
  handHistory: string;
  report: CoachingReport;
  title?: string;
  isFavorite?: boolean;
};

export function saveStoredReview(storage: StorageLike, review: StoredReview) {
  const reviews = readStoredReviews(storage);
  const existingReview = reviews.find((storedReview) => storedReview.reviewId === review.reviewId);
  const normalizedReview = {
    ...review,
    title: review.title ?? existingReview?.title ?? generateHandTitle(review.handHistory),
    isFavorite: review.isFavorite ?? existingReview?.isFavorite ?? false,
  };
  const nextReviews = [
    normalizedReview,
    ...reviews.filter((storedReview) => storedReview.reviewId !== review.reviewId),
  ].slice(0, maxStoredReviews);

  storage.setItem(reviewStoreKey, JSON.stringify(nextReviews));

  return nextReviews;
}

export function findStoredReview(storage: StorageLike, reviewId: string) {
  return readStoredReviews(storage).find((review) => review.reviewId === reviewId) ?? null;
}

export function readStoredReviews(storage: StorageLike) {
  const stored = storage.getItem(reviewStoreKey);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as StoredReview[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isStoredReview);
  } catch {
    return [];
  }
}

export function deleteStoredReview(storage: StorageLike, reviewId: string) {
  const nextReviews = readStoredReviews(storage).filter((review) => review.reviewId !== reviewId);
  storage.setItem(reviewStoreKey, JSON.stringify(nextReviews));
  return nextReviews;
}

export function toggleStoredReviewFavorite(storage: StorageLike, reviewId: string) {
  const nextReviews = readStoredReviews(storage).map((review) =>
    review.reviewId === reviewId
      ? {
          ...review,
          isFavorite: !review.isFavorite,
        }
      : review,
  );
  storage.setItem(reviewStoreKey, JSON.stringify(nextReviews));
  return nextReviews;
}

function isStoredReview(value: unknown): value is StoredReview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const review = value as StoredReview;

  return (
    typeof review.reviewId === "string" &&
    typeof review.createdAt === "string" &&
    typeof review.handHistory === "string" &&
    typeof review.report === "object" &&
    review.report !== null &&
    review.report.reviewId === review.reviewId
  );
}

function generateHandTitle(handHistory: string) {
  const heroCards = handHistory.match(/Dealt to Hero \[([^\]]+)\]/i)?.[1];
  const table = handHistory.match(/Table '([^']+)'/i)?.[1];
  const stakes = handHistory.match(/\(([^)]+)\)/)?.[1];
  const spot = table ? table.replace(/^Kevixo\s+/i, "") : "Reviewed Hand";

  return [heroCards ? `Hero ${heroCards}` : "Poker Hand", stakes, spot]
    .filter(Boolean)
    .join(" - ");
}

export const reviewHistoryStorageKey = reviewStoreKey;
