import { NextResponse } from "next/server";
import {
  createUtcDateRange,
  getFounderDashboardData,
  getLastThirtyDayRange,
  getPreviousThirtyDayRange,
} from "@/lib/admin-dashboard";
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
    const range = getDashboardRange(new URL(request.url).searchParams);

    if (!range) {
      return NextResponse.json(
        { ok: false, error: "Choose a valid UTC date range." },
        { status: 400 },
      );
    }

    const dashboard = await getFounderDashboardData(range);

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

function getDashboardRange(searchParams: URLSearchParams) {
  const now = new Date();
  const preset = searchParams.get("range") ?? "last-30";

  if (preset === "last-30") {
    return getLastThirtyDayRange(now);
  }

  if (preset === "previous-30") {
    return getPreviousThirtyDayRange(now);
  }

  if (preset === "custom") {
    return createUtcDateRange(searchParams.get("start") ?? "", searchParams.get("end") ?? "");
  }

  return null;
}
