# Kevixo

AI poker hand analyzer built with Next.js App Router.

## Local Development

```bash
npm install
npm run dev
```

## Analytics

Kevixo uses Google Analytics 4 and Microsoft Clarity in production.

Create a local environment file if you need to test production analytics behavior:

```bash
cp .env.example .env.local
```

Set this variable in Vercel for Production:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4QJ105MCSE
```

### Google Analytics 4

Google Analytics uses the official Next.js `@next/third-parties/google`
`GoogleAnalytics` component. It loads globally from `app/layout.tsx` only when
`NODE_ENV` is `production`.

### Microsoft Clarity

Microsoft Clarity initializes with project ID `xeh07r3ewa`. It also loads only
when `NODE_ENV` is `production`.

Google Analytics uses `afterInteractive`, and Clarity injects an async script
after the client mounts. Neither blocks initial page rendering.

### Environment Variables

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 measurement ID.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key used for feedback inserts.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key used only by server-side admin feedback routes.
- `NEXT_PUBLIC_ADMIN_FEEDBACK_KEY`: passcode for `/admin/feedback`.

### Custom Events

Tracked events:

- `page_view`
- `analyze_button_clicked`
- `review_completed`
- `feedback_sent`
- `demo_selected`
- `followup_question_sent`

Event helpers live in `lib/analytics.ts`.

## Supabase Feedback

Review feedback is stored in the `review_feedback` table. The migration lives at
`supabase/migrations/001_create_review_feedback.sql`.

Run the migration in Supabase SQL Editor before using the production feedback
admin. Anonymous users can only insert feedback through RLS. Listing, resolving,
and deleting feedback uses the server-side service role key through
`/api/admin/feedback`.

Full AI hand reviews are stored in the `hand_reviews` table. The migration lives
at `supabase/migrations/002_create_hand_reviews.sql`. Anonymous users can insert
completed reviews, but cannot read, update, or delete them. Admin review reads
use the server-side service role key through `/api/admin/reviews/[reviewId]` and
require the admin passcode header.
