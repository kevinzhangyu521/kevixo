# Verified External Growth Metrics Design

## Goal

Give Admin a trustworthy view of registered external users without rewriting or assigning existing anonymous history.

## Scope

- Add an Admin-only `is_test_account` profile marker.
- Count verified external users from non-test profiles and persisted `user_id` relationships.
- Keep anonymous activity separate and retain the existing instrumentation cards with explicit labels.

## Data Rules

- Registration counts non-test profiles.
- First and repeat review counts use non-null `hand_reviews.user_id` joined to non-test profiles.
- Seven-day activity uses non-test `growth_events.user_id` records created in the preceding seven days.
- Anonymous records remain unassigned and are displayed only as anonymous instrumentation.

## Security

The profile trigger rejects changes to `is_test_account` outside the service role. The existing Admin API is the only application path that sends this update.

## Verification

Unit tests cover test-account exclusion, verified-review cohorts, seven-day activity, anonymous separation, and Admin update payloads. Full test, typecheck, lint, and production build run locally.
