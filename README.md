# Bhada

A polished rent-management workspace built with Next.js 16, Tailwind CSS,
Better Auth, Drizzle ORM, Neon Postgres, Google OAuth, and Nodemailer.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run db:push
npm run dev
```

Generate `BETTER_AUTH_SECRET` with at least 32 random characters. The public app
URL must be used for both `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in
production.

## Vercel deployment

Add every variable from `.env.example` to the Vercel project. Set
`CRON_SECRET` to a random value of at least 16 characters; Vercel sends it as a
Bearer token when invoking the daily rent-billing route.

The cron in `vercel.json` runs every day at 18:35 UTC (00:05 IST). Apply
the due-day schema update to an existing Bhada database before deploying:

```bash
npm run db:add-rent-due-day
```

## Google OAuth

Create a Google OAuth web client and add this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

For production, add the same path on the production origin. Then set
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Transactional email

Bhada sends verification and password-reset messages through Nodemailer. Set:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="..."
SMTP_PASS="..."
EMAIL_FROM="Bhada <hello@example.com>"
```

Use `SMTP_SECURE=true` for implicit TLS (commonly port 465). Password reset
tokens expire after Better Auth's default one-hour window.

## Razorpay Portfolio billing

Create a Razorpay Subscription Plan for ₹49 INR with a monthly billing period,
then configure:

```env
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_PORTFOLIO_PLAN_ID="plan_..."
RAZORPAY_WEBHOOK_SECRET="..."
```

Start with Test Mode keys. In Razorpay Dashboard, add this webhook URL:

```text
https://YOUR_DOMAIN/api/billing/razorpay/webhook
```

Subscribe it to all `subscription.*` events, using the same webhook secret set
above. Before enabling live billing, replace the Test Mode key and plan with
their Live Mode equivalents and run the database migration:

```bash
npx drizzle-kit migrate
```

The checkout callback is verified server-side, and renewals, failed charges,
pauses, and cancellations are synchronized through signed webhooks.

## Security model

- `/` is the public marketing page.
- `/dashboard` reads the Better Auth session on the server and redirects guests.
- The dashboard identity comes only from the verified server session.
- Portfolio tables include an `ownerId`; every database read or mutation must
  filter with the current session's `user.id`.
- Email/password accounts must verify their email. Google accounts use Google's
  verified identity.

## Commands

```bash
npm run lint
npm run build
npm run db:generate
npm run db:add-rent-due-day
npm run db:push
npm run db:studio
```
