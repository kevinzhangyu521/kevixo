import { createClient } from "@supabase/supabase-js";
import type { DailyChallenge } from "@/lib/daily-challenge";
import type { DailyChallengeAttemptDraft } from "@/lib/daily-challenge-history";

export type DailyChallengeAttempt = {
  id: string;
  challengeId: string;
  challengeVersion: string;
  challengeDate: string;
  selectedOptionId: string;
  completedAt: string;
  challenge: DailyChallenge;
  feedbackHelpful?: boolean;
};

type AttemptRow = {
  id: string;
  challenge_id: string;
  challenge_version: string;
  challenge_date: string;
  selected_option_id: string;
  completed_at: string;
  challenge_snapshot: DailyChallenge;
};

const attemptsTable = "daily_challenge_attempts";
const feedbackTable = "daily_challenge_feedback";

export async function saveDailyChallengeAttempt(userId: string, draft: DailyChallengeAttemptDraft) {
  const supabase = getAdminClient();
  const payload = {
    user_id: userId,
    challenge_id: draft.challengeId,
    challenge_version: draft.challengeVersion,
    challenge_date: draft.challengeDate,
    selected_option_id: draft.selectedOptionId,
    completed_at: draft.completedAt,
    challenge_snapshot: draft.challengeSnapshot,
  };

  const { error } = await supabase.from(attemptsTable).upsert(payload, {
    onConflict: "user_id,challenge_date,challenge_id,challenge_version",
    ignoreDuplicates: true,
  });

  if (error) throw new Error(error.message);

  return findDailyChallengeAttempt(userId, draft.challengeDate, draft.challengeId, draft.challengeVersion);
}

export async function listDailyChallengeAttempts(userId: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from(attemptsTable)
    .select("id, challenge_id, challenge_version, challenge_date, selected_option_id, completed_at, challenge_snapshot")
    .eq("user_id", userId)
    .order("challenge_date", { ascending: false })
    .limit(60)
    .returns<AttemptRow[]>();
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function saveDailyChallengeFeedback(userId: string, attemptId: string, helpful: boolean) {
  const supabase = getAdminClient();
  const { data: attempt, error: attemptError } = await supabase
    .from(attemptsTable).select("id").eq("id", attemptId).eq("user_id", userId).maybeSingle();
  if (attemptError) throw new Error(attemptError.message);
  if (!attempt) throw new Error("Daily Challenge attempt was not found.");
  const { error } = await supabase.from(feedbackTable).upsert({ user_id: userId, attempt_id: attemptId, helpful }, { onConflict: "attempt_id" });
  if (error) throw new Error(error.message);
}

async function findDailyChallengeAttempt(userId: string, challengeDate: string, challengeId: string, challengeVersion: string) {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from(attemptsTable)
    .select("id, challenge_id, challenge_version, challenge_date, selected_option_id, completed_at, challenge_snapshot")
    .eq("user_id", userId).eq("challenge_date", challengeDate).eq("challenge_id", challengeId).eq("challenge_version", challengeVersion)
    .single<AttemptRow>();
  if (error) throw new Error(error.message);
  return fromRow(data);
}

function fromRow(row: AttemptRow): DailyChallengeAttempt {
  return { id: row.id, challengeId: row.challenge_id, challengeVersion: row.challenge_version, challengeDate: row.challenge_date, selectedOptionId: row.selected_option_id, completedAt: row.completed_at, challenge: row.challenge_snapshot };
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Daily Challenge history is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
