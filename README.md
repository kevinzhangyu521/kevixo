# Kevixo

AI poker hand analyzer built with Next.js App Router.

## Local Development

```bash
npm install
npm run dev
```

## Google Analytics 4

Kevixo uses the official Google Analytics `gtag.js` integration through `next/script`.

Create a local environment file if you need to test production analytics behavior:

```bash
cp .env.example .env.local
```

Set this variable in Vercel for Production:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-4QJ105MCSE
```

Analytics only loads when `NODE_ENV` is `production` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` is present. Development builds do not send GA events.

Tracked events:

- `page_view`
- `analyze_button_clicked`
- `review_completed`
- `feedback_sent`
- `demo_selected`
- `followup_question_sent`

Event helpers live in `lib/analytics.ts`.
