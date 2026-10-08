import { createTrainingGet } from "../app/api/training/route";
import { getTrainingWithDependencies, type TrainingDatabase } from "../lib/training-server";

function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}

function createDatabase() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
      }),
    }),
  };
}

async function run() {
  let seen = "";
  const ok = createTrainingGet({
    getUser: async () => ({ id: "user-a" }),
    getTraining: async (id) => {
      seen = id;
      return { training: { source: "general" }, records: [{ id: "safe" }] };
    },
  });
  let response = await ok(new Request("http://x/api/training?userId=user-b"));
  let payload = await response.json();
  assert(response.status === 200 && seen === "user-a" && payload.records[0].id === "safe", "authenticated response");

  const isolated = createTrainingGet({
    getUser: async () => ({ id: "user-b" }),
    getTraining: async (id) => ({ training: { source: "general" }, records: [{ id }] }),
  });
  payload = await (await isolated(new Request("http://x/api/training?userId=user-a"))).json();
  assert(payload.records[0].id === "user-b", "isolation");

  response = await createTrainingGet({
    getUser: async () => ({ id: "user-a" }),
    getTraining: (id) => getTrainingWithDependencies(id, {
      db: createDatabase() as unknown as TrainingDatabase,
      getLeakTracker: async () => { throw new Error("leak source details"); },
    }),
  })(new Request("http://x"));
  payload = await response.json();
  assert(response.status === 500 && !JSON.stringify(payload).includes("leak source details"), "safe Leak Tracker error");

  response = await createTrainingGet({
    getUser: async () => null,
    getTraining: async () => ({}),
  })(new Request("http://x"));
  assert(response.status === 401, "401");
  console.log("training route tests passed");
}

void run();