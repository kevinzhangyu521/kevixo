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
- `NEXT_PUBLIC_SITE_URL`: production site URL, for example `https://www.kevixo.com`.
- `STRIPE_SECRET_KEY`: Stripe secret key used only by server-side billing routes.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret for `/api/stripe/webhook`.
- `STRIPE_COACH_MONTHLY_PRICE_ID`: Stripe monthly subscription price ID for Kevixo Coach.

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

## Accounts

Kevixo uses Supabase Auth for email/password signup, login, logout, and password
reset. User profile rows live in the `profiles` table from
`supabase/migrations/006_account_profiles.sql`.

Account routes:

- `/login`: sign in, create account, and password reset flow.
- `/account`: account profile, review history placeholder, and subscription placeholder.

Authenticated reviews are saved with `hand_reviews.user_id`. Anonymous reviews
continue to work without requiring an account.

## Revenue Infrastructure

Kevixo Coach subscriptions use Supabase Auth for identity and Stripe for billing.
The subscription source of truth is the `subscriptions` table from
`supabase/migrations/005_coach_subscriptions.sql`.

Server subscription checks must go through `lib/subscription.ts`:

- `getSubscription(userId)`
- `isCoachUser(userId)`
- `requireCoach(userId)`

Stripe routes:

- `POST /api/billing/checkout`: creates a Stripe Checkout subscription session.
- `POST /api/billing/portal`: opens the Stripe Customer Portal.
- `POST /api/stripe/webhook`: receives Stripe subscription lifecycle events.

Required Stripe setup:

1. Create a monthly recurring Stripe Price for `$9.99/month`.
2. Copy the Price ID into `STRIPE_COACH_MONTHLY_PRICE_ID`.
3. Add a webhook endpoint for `https://www.kevixo.com/api/stripe/webhook`.
4. Listen for `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, and `customer.subscription.deleted`.
5. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
