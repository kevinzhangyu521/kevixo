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

Google Analytics uses the official `gtag.js` implementation through `next/script`.
It only loads when `NODE_ENV` is `production` and `NEXT_PUBLIC_GA_MEASUREMENT_ID`
is present.

### Microsoft Clarity

Microsoft Clarity initializes with project ID `xeh07r3ewa`. It also loads only
when `NODE_ENV` is `production`.

Google Analytics uses `afterInteractive`, and Clarity injects an async script
after the client mounts. Neither blocks initial page rendering.

### Environment Variables

- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: Google Analytics 4 measurement ID.

### Custom Events

Tracked events:

- `page_view`
- `analyze_button_clicked`
- `review_completed`
- `feedback_sent`
- `demo_selected`
- `followup_question_sent`

Event helpers live in `lib/analytics.ts`.
