import type { Training } from "../lib/training";
import {
  completeTrainingWithDependencies,
  saveTrainingRecordForUser,
  trainingKeyFor,
  TrainingValidationError,
  type TrainingRecord,
} from "../lib/training-server";
import { createTrainingPost } from "../app/api/training/route";

const currentTraining: Training = {
  source: "latest_review",
  title: "Your latest review",
  reason: "Based on your latest review.",
  action: "Check your river plan.",
  reviewId: "review-a",
};
const currentKey = trainingKeyFor(currentTraining);
const initialRecord: TrainingRecord = {
  id: "record-old", training_key: "latest_review|review-old|Your latest review", source: "latest_review",
  review_id: "review-old", title: "Your latest review", action: "Old action", completed_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z",
};

function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
async function expectFailure(operation: () => Promise<unknown>, type: new (...args: never[]) => Error) {
  try { await operation(); throw new Error("Expected failure"); }
  catch (error) { if (!(error instanceof type)) throw error; }
}

async function run() {
  const saved: { userId: string; key: string }[] = [];
  const complete = (userId: string, key: string) => completeTrainingWithDependencies(userId, key, {
    getTraining: async (ownerId) => {
      assert(ownerId === userId, "Training lookup used another user");
      if (ownerId !== "user-a") {
        return {
          training: { ...currentTraining, reviewId: "review-b" },
          records: [],
        };
      }
      return { training: currentTraining, records: [initialRecord] };
    },
    saveTrainingRecord: async (ownerId, trainingKey, training) => {
      saved.push({ userId: ownerId, key: trainingKey });
      return { id: `record-${ownerId}`, training_key: trainingKey, source: training.source, review_id: training.reviewId ?? null, title: training.title, action: training.action, completed_at: "2026-02-01T00:00:00Z", created_at: "2026-02-01T00:00:00Z" };
    },
  });

  const first = await complete("user-a", currentKey);
  assert(first.training_key === currentKey && saved[0]?.userId === "user-a", "valid completion");
  const old = await complete("user-a", initialRecord.training_key);
  assert(old.id === initialRecord.id && saved.length === 1, "old history survives recommendation changes");
  await expectFailure(() => complete("user-a", "latest_review|review-b|Forged"), TrainingValidationError);
  await expectFailure(() => complete("user-b", currentKey), TrainingValidationError);

  const records = new Map<string, TrainingRecord>();
  const database = {
    from: () => ({
      upsert: async (payload: { user_id: string; training_key: string }) => {
        const key = `${payload.user_id}:${payload.training_key}`;
        if (!records.has(key)) records.set(key, { id: key, training_key: payload.training_key, source: currentTraining.source, review_id: currentTraining.reviewId ?? null, title: currentTraining.title, action: currentTraining.action, completed_at: "server-time", created_at: "server-time" });
        return { error: null };
      },
      select: () => ({ eq: (_column: string, value: string) => ({ eq: (_nextColumn: string, key: string) => ({ maybeSingle: async () => ({ data: records.get(`${value}:${key}`) ?? null, error: null }) }) }) }),
    }),
  };
  await Promise.all([
    saveTrainingRecordForUser(database as unknown as import("../lib/training-server").TrainingWriteDatabase, "user-a", currentKey, currentTraining),
    saveTrainingRecordForUser(database as unknown as import("../lib/training-server").TrainingWriteDatabase, "user-a", currentKey, currentTraining),
  ]);
  assert(records.size === 1, "unique user_id/training_key prevents concurrent duplicates");

  const failedWriteDatabase = {
    from: () => ({
      upsert: async () => ({ error: { message: "database details" } }),
      select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
    }),
  };
  await expectFailure(
    () => saveTrainingRecordForUser(
      failedWriteDatabase as unknown as import("../lib/training-server").TrainingWriteDatabase,
      "user-a",
      currentKey,
      currentTraining,
    ),
    Error,
  );

  const post = createTrainingPost({ getUser: async () => ({ id: "user-a" }), completeTraining: complete });
  let response = await post(new Request("http://x/api/training", { method: "POST", body: JSON.stringify({ trainingKey: currentKey }) }));
  assert(response.status === 200, "authenticated POST");
  response = await post(new Request("http://x/api/training", { method: "POST", body: JSON.stringify({ trainingKey: currentKey, reviewId: "forged" }) }));
  assert(response.status === 400, "forged fields rejected");
  response = await createTrainingPost({ getUser: async () => null, completeTraining: complete })(new Request("http://x", { method: "POST", body: "{}" }));
  assert(response.status === 401, "guest rejected");
  response = await createTrainingPost({ getUser: async () => ({ id: "user-a" }), completeTraining: async () => { throw new Error("database internals"); } })(new Request("http://x", { method: "POST", body: JSON.stringify({ trainingKey: currentKey }) }));
  const payload = await response.json();
  assert(response.status === 500 && !JSON.stringify(payload).includes("database internals"), "safe write failure");
  console.log("training completion tests passed");
}

void run();