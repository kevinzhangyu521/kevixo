# Verified External Growth Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Admin-controlled test-account exclusion and verified external-user growth metrics.

**Architecture:** Store a protected profile flag, extend the existing Admin user update flow, and derive cohort metrics from authenticated database relationships. Preserve raw instrumentation separately.

**Tech Stack:** Next.js, TypeScript, Supabase migrations, existing `tsx` tests.

**Spec:** `docs/superpowers/specs/2026-10-01-verified-external-growth-design.md`

## Global Constraints

- Do not modify existing reviews or assign historical anonymous records.
- Do not change Paddle, subscription access, or Review analysis.
- Do not run production migrations, push, or deploy.

## Review Focus

- Test accounts must never enter verified-user metrics.
- Null user IDs must remain anonymous.
- A user with two persisted reviews must be counted once in the repeat cohort.
- Seven-day activity must exclude old events.
- Non-service-role profile updates must not change the test marker.

### Task 1: Protected test-account profile field

**Files:** migration, `lib/admin-users.ts`, Admin users page, tests.

- [ ] Write failing tests for the Admin-facing test flag mapping and update payload.
- [ ] Add a re-runnable migration with `is_test_account` and trigger protection.
- [ ] Extend the existing Admin-only update flow and UI.
- [ ] Run focused tests.

### Task 2: Verified external growth cohorts

**Files:** `lib/admin-dashboard.ts`, Admin dashboard page, dashboard tests.

- [ ] Write failing tests for verified registrations, first/repeat reviews, seven-day activity, and anonymous records.
- [ ] Add a pure cohort helper and query required `user_id` fields.
- [ ] Render verified-user and anonymous sections while relabeling existing instrumentation cards.
- [ ] Run focused tests.

### Task 3: Full local validation

- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
- [ ] Review the diff and provide migration, rollback, and production acceptance instructions without applying them.
