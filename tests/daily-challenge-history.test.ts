import {
  buildDailyChallengeAttempt,
  type DailyChallengeAttemptInput,
} from "../lib/daily-challenge-history";
import { getDailyChallenge, getDailyChallengeByIdAndVersion } from "../lib/daily-challenge";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const challengeDate = "2026-10-08";
const scheduledChallenge = getDailyChallenge(new Date(`${challengeDate}T12:00:00.000Z`));

function testBuildsAnImmutableServerChallengeSnapshot() {
  const input: DailyChallengeAttemptInput = {
    challengeId: scheduledChallenge.id,
    challengeVersion: scheduledChallenge.version,
    challengeDate,
    selectedOptionId: scheduledChallenge.bestOptionId,
  };

  const attempt = buildDailyChallengeAttempt(input, new Date("2026-10-08T12:00:00.000Z"));

  assert(attempt.challengeSnapshot.id === input.challengeId, "Expected the server challenge id in the snapshot.");
  assert(attempt.challengeSnapshot.version === "1", "Expected an immutable challenge version.");
  assert(
    attempt.challengeSnapshot.bestOptionId === scheduledChallenge.bestOptionId,
    "Expected the server-selected correct answer.",
  );
  assert(attempt.completedAt === "2026-10-08T12:00:00.000Z", "Expected the server completion time.");
}

function testRejectsUnknownVersionsAndOptions() {
  assert(
    getDailyChallengeByIdAndVersion(scheduledChallenge.id, "999") === null,
    "Expected unknown challenge versions to be rejected.",
  );

  let rejected = false;
  try {
    buildDailyChallengeAttempt({
      challengeId: scheduledChallenge.id,
      challengeVersion: "1",
      challengeDate,
      selectedOptionId: "invented-action",
    });
  } catch {
    rejected = true;
  }

  assert(rejected, "Expected unknown options to be rejected.");
}

function testRejectsAChallengeForTheWrongDate() {
  let rejected = false;
  try {
    buildDailyChallengeAttempt({
      challengeId: scheduledChallenge.id,
      challengeVersion: "1",
      challengeDate: "2026-10-09",
      selectedOptionId: scheduledChallenge.bestOptionId,
    });
  } catch {
    rejected = true;
  }

  assert(rejected, "Expected the server to reject a challenge id that does not match its date.");
}

testBuildsAnImmutableServerChallengeSnapshot();
testRejectsUnknownVersionsAndOptions();
testRejectsAChallengeForTheWrongDate();

console.log("daily challenge history tests passed");