import { NextResponse } from "next/server";
import {
  deleteReviewFeedbackFromSupabase,
  listReviewFeedback,
  resolveReviewFeedback,
} from "@/lib/supabase-feedback";
import type { ReviewFeedbackStatus } from "@/lib/review-feedback";

const defaultPage = 1;
const defaultPageSize = 6;
const maxPageSize = 50;

export async function GET(request: Request) {
  const unauthorized = authorize(request);

  if (unauthorized) {
    return unauthorized;
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
  const unauthorized = authorize(request);

  if (unauthorized) {
    return unauthorized;
  }

  try {
    const payload = (await request.json()) as { id?: string; status?: ReviewFeedbackStatus };

    if (!payload.id || payload.status !== "resolved") {
      return NextResponse.json({ ok: false, error: "Invalid feedback update." }, { status: 400 });
    }

    const feedback = await resolveReviewFeedback(payload.id);

    return NextResponse.json({ ok: true, feedback });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const unauthorized = authorize(request);

  if (unauthorized) {
    return unauthorized;
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

function authorize(request: Request) {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_FEEDBACK_KEY;
  const passcode = request.headers.get("x-admin-passcode");

  if (!adminKey || passcode !== adminKey) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return null;
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
