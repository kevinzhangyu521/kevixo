import { NextResponse } from "next/server";
import { getLeakTrackerForUser } from "@/lib/supabase-hand-reviews";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in to view your personal review patterns." }, { status: 401 });
  try { return NextResponse.json({ ok: true, tracker: await getLeakTrackerForUser(user.id) }); }
  catch { return NextResponse.json({ ok: false, error: "Your review patterns could not be loaded right now." }, { status: 500 }); }
}
