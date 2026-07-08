import type { CoachingReport } from "@/services/ai";

const reviewStoreKey = "kevixo.reviews.v1";
const maxStoredReviews = 20;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type StoredReview = {
  reviewId: string;
  createdAt: string;
  handHistory: string;
  report: CoachingReport;
};

export function saveStoredReview(storage: StorageLike, review: StoredReview) {
  const reviews = readStoredReviews(storage);
  const nextReviews = [
    review,
    ...reviews.filter((storedReview) => storedReview.reviewId !== review.reviewId),
  ].slice(0, maxStoredReviews);

  storage.setItem(reviewStoreKey, JSON.stringify(nextReviews));

  return nextReviews;
}

export function findStoredReview(storage: StorageLike, reviewId: string) {
  return readStoredReviews(storage).find((review) => review.reviewId === reviewId) ?? null;
}

function readStoredReviews(storage: StorageLike) {
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
