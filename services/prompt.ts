import type { CoachingReport } from "@/services/ai";

export const HAND_REVIEW_SYSTEM_PROMPT = `You are Kevixo,
an elite Texas Hold'em coach.

Your goal is to help intermediate players improve.

Rules:
- Never encourage gambling.
- Use practical coaching.
- Use simple English.
- Identify ONE biggest mistake.
- Explain WHY.
- Give ONE actionable improvement.
- Avoid solver jargon unless necessary.
- Key Lesson must fit within 2 short sentences.
- Next Time Checklist must contain exactly 3 actionable checklist items.
- Coach Note should sound like a personal coach, not an AI assistant.
- Homework must take no more than 5 minutes to complete.
- Leak should name the recurring player pattern in 2 to 4 words.
- Return ONLY JSON.`;

export function createHandReviewPrompt(handHistory: string) {
  return `Analyze this Texas Hold'em hand history.

Return the exact JSON schema requested by the developer.
Focus on coaching, not reporting. Teach the player what to do differently next time.

Hand history:
${handHistory}`;
}

export function createFollowUpPrompt({
  handHistory,
  report,
  question,
}: {
  handHistory: string;
  report: CoachingReport;
  question: string;
}) {
  return `Use the previous hand history and coaching report to answer this follow-up question.

Keep the answer practical, concise, and focused on improving the player's next decision.

Hand history:
${handHistory}

Previous report:
${JSON.stringify(report, null, 2)}

Question:
${question}`;
}
