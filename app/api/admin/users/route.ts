import { NextResponse } from "next/server";
import {
  authorizeAdminUser,
  listAdminUsers,
  updateAdminUser,
  type AdminUserPlan,
  type AdminUserRole,
  type AdminUserStatus,
} from "@/lib/admin-users";

export async function GET(request: Request) {
  const unauthorized = await authorizeAdminUser(request);

  if (!unauthorized.ok) {
    return NextResponse.json(
      { ok: false, error: unauthorized.error },
      { status: unauthorized.status },
    );
  }

  try {
    const users = await listAdminUsers();

    return NextResponse.json({ ok: true, users });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await authorizeAdminUser(request);

  if (!unauthorized.ok) {
    return NextResponse.json(
      { ok: false, error: unauthorized.error },
      { status: unauthorized.status },
    );
  }

  try {
    const payload = (await request.json()) as {
      userId?: string;
      plan?: AdminUserPlan;
      role?: AdminUserRole;
      status?: AdminUserStatus;
    };

    if (!payload.userId) {
      return NextResponse.json({ ok: false, error: "Choose a user to update." }, { status: 400 });
    }

    if (payload.plan && !isPlan(payload.plan)) {
      return NextResponse.json({ ok: false, error: "Choose a valid plan." }, { status: 400 });
    }

    if (payload.status && !isStatus(payload.status)) {
      return NextResponse.json({ ok: false, error: "Choose a valid status." }, { status: 400 });
    }

    if (payload.role && !isRole(payload.role)) {
      return NextResponse.json({ ok: false, error: "Choose a valid role." }, { status: 400 });
    }

    const user = await updateAdminUser({
      userId: payload.userId,
      plan: payload.plan,
      role: payload.role,
      status: payload.status,
    });

    return NextResponse.json({ ok: true, user });
  } catch (error) {
    return serverError(error);
  }
}

function isPlan(value: string): value is AdminUserPlan {
  return value === "free" || value === "pro";
}

function isStatus(value: string): value is AdminUserStatus {
  return value === "active" || value === "disabled";
}

function isRole(value: string): value is AdminUserRole {
  return value === "user" || value === "admin";
}

function serverError(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : "Users could not be loaded right now.",
    },
    { status: 500 },
  );
}
