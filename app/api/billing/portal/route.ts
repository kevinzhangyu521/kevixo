import { NextResponse } from "next/server";
import { createPaddlePortalUrl } from "@/lib/paddle-admin";
import { getUserFromRequest } from "@/lib/supabase-auth";
import { parsePaddlePortalAction } from "@/lib/paddle-portal";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  let requestedAction: unknown;
  try {
    requestedAction = ((await request.json()) as { action?: unknown }).action;
  } catch {
    requestedAction = undefined;
  }

  const action = parsePaddlePortalAction(requestedAction);
  if (!action) {
    return NextResponse.json({ ok: false, error: "Unsupported billing portal action." }, { status: 400 });
  }

  try {
    return NextResponse.json({ ok: true, url: await createPaddlePortalUrl(user.id, action) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Billing portal could not be opened.",
      },
      { status: 500 },
    );
  }
}
