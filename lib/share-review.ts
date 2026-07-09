import type { CoachingReport } from "@/services/ai";

export const shareCardWidth = 1200;
export const shareCardHeight = 630;

export type ShareReview = Pick<
  CoachingReport,
  | "reviewId"
  | "grade"
  | "confidence"
  | "biggestMistake"
  | "betterDecision"
  | "coachNote"
  | "keyLesson"
  | "homework"
  | "difficulty"
>;

export function toShareReview(report: CoachingReport): ShareReview {
  return {
    reviewId: report.reviewId,
    grade: report.grade,
    confidence: report.confidence,
    biggestMistake: report.biggestMistake,
    betterDecision: report.betterDecision,
    coachNote: shortenText(report.coachNote, 150),
    keyLesson: report.keyLesson,
    homework: report.homework,
    difficulty: report.difficulty,
  };
}

export function getSharePath(reviewId: string) {
  return `/share/${encodeURIComponent(reviewId)}`;
}

export function getShareUrl(reviewId: string, origin = "https://www.kevixo.com") {
  return `${origin}${getSharePath(reviewId)}`;
}

export function createShareCardSvg(review: ShareReview) {
  const title = "Reviewed by Kevixo AI";
  const mistakeLines = wrapText(review.biggestMistake, 50, 2);
  const decisionLines = wrapText(review.betterDecision, 52, 2);
  const noteLines = wrapText(review.coachNote, 64, 2);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${shareCardWidth}" height="${shareCardHeight}" viewBox="0 0 ${shareCardWidth} ${shareCardHeight}">
  <rect width="${shareCardWidth}" height="${shareCardHeight}" fill="#020617"/>
  <rect x="52" y="52" width="1096" height="526" rx="32" fill="#07111f" stroke="#1e293b" stroke-width="2"/>
  <rect x="84" y="84" width="54" height="54" rx="15" fill="#38BDF8"/>
  <path d="M104 100h10v16l18-16h15l-23 21 25 30h-16l-19-23v23h-10z" fill="#020617"/>
  <text x="154" y="112" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700">Kevixo</text>
  <text x="154" y="140" fill="#94A3B8" font-family="Inter, Arial, sans-serif" font-size="16">${escapeXml(title)}</text>

  <rect x="84" y="182" width="220" height="150" rx="24" fill="#020617" stroke="#1e293b"/>
  <text x="108" y="222" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">GRADE</text>
  <text x="108" y="295" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="78" font-weight="800">${escapeXml(review.grade)}</text>

  <rect x="328" y="182" width="220" height="150" rx="24" fill="#020617" stroke="#1e293b"/>
  <text x="352" y="222" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">CONFIDENCE</text>
  <text x="352" y="286" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="800">${Math.round(review.confidence)}%</text>
  <rect x="352" y="306" width="148" height="8" rx="4" fill="#0f172a"/>
  <rect x="352" y="306" width="${Math.round(148 * Math.max(0, Math.min(100, review.confidence)) / 100)}" height="8" rx="4" fill="#38BDF8"/>

  <rect x="572" y="182" width="492" height="150" rx="24" fill="#020617" stroke="#1e293b"/>
  <text x="596" y="222" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">BIGGEST MISTAKE</text>
  ${mistakeLines.map((line, index) => `<text x="596" y="${262 + index * 31}" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="700">${escapeXml(line)}</text>`).join("")}

  <rect x="84" y="356" width="480" height="138" rx="24" fill="#020617" stroke="#1e293b"/>
  <text x="108" y="396" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">BETTER DECISION</text>
  ${decisionLines.map((line, index) => `<text x="108" y="${435 + index * 29}" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(line)}</text>`).join("")}

  <rect x="588" y="356" width="476" height="138" rx="24" fill="#020617" stroke="#1e293b"/>
  <text x="612" y="396" fill="#38BDF8" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" letter-spacing="2">COACH NOTE</text>
  ${noteLines.map((line, index) => `<text x="612" y="${433 + index * 27}" fill="#CBD5E1" font-family="Inter, Arial, sans-serif" font-size="21">${escapeXml(line)}</text>`).join("")}

  <text x="84" y="540" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="18">Analyze your own hand at kevixo.com</text>
  <text x="905" y="540" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="16">Review ${escapeXml(review.reviewId.slice(0, 8))}</text>
</svg>`;
}

function shortenText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function wrapText(value: string, maxCharacters: number, maxLines: number) {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length > maxCharacters && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  if (lines.length > 0 && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = shortenText(lines[lines.length - 1], maxCharacters);
  }

  return lines;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
