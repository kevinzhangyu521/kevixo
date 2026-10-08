import { createTrainingPut } from "../app/api/training/route";
import { saveTrainingFeedbackWithDependencies, TrainingValidationError, type TrainingRecord } from "../lib/training-server";

const record: TrainingRecord = { id: "record-a", training_key: "key-a", source: "general", review_id: null, title: "General practice", action: "Practice", completed_at: "2026-01-01T00:00:00Z", created_at: "2026-01-01T00:00:00Z" };
function assert(value: unknown, message: string) { if (!value) throw new Error(message); }
async function expectValidation(operation: () => Promise<unknown>) { try { await operation(); throw new Error("Expected validation failure"); } catch (error) { if (!(error instanceof TrainingValidationError)) throw error; } }

async function run() {
  const values: boolean[] = [];
  const save = (userId: string, key: string, helpful: boolean) => saveTrainingFeedbackWithDependencies(userId, key, helpful, {
    findRecord: async (ownerId, trainingKey) => ownerId === "user-a" && trainingKey === "key-a" ? record : null,
    saveFeedback: async (ownerId, recordId, value) => { assert(ownerId === "user-a" && recordId === record.id, "feedback owner scope"); values.push(value); return { ...record, helpful: value } as TrainingRecord; },
  });
  const yes = await save("user-a", "key-a", true); const no = await save("user-a", "key-a", false);
  assert(yes.helpful === true && no.helpful === false && values.length === 2, "Yes updates to No without another record");
  await expectValidation(() => save("user-b", "key-a", true));
  await expectValidation(() => save("user-a", "forged", true));
  const put = createTrainingPut({ getUser: async () => ({ id: "user-a" }), saveFeedback: save });
  let response = await put(new Request("http://x", { method: "PUT", body: JSON.stringify({ trainingKey: "key-a", helpful: true }) })); assert(response.status === 200, "valid feedback");
  response = await put(new Request("http://x", { method: "PUT", body: JSON.stringify({ trainingKey: "key-a", helpful: "yes" }) })); assert(response.status === 400, "invalid feedback");
  response = await createTrainingPut({ getUser: async () => null, saveFeedback: save })(new Request("http://x", { method: "PUT", body: "{}" })); assert(response.status === 401, "guest rejected");
  response = await createTrainingPut({ getUser: async () => ({ id: "user-a" }), saveFeedback: async () => { throw new Error("db details"); } })(new Request("http://x", { method: "PUT", body: JSON.stringify({ trainingKey: "key-a", helpful: true }) })); const payload = await response.json(); assert(response.status === 500 && !JSON.stringify(payload).includes("db details"), "safe failure");
  console.log("training feedback tests passed");
}
void run();