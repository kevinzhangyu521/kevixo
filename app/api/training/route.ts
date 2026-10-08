import { NextResponse } from "next/server";
import { getUserFromRequest, type KevixoUser } from "@/lib/supabase-auth";
import {
  completeTrainingForUser,
  getTrainingForUser,
  saveTrainingFeedback,
  TrainingValidationError,
  type TrainingRecord,
} from "@/lib/training-server";

type GetDependencies = { getUser: (request: Request) => Promise<KevixoUser | null>; getTraining: (userId: string) => Promise<unknown> };
type PostDependencies = { getUser: (request: Request) => Promise<KevixoUser | null>; completeTraining: (userId: string, trainingKey: string) => Promise<TrainingRecord> };
type FeedbackDependencies = { getUser: (request: Request) => Promise<KevixoUser | null>; saveFeedback: (userId: string, trainingKey: string, helpful: boolean) => Promise<TrainingRecord> };

export function createTrainingGet(deps: GetDependencies) { return async function GET(request: Request) { const user = await deps.getUser(request); if (!user) return NextResponse.json({ ok: false, error: "Please sign in to view your training." }, { status: 401 }); try { return NextResponse.json({ ok: true, ...await deps.getTraining(user.id) as object }); } catch { return NextResponse.json({ ok: false, error: "Training could not be loaded right now." }, { status: 500 }); } }; }
export function createTrainingPost(deps: PostDependencies) { return async function POST(request: Request) { const user = await deps.getUser(request); if (!user) return NextResponse.json({ ok: false, error: "Please sign in to save your training." }, { status: 401 }); try { const body = await request.json() as Record<string, unknown>; if (Object.keys(body).length !== 1 || typeof body.trainingKey !== "string" || !body.trainingKey.trim()) throw new TrainingValidationError("Choose a valid training item."); return NextResponse.json({ ok: true, record: await deps.completeTraining(user.id, body.trainingKey) }); } catch (error) { if (error instanceof TrainingValidationError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 }); return NextResponse.json({ ok: false, error: "Training could not be saved right now." }, { status: 500 }); } }; }
export function createTrainingPut(deps: FeedbackDependencies) { return async function PUT(request: Request) { const user = await deps.getUser(request); if (!user) return NextResponse.json({ ok: false, error: "Please sign in to save feedback." }, { status: 401 }); try { const body = await request.json() as Record<string, unknown>; if (Object.keys(body).length !== 2 || typeof body.trainingKey !== "string" || !body.trainingKey.trim() || typeof body.helpful !== "boolean") throw new TrainingValidationError("Choose Yes or No for a training item from your history."); return NextResponse.json({ ok: true, record: await deps.saveFeedback(user.id, body.trainingKey, body.helpful) }); } catch (error) { if (error instanceof TrainingValidationError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 }); return NextResponse.json({ ok: false, error: "Training feedback could not be saved right now." }, { status: 500 }); } }; }
export const GET = createTrainingGet({ getUser: getUserFromRequest, getTraining: getTrainingForUser });
export const POST = createTrainingPost({ getUser: getUserFromRequest, completeTraining: completeTrainingForUser });
export const PUT = createTrainingPut({ getUser: getUserFromRequest, saveFeedback: saveTrainingFeedback });