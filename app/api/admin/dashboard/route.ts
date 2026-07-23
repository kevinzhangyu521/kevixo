import { NextResponse } from "next/server";
import { getFounderDashboardData } from "@/lib/admin-dashboard";
import { authorizeAdminUser } from "@/lib/admin-users";

export async function GET(request: Request) {
  const authError = await authorizeAdminUser(request);

  if (!authError.ok) {
    return NextResponse.json(
      { ok: false, error: authError.error },
      { status: authError.status },
    );
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
