import { createClient } from "@supabase/supabase-js";
import { getLeakTrackerForUser } from "@/lib/supabase-hand-reviews";
import { resolveTraining, type Training } from "@/lib/training";

export type TrainingDatabase = Pick<ReturnType<typeof createClient>, "from">;
export type TrainingWriteDatabase = {
  from: (table: string) => {
    upsert: (
      value: Record<string, unknown>,
      options: { onConflict: string; ignoreDuplicates: boolean },
    ) => Promise<{ error: unknown | null }>;
    update: (value: Record<string, unknown>) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{ data: unknown; error: unknown | null }>;
          };
        };
      };
    };
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown | null }>;
        };
      };
    };
  };
};type LeakTracker = Awaited<ReturnType<typeof getLeakTrackerForUser>>;
export type TrainingRecord = {
  id: string;
  training_key: string;
  source: Training["source"];
  review_id: string | null;
  title: string;
  action: string;
  completed_at: string;
  created_at: string;
  helpful?: boolean | null;
};
type TrainingDependencies = {
  db: TrainingDatabase;
  getLeakTracker: (userId: string) => Promise<LeakTracker>;
};
type TrainingData = { training: Training; trainingKey?: string; records: TrainingRecord[] };
type CompletionDependencies = {
  getTraining: (userId: string) => Promise<TrainingData>;
  saveTrainingRecord: (userId: string, trainingKey: string, training: Training) => Promise<TrainingRecord>;
};

export class TrainingValidationError extends Error {}

export function trainingKeyFor(training: Training) {
  return [training.source, training.reviewId ?? "none", training.title].join("|");
}

export function buildHandReviewQuery(db: TrainingDatabase, userId: string) {
  return db
    .from("hand_reviews")
    .select("review_id,created_at,review_source,review_json")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export function buildTrainingRecordsQuery(db: TrainingDatabase, userId: string) {
  return db
    .from("training_records")
    .select("id,training_key,source,review_id,title,action,completed_at,created_at,helpful")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function getTrainingRecordsForUser(db: TrainingDatabase, userId: string) {
  const { data, error } = await buildTrainingRecordsQuery(db, userId);
  if (error) throw new Error("Training records could not be loaded.");
  return (data ?? []) as TrainingRecord[];
}

export async function getTrainingWithDependencies(
  userId: string,
  { db, getLeakTracker }: TrainingDependencies,
): Promise<TrainingData> {
  const [{ data: rows, error: reviewError }, records, tracker] = await Promise.all([
    buildHandReviewQuery(db, userId),
    getTrainingRecordsForUser(db, userId),
    getLeakTracker(userId),
  ]);

  if (reviewError) throw new Error("Reviews could not be loaded.");

  const reviews = (rows ?? []).map(
    (review: {
      review_id: string;
      created_at: string;
      review_source: "hand_history" | "demo" | null;
      review_json: { homework?: string; betterDecision?: string };
    }) => ({
      reviewId: review.review_id,
      createdAt: review.created_at,
      source: review.review_source,
      lesson: review.review_json?.homework || review.review_json?.betterDecision,
    }),
  );

  const training = resolveTraining(reviews, tracker.patterns);
  return { training, trainingKey: trainingKeyFor(training), records };
}

export async function completeTrainingWithDependencies(
  userId: string,
  trainingKey: string,
  { getTraining, saveTrainingRecord }: CompletionDependencies,
) {
  const { training, records } = await getTraining(userId);
  const existingRecord = records.find((record) => record.training_key === trainingKey);
  if (existingRecord) return existingRecord;

  if (trainingKey !== trainingKeyFor(training)) {
    throw new TrainingValidationError("Choose a valid training item.");
  }

  return saveTrainingRecord(userId, trainingKey, training);
}

export async function saveTrainingRecordForUser(
  db: TrainingWriteDatabase,
  userId: string,
  trainingKey: string,
  training: Training,
) {
  const { error: writeError } = await db.from("training_records").upsert(
    {
      user_id: userId,
      training_key: trainingKey,
      source: training.source,
      review_id: training.reviewId ?? null,
      title: training.title,
      action: training.action,
    },
    { onConflict: "user_id,training_key", ignoreDuplicates: true },
  );
  if (writeError) throw new Error("Training could not be saved.");

  const { data, error: readError } = await db
    .from("training_records")
    .select("id,training_key,source,review_id,title,action,completed_at,created_at,helpful")
    .eq("user_id", userId)
    .eq("training_key", trainingKey)
    .maybeSingle();
  if (readError || !data) throw new Error("Training could not be saved.");
  return data as TrainingRecord;
}

function getTrainingDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Training is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getTrainingForUser(userId: string) {
  const db = getTrainingDatabase();
  return getTrainingWithDependencies(userId, { db, getLeakTracker: getLeakTrackerForUser });
}


type FeedbackDependencies = {
  findRecord: (userId: string, trainingKey: string) => Promise<TrainingRecord | null>;
  saveFeedback: (userId: string, recordId: string, helpful: boolean) => Promise<TrainingRecord>;
};

export async function saveTrainingFeedbackWithDependencies(
  userId: string,
  trainingKey: string,
  helpful: boolean,
  { findRecord, saveFeedback }: FeedbackDependencies,
) {
  const record = await findRecord(userId, trainingKey);
  if (!record) throw new TrainingValidationError("Choose a training item from your history.");
  return saveFeedback(userId, record.id, helpful);
}

export async function saveTrainingFeedbackForUser(
  db: TrainingWriteDatabase,
  userId: string,
  trainingKey: string,
  helpful: boolean,
) {
  const { data: record, error: findError } = await db
    .from("training_records")
    .select("id,training_key,source,review_id,title,action,completed_at,created_at,helpful")
    .eq("user_id", userId)
    .eq("training_key", trainingKey)
    .maybeSingle();
  if (findError) throw new Error("Training feedback could not be saved.");
  if (!record) throw new TrainingValidationError("Choose a training item from your history.");

  const { data, error } = await db
    .from("training_records")
    .update({ helpful })
    .eq("id", (record as TrainingRecord).id)
    .eq("user_id", userId)
    .select("id,training_key,source,review_id,title,action,completed_at,created_at,helpful")
    .single();
  if (error || !data) throw new Error("Training feedback could not be saved.");
  return data as TrainingRecord;
}

export async function completeTrainingForUser(userId: string, trainingKey: string) {
  const db = getTrainingDatabase();
  return completeTrainingWithDependencies(userId, trainingKey, {
    getTraining: getTrainingForUser,
    saveTrainingRecord: (ownerId, key, training) => saveTrainingRecordForUser(db as unknown as TrainingWriteDatabase, ownerId, key, training),
  });
}
export async function saveTrainingFeedback(userId: string, trainingKey: string, helpful: boolean) {
  const db = getTrainingDatabase();
  return saveTrainingFeedbackWithDependencies(userId, trainingKey, helpful, {
    findRecord: async (ownerId, key) => {
      const { data, error } = await db
        .from("training_records")
        .select("id,training_key,source,review_id,title,action,completed_at,created_at,helpful")
        .eq("user_id", ownerId)
        .eq("training_key", key)
        .maybeSingle();
      if (error) throw new Error("Training feedback could not be saved.");
      return data as TrainingRecord | null;
    },
    saveFeedback: (ownerId, recordId, value) => saveTrainingFeedbackForUser(
      db as unknown as TrainingWriteDatabase,
      ownerId,
      trainingKey,
      value,
    ),
  });
}