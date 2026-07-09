"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ReviewShareCard } from "@/components/review-share-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  deleteStoredReview,
  readStoredReviews,
  toggleStoredReviewFavorite,
  type StoredReview,
} from "@/lib/review-store";

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [query, setQuery] = useState("");
  const [shareReviewId, setShareReviewId] = useState("");

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setReviews(readStoredReviews(window.localStorage));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return reviews
      .filter((review) => {
        if (!normalizedQuery) {
          return true;
        }

        return [
          review.title,
          review.report.grade,
          review.report.biggestMistake,
          review.report.betterDecision,
          review.report.leak,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((left, right) => {
        if (left.isFavorite !== right.isFavorite) {
          return left.isFavorite ? -1 : 1;
        }

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      });
  }, [query, reviews]);

  function handleDelete(reviewId: string) {
    setReviews(deleteStoredReview(window.localStorage, reviewId));

    if (shareReviewId === reviewId) {
      setShareReviewId("");
    }
  }

  function handleFavorite(reviewId: string) {
    setReviews(toggleStoredReviewFavorite(window.localStorage, reviewId));
  }

  const shareReview = reviews.find((review) => review.reviewId === shareReviewId);

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader ctaLabel="Analyze My Hand" ctaHref="/review" />

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-8 md:pb-24 md:pt-10">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Coaching History
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
              My Reviews
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Revisit the hands you studied, keep the best lessons close, and share useful
              coaching summaries when they help the conversation.
            </p>
          </div>
          <Button asChild>
            <Link href="/review">Analyze Another Hand</Link>
          </Button>
        </div>

        <Card className="mt-8 p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Saved Reviews</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Stored privately in this browser. No login required.
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by leak, grade, or decision..."
              className="min-h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:border-primary/55 focus:outline-none md:max-w-sm"
              aria-label="Search reviews"
            />
          </div>
        </Card>

        {filteredReviews.length > 0 ? (
          <div className="mt-6 grid gap-4">
            {filteredReviews.map((review) => (
              <ReviewHistoryCard
                key={review.reviewId}
                review={review}
                onDelete={() => handleDelete(review.reviewId)}
                onFavorite={() => handleFavorite(review.reviewId)}
                onShare={() => setShareReviewId(review.reviewId)}
              />
            ))}
          </div>
        ) : (
          <Card className="mt-6 border-primary/20 bg-primary/5 p-5 md:p-6">
            <CardTitle>{reviews.length === 0 ? "No reviews yet" : "No matches found"}</CardTitle>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {reviews.length === 0
                ? "Analyze a demo hand or paste your own hand to start building your coaching history."
                : "Try searching for a grade, leak, or decision from the review."}
            </p>
            <div className="mt-5">
              <Button asChild>
                <Link href="/review">Analyze My Hand</Link>
              </Button>
            </div>
          </Card>
        )}

        {shareReview ? <ReviewShareCard report={shareReview.report} /> : null}
      </section>
    </main>
  );
}

function ReviewHistoryCard({
  onDelete,
  onFavorite,
  onShare,
  review,
}: {
  onDelete: () => void;
  onFavorite: () => void;
  onShare: () => void;
  review: StoredReview;
}) {
  return (
    <Card className="p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {review.report.grade}
            </span>
            <span className="rounded-full border border-slate-800 bg-slate-950/48 px-3 py-1 text-xs font-semibold text-slate-300">
              {Math.round(review.report.confidence)}% confidence
            </span>
            {review.isFavorite ? (
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                Favorite
              </span>
            ) : null}
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-50">
            {review.title ?? "Poker Hand Review"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{formatDate(review.createdAt)}</p>
          <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-300">
            {review.report.biggestMistake}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Button asChild>
            <Link href={`/review?reviewId=${encodeURIComponent(review.reviewId)}`}>
              View Review
            </Link>
          </Button>
          <Button type="button" variant="secondary" onClick={onShare}>
            Share
          </Button>
          <Button type="button" variant="secondary" onClick={onFavorite}>
            {review.isFavorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button type="button" variant="secondary" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
