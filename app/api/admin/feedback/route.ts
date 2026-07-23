import { NextResponse } from "next/server";
import {
  deleteReviewFeedbackFromSupabase,
  listReviewFeedback,
  updateReviewFeedback,
} from "@/lib/supabase-feedback";
import { authorizeAdminUser } from "@/lib/admin-users";
import type { ReviewFeedbackStatus } from "@/lib/review-feedback";

const defaultPage = 1;
const defaultPageSize = 6;
const maxPageSize = 50;

export async function GET(request: Request) {
  const unauthorized = await authorizeAdminUser(request);

  if (!unauthorized.ok) {
    return NextResponse.json(
      { ok: false, error: unauthorized.error },
      { status: unauthorized.status },
    );
  }

  try {
    const url = new URL(request.url);
    const page = getPositiveInteger(url.searchParams.get("page"), defaultPage);
    const pageSize = Math.min(
      getPositiveInteger(url.searchParams.get("pageSize"), defaultPageSize),
      maxPageSize,
    );
    const status = getStatusFilter(url.searchParams.get("status"));
    const query = (url.searchParams.get("query") ?? "").trim();
    const result = await listReviewFeedback({ page, pageSize, query, status });

    return NextResponse.json({ ok: true, ...result });
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
      id?: string;
      status?: ReviewFeedbackStatus;
      adminNote?: string;
    };

    if (!payload.id) {
      return NextResponse.json({ ok: false, error: "Invalid feedback update." }, { status: 400 });
    }

    if (
      typeof payload.adminNote !== "string" &&
      payload.status !== "open" &&
      payload.status !== "resolved"
    ) {
      return NextResponse.json({ ok: false, error: "Invalid feedback update." }, { status: 400 });
    }

    const feedback = await updateReviewFeedback(payload.id, {
      status: payload.status,
      adminNote: payload.adminNote,
    });

    return NextResponse.json({ ok: true, feedback });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await authorizeAdminUser(request);

  if (!unauthorized.ok) {
    return NextResponse.json(
      { ok: false, error: unauthorized.error },
      { status: unauthorized.status },
    );
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Feedback id is required." }, { status: 400 });
    }

    await deleteReviewFeedbackFromSupabase(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getStatusFilter(value: string | null) {
  return value === "open" || value === "resolved" ? value : "all";
}

function serverError(error: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Kevixo could not load feedback right now.",
    },
    { status: 500 },
  );
}
