import { buildReviewNextSteps } from "../lib/review-next-steps";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const report = {
  betterDecision: "Fold the river unless you can identify enough natural bluffs.",
  homework: "Review three large river bets before checking results.",
  keyLesson: "Count realistic bluffs before calling a polar river bet.",
  nextTimeChecklist: [
    "Name the value hands before deciding.",
    "Count the missed draws that can bluff.",
    "Compare your bluff-catchers before calling.",
  ],
};

function testFirstReviewSetsAConcreteNextStepWithoutAFalsePattern() {
  const steps = buildReviewNextSteps({ report, reviewCount: 1 });

  assert(
    steps.nextDecision === report.betterDecision,
    "Expected the better decision to lead the next study move.",
  );
  assert(
    steps.nextCheck === report.nextTimeChecklist[0],
    "Expected the first checklist item to become the next-hand check.",
  );
  assert(
    steps.historyMessage.includes("first saved review") && steps.historyMessage.includes("two more"),
    "Expected first-review copy to explain the evidence threshold for patterns.",
  );
  assert(
    !steps.historyMessage.toLowerCase().includes("recurring"),
    "Expected a single review not to be described as a recurring pattern.",
  );
}

function testEstablishedPatternsOnlyAppearWhenProvidedByHistory() {
  const noPattern = buildReviewNextSteps({ report, reviewCount: 3 });
  const establishedPattern = buildReviewNextSteps({
    report,
    reviewCount: 3,
    patternInsight: "Bet sizing keeps showing up as a decision point.",
  });

  assert(
    noPattern.historyMessage.includes("three saved reviews") &&
      noPattern.historyMessage.includes("not enough consistent evidence") &&
      !noPattern.historyMessage.startsWith("A recurring decision theme"),
    "Expected three reviews without a supported insight not to claim a recurring problem.",
  );
  assert(
    establishedPattern.historyMessage.includes("recurring decision theme") &&
      establishedPattern.historyMessage.includes("Bet sizing"),
    "Expected a history-backed pattern to be identified as a recurring decision theme.",
  );
}

function testFallsBackWhenOptionalReportFieldsAreMissing() {
  const steps = buildReviewNextSteps({ report: {}, reviewCount: 0 });

  assert(steps.nextDecision.length > 0, "Expected a fallback next decision.");
  assert(steps.nextCheck.length > 0, "Expected a fallback next-hand check.");
  assert(steps.practice.length > 0, "Expected a fallback practice action.");
}
testFirstReviewSetsAConcreteNextStepWithoutAFalsePattern();
testEstablishedPatternsOnlyAppearWhenProvidedByHistory();
testFallsBackWhenOptionalReportFieldsAreMissing();

console.log("review next steps tests passed");
