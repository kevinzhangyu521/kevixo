import { getDailyChallenge, getDailyChallengeByIdAndVersion, type DailyChallenge } from "@/lib/daily-challenge";

export type DailyChallengeAttemptInput = {
  challengeId: string;
  challengeVersion: string;
  challengeDate: string;
  selectedOptionId: string;
};

export type DailyChallengeAttemptDraft = {
  challengeId: string;
  challengeVersion: string;
  challengeDate: string;
  selectedOptionId: string;
  completedAt: string;
  challengeSnapshot: DailyChallenge;
};

export function buildDailyChallengeAttempt(
  input: DailyChallengeAttemptInput,
  completedAt = new Date(),
): DailyChallengeAttemptDraft {
  const challenge = getDailyChallengeByIdAndVersion(input.challengeId, input.challengeVersion);

  if (!challenge) {
    throw new Error("This Daily Challenge is no longer available.");
  }

  const scheduledChallenge = getDailyChallenge(new Date(`${input.challengeDate}T12:00:00.000Z`));

  if (scheduledChallenge.id !== challenge.id || scheduledChallenge.version !== challenge.version) {
    throw new Error("This Daily Challenge does not match its scheduled date.");
  }

  if (!challenge.options.some((option) => option.id === input.selectedOptionId)) {
    throw new Error("Please choose one of the available actions.");
  }

  return {
    challengeId: challenge.id,
    challengeVersion: challenge.version,
    challengeDate: input.challengeDate,
    selectedOptionId: input.selectedOptionId,
    completedAt: completedAt.toISOString(),
    challengeSnapshot: {
      ...challenge,
      dateKey: input.challengeDate,
    },
  };
}