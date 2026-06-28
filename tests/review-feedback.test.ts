import {
  buildReviewFeedbackEntry,
  createReviewFeedbackStore,
  saveReviewFeedback,
  type ReviewFeedbackEntry,
} from "../lib/review-feedback";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function createStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

function testStoresFeedbackLocally() {
  const store = createReviewFeedbackStore(createStorage());
  const entry = buildReviewFeedbackEntry({
    usefulPart: "Better Decision",
    improvement: "Show one more example next time.",
    grade: "B-",
  });

  const saved = saveReviewFeedback(store, entry);

  assert(saved.length === 1, "Expected one saved feedback item.");
  assert(saved[0]?.usefulPart === "Better Decision", "Expected useful part to be saved.");
  assert(saved[0]?.improvement === "Show one more example next time.", "Expected improvement text.");
  assert(store.read()[0]?.grade === "B-", "Expected grade context to be saved.");
}

function testLimitsImprovementToFiveHundredCharacters() {
  const longText = "x".repeat(550);
  const entry = buildReviewFeedbackEntry({
    usefulPart: "Homework",
    improvement: longText,
    grade: "A-",
  });

  assert(entry.improvement.length === 500, "Expected improvement text to be capped at 500.");
}

function testIgnoresInvalidStoredFeedback() {
  const storage = createStorage();
  storage.setItem("kevixo.reviewFeedback.v1", JSON.stringify([{ usefulPart: "Homework" }]));
  const store = createReviewFeedbackStore(storage);

  assert(store.read().length === 0, "Expected invalid stored feedback to be ignored.");
}

function testWritesNewestFirst() {
  const store = createReviewFeedbackStore(createStorage());
  const first: ReviewFeedbackEntry = buildReviewFeedbackEntry({
    usefulPart: "Coach Note",
    improvement: "First",
    grade: "C+",
  });
  const second: ReviewFeedbackEntry = buildReviewFeedbackEntry({
    usefulPart: "Biggest Mistake",
    improvement: "Second",
    grade: "B",
  });

  saveReviewFeedback(store, first);
  const saved = saveReviewFeedback(store, second);

  assert(saved[0]?.improvement === "Second", "Expected newest feedback first.");
  assert(saved[1]?.improvement === "First", "Expected older feedback second.");
}

testStoresFeedbackLocally();
testLimitsImprovementToFiveHundredCharacters();
testIgnoresInvalidStoredFeedback();
testWritesNewestFirst();

console.log("review feedback tests passed");
