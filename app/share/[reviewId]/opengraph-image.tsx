import { ImageResponse } from "next/og";
import { findHandReviewByReviewId } from "@/lib/supabase-hand-reviews";
import { shareCardHeight, shareCardWidth, toShareReview } from "@/lib/share-review";

export const size = {
  width: shareCardWidth,
  height: shareCardHeight,
};

export const contentType = "image/png";

type OpenGraphImageProps = {
  params: Promise<{ reviewId: string }>;
};

export default async function Image({ params }: OpenGraphImageProps) {
  const { reviewId } = await params;
  const review = await findPublicReview(reviewId);

  if (!review) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#020617",
            color: "#F8FAFC",
            fontSize: 54,
            fontWeight: 800,
          }}
        >
          Review not available.
        </div>
      ),
      size,
    );
  }

  const report = toShareReview(review.report);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#020617",
          color: "#F8FAFC",
          fontFamily: "Inter, Arial, sans-serif",
          padding: 52,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: "2px solid #1e293b",
            borderRadius: 32,
            background: "#07111f",
            padding: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 15,
                  background: "#38BDF8",
                  color: "#020617",
                  fontSize: 34,
                  fontWeight: 900,
                }}
              >
                K
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 27, fontWeight: 800 }}>Kevixo</div>
                <div style={{ color: "#94A3B8", fontSize: 17 }}>Reviewed by Kevixo AI</div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                border: "1px solid rgba(56,189,248,0.42)",
                borderRadius: 22,
                background: "rgba(56,189,248,0.12)",
                color: "#38BDF8",
                padding: "20px 30px",
                fontSize: 78,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {report.grade}
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
            <Panel label="Confidence" value={`${Math.round(report.confidence)}%`} compact />
            <Panel label="Biggest Mistake" value={report.biggestMistake} />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
            <Panel label="Better Decision" value={report.betterDecision} />
            <Panel label="Coach Note" value={report.coachNote} muted />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
              color: "#64748B",
              fontSize: 19,
            }}
          >
            <span>Analyze your own hand at kevixo.com</span>
            <span>Review {report.reviewId.slice(0, 8)}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function Panel({
  compact = false,
  label,
  muted = false,
  value,
}: {
  compact?: boolean;
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div
      style={{
        flex: compact ? "0 0 220px" : 1,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #1e293b",
        borderRadius: 24,
        background: "#020617",
        padding: 24,
        minHeight: 128,
      }}
    >
      <div
        style={{
          color: "#38BDF8",
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 16,
          color: muted ? "#CBD5E1" : "#F8FAFC",
          fontSize: compact ? 54 : 27,
          fontWeight: compact ? 900 : 750,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

async function findPublicReview(reviewId: string) {
  if (!reviewId || reviewId.length > 160) {
    return null;
  }

  try {
    return await findHandReviewByReviewId(reviewId);
  } catch {
    return null;
  }
}
