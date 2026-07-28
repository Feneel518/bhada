# Bhada

A polished rent tracking workspace built with Next.js, Tailwind CSS, shadcn-style
components, Better Auth, Drizzle ORM, and Neon Postgres.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

The dashboard is available in demo mode without environment variables. To enable
real authentication and persistence, create a Neon database and fill in:

```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="a-random-secret-at-least-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"
```

Then push the schema:

```bash
npm run db:push
```

## Useful commands

```bash
npm run lint
npm run build
npm run db:generate
npm run db:studio
```

## Architecture

- `src/components/dashboard.tsx` - responsive dashboard and demo interactions
- `src/app/sign-in/page.tsx` - Better Auth email/password experience
- `src/app/api/auth/[...all]/route.ts` - Better Auth Next.js handler
- `src/db/schema.ts` - auth, property, unit, tenant, lease, and payment tables
- `src/db/index.ts` - Neon HTTP / Drizzle connection
