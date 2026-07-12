# TransitOps

Smart Transport Operations Platform. Odoo Hackathon 2026. Fleet, drivers, trips,
maintenance, fuel and expenses, with automatic status transitions and real RBAC.

## Stack

Next.js 15 (App Router), TypeScript, Prisma 6, Supabase Postgres + Storage,
Auth.js v5 credentials, shadcn/ui, Tailwind v4, zod, Recharts.

Do not upgrade Prisma to v7. It changes the config format and you will waste an
hour learning that the hard way. Our shadcn components are the Base UI variant,
so it is render={<Button/>}, not asChild. You have been warned.

## Quickstart

```bash
npm install                # runs prisma generate for you
cp .env.example .env       # fill in the real values
npm run db:migrate         # needs DIRECT_URL
npm run db:seed
npm run dev
```

Seed logins, password for all is `password123`:

| Email | Role |
|---|---|
| manager@transitops.in | FLEET_MANAGER |
| driver@transitops.in | DRIVER |
| safety@transitops.in | SAFETY_OFFICER |
| finance@transitops.in | FINANCIAL_ANALYST |

## Rules of this codebase

1. Every mutation is a server action in `lib/actions/` with zod validation.
   If you call Prisma from a component, your PR gets rejected. No exceptions.
2. Status transitions run inside `prisma.$transaction` with conditional updates.
   Look at `lib/actions/trips.ts` before you write your own. Dispatch flips the
   trip, vehicle and driver atomically, so concurrent dispatches cannot
   double-book. Copy that pattern, do not invent a worse one.
3. RBAC is server side. `middleware.ts` guards routes via `lib/rbac.ts`, and
   every action calls `requireRole()` from `lib/authz.ts`. Hiding a button is
   not access control, it is decoration.
4. Copy-paste over abstraction. This is an 8 hour build, not a framework.

## Env

See `.env.example`. Supabase needs BOTH strings: the pooled one (port 6543,
`?pgbouncer=true`) as `DATABASE_URL`, the direct one (port 5432) as `DIRECT_URL`.
Mixing these up looks like hanging deploys and failing migrations.

`docs/reference-schema.sql` is the original hand-written Postgres schema. The
Prisma schema was converted from it and is the source of truth now.
