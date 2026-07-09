"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  trackCopyLinkClicked,
  trackImageDownloaded,
  trackShareClicked,
} from "@/lib/analytics";
import {
  createShareCardSvg,
  getSharePath,
  getShareUrl,
  shareCardHeight,
  shareCardWidth,
  toShareReview,
  type ShareReview,
} from "@/lib/share-review";
import type { CoachingReport } from "@/services/ai";

type ReviewShareCardProps = {
  report: CoachingReport | ShareReview;
  showActions?: boolean;
};

export function ReviewShareCard({ report, showActions = true }: ReviewShareCardProps) {
  const review = useMemo(
    () => ("keyLesson" in report && "homework" in report ? toShareReview(report as CoachingReport) : report),
    [report],
  );
  const [statusMessage, setStatusMessage] = useState("Ready to share.");
  const sharePath = getSharePath(review.reviewId);

  async function handleShare() {
    trackShareClicked(review.reviewId);
    const shareUrl = getBrowserShareUrl(review.reviewId);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Kevixo AI Review: ${review.grade}`,
          text: `Kevixo found this spot: ${review.biggestMistake}`,
          url: shareUrl,
        });
        setStatusMessage("Share sheet opened.");
        return;
      }

      await copyText(shareUrl);
      setStatusMessage("Share link copied.");
    } catch {
      setStatusMessage("Sharing was cancelled.");
    }
  }

  async function handleCopyLink() {
    trackCopyLinkClicked(review.reviewId);

    try {
      await copyText(getBrowserShareUrl(review.reviewId));
      setStatusMessage("Public review link copied.");
    } catch {
      setStatusMessage("Copy failed. Open the share page and copy the URL.");
    }
  }

  async function handleDownloadImage() {
    trackImageDownloaded(review.reviewId);

    try {
      await downloadReviewImage(review);
      setStatusMessage("Image downloaded.");
    } catch {
      setStatusMessage("Image download failed. Please try again.");
    }
  }

  return (
    <Card className="fade-in mt-10 overflow-hidden border-primary/25 bg-slate-950/68 p-0">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.86fr]">
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Shareable Review</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A clean summary card for Reddit, X, Discord, and poker forums.
              </p>
            </div>
            <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Public link
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-[#020617] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.42)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/kevixo-logo.svg"
                  alt="Kevixo"
                  width={118}
                  height={30}
                  className="h-auto w-[118px]"
                />
                <span className="hidden text-sm text-slate-500 sm:inline">Reviewed by Kevixo AI</span>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-3xl font-semibold leading-none text-primary">
                {review.grade}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <ShareMetric label="Confidence" value={`${Math.round(review.confidence)}%`} />
              <ShareMetric label="Difficulty" value={`${review.difficulty}/5`} />
            </div>

            <div className="mt-5 grid gap-4">
              <ShareTextBlock label="Biggest Mistake" value={review.biggestMistake} strong />
              <ShareTextBlock label="Better Decision" value={review.betterDecision} />
              <ShareTextBlock label="Coach Note" value={review.coachNote} muted />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 bg-slate-950/46 p-5 md:p-6 lg:border-l lg:border-t-0">
          <p className="text-sm font-semibold text-slate-100">Public share URL</p>
          <p className="mt-2 break-all rounded-xl border border-slate-800 bg-slate-950/64 px-3 py-3 text-sm leading-6 text-slate-400">
            {sharePath}
          </p>

          {showActions ? (
            <div className="mt-5 grid gap-3">
              <Button type="button" onClick={handleShare} className="shadow-[0_0_28px_rgba(59,201,255,0.16)]">
                Share
              </Button>
              <Button type="button" variant="secondary" onClick={handleCopyLink}>
                Copy Link
              </Button>
              <Button type="button" variant="secondary" onClick={handleDownloadImage}>
                Download Image
              </Button>
            </div>
          ) : null}

          <p className="mt-4 text-sm leading-6 text-slate-500" role="status" aria-live="polite">
            {statusMessage}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ShareMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/56 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function ShareTextBlock({
  label,
  muted = false,
  strong = false,
  value,
}: {
  label: string;
  muted?: boolean;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/56 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{label}</p>
      <p
        className={[
          "mt-2 leading-7",
          strong ? "text-lg font-semibold text-slate-50" : "",
          muted ? "text-slate-400" : "text-slate-200",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function getBrowserShareUrl(reviewId: string) {
  if (typeof window === "undefined") {
    return getShareUrl(reviewId);
  }

  return getShareUrl(reviewId, window.location.origin);
}

async function copyText(value: string) {
  if (!navigator.clipboard) {
    throw new Error("Clipboard is unavailable.");
  }

  await navigator.clipboard.writeText(value);
}

async function downloadReviewImage(review: ShareReview) {
  const svg = createShareCardSvg(review);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = new window.Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = shareCardWidth;
    canvas.height = shareCardHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas is unavailable.");
    }

    context.drawImage(image, 0, 0);
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `kevixo-review-${review.reviewId.slice(0, 8)}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
