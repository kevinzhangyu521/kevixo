import { NextResponse } from "next/server";
import { createPaddlePortalUrl } from "@/lib/paddle-admin";
import { getUserFromRequest } from "@/lib/supabase-auth";

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, url: await createPaddlePortalUrl(user.id) });
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
