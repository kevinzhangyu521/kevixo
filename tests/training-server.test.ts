import {
  buildHandReviewQuery,
  getTrainingRecordsForUser,
  getTrainingWithDependencies,
  type TrainingDatabase,
} from "../lib/training-server";

type QueryResult = { data: unknown[] | null; error: unknown };

function createDatabase(result: QueryResult) {
  const queried: { table: string; column: string; value: string }[] = [];
  const database = {
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: string) => {
          queried.push({ table, column, value });
          return { order: () => Promise.resolve(result) };
        },
      }),
    }),
  };
  return {
    database,
    assertScope: (table: string, userId: string) => {
      const matchingQuery = queried.find(
        (query) => query.table === table && query.column === "user_id" && query.value === userId,
      );
      if (!matchingQuery) throw new Error(`Expected ${table} user_id filter for ${userId}`);
    },
  };
}

function verifyHandReviewScope(userId: string) {
  const query = createDatabase({ data: [], error: null });
  buildHandReviewQuery(query.database as unknown as TrainingDatabase, userId);
  query.assertScope("hand_reviews", userId);
}

async function verifyTrainingRecordScope(userId: string) {
  const query = createDatabase({ data: [], error: null });
  await getTrainingRecordsForUser(query.database as unknown as TrainingDatabase, userId);
  query.assertScope("training_records", userId);
}

async function verifyTrainingRecordFailure() {
  const query = createDatabase({ data: null, error: { message: "database details" } });
  await expectFailure(
    () => getTrainingRecordsForUser(query.database as unknown as TrainingDatabase, "user-a"),
    "Training records could not be loaded.",
  );
}

async function expectFailure(operation: () => Promise<unknown>, message: string) {
  try {
    await operation();
    throw new Error("Expected operation to fail");
  } catch (error) {
    if (!(error instanceof Error) || error.message !== message) throw error;
  }
}

async function verifyLeakTrackerScope(userId: string) {
  const query = createDatabase({ data: [], error: null });
  let leakTrackerUserId = "";
  await getTrainingWithDependencies(userId, {
    db: query.database as unknown as TrainingDatabase,
    getLeakTracker: async (receivedUserId) => {
      leakTrackerUserId = receivedUserId;
      return { patterns: [] } as never;
    },
  });
  if (leakTrackerUserId !== userId) {
    throw new Error(`Expected Leak Tracker user ${userId}, got ${leakTrackerUserId}`);
  }
}

async function verifyLeakTrackerFailure() {
  const query = createDatabase({ data: [], error: null });
  await expectFailure(
    () => getTrainingWithDependencies("user-a", {
      db: query.database as unknown as TrainingDatabase,
      getLeakTracker: async () => { throw new Error("Leak Tracker could not be loaded."); },
    }),
    "Leak Tracker could not be loaded.",
  );
}

async function run() {
  verifyHandReviewScope("user-a");
  verifyHandReviewScope("user-b");
  await verifyTrainingRecordScope("user-a");
  await verifyTrainingRecordScope("user-b");
  await verifyTrainingRecordFailure();
  await verifyLeakTrackerScope("user-a");
  await verifyLeakTrackerScope("user-b");
  await verifyLeakTrackerFailure();
  console.log("training service query scope and failure tests passed");
}

void run();