import { NextResponse } from "next/server";
import { getFounderDashboardData } from "@/lib/admin-dashboard";

export async function GET(request: Request) {
  const authError = authorizeAdminRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const dashboard = await getFounderDashboardData();

    return NextResponse.json({ ok: true, dashboard });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Dashboard could not be loaded.",
      },
      { status: 500 },
    );
  }
}

function authorizeAdminRequest(request: Request) {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_FEEDBACK_KEY;
  const passcode = request.headers.get("x-admin-passcode");

  if (!adminKey || passcode !== adminKey) {
    return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  }

  return null;
}
