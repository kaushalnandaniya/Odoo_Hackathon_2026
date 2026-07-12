# TransitOps — Smart Transport Operations Platform

Odoo Hackathon 2026. Fleet, driver, trip, maintenance, and expense management with
automatic status transitions and role-based access control.

**Read `PLAN.md` first** — it has the full task split (Person 1–4), timeline, business
rules, and demo script.

## Stack

Next.js 15 (App Router) · TypeScript · Prisma 6 · Supabase Postgres + Storage ·
Auth.js v5 (credentials) · shadcn/ui · Tailwind v4 · zod · Recharts

## Quickstart

```bash
npm install                # also runs prisma generate
cp .env.example .env       # then fill in real values (ask Person 1)
npm run db:migrate         # applies migrations (needs DIRECT_URL)
npm run db:seed            # demo users + fleet data
npm run dev
```

Seed logins (password for all: `password123`):

| Email | Role |
|---|---|
| manager@transitops.in | FLEET_MANAGER |
| driver@transitops.in | DRIVER |
| safety@transitops.in | SAFETY_OFFICER |
| finance@transitops.in | FINANCIAL_ANALYST |

## Architecture notes

- **All mutations are server actions** in `lib/actions/` with zod validation.
  Components never call Prisma directly.
- **Status transitions are transactional** (`lib/actions/trips.ts`): dispatch flips
  trip + vehicle + driver atomically, using conditional updates so concurrent
  dispatches cannot double-book.
- **RBAC is enforced server-side**: `middleware.ts` guards routes by role
  (`lib/rbac.ts`), and every server action calls `requireRole(...)` (`lib/authz.ts`).
- `docs/reference-schema.sql` is the original hand-written Postgres schema; the
  Prisma schema (`prisma/schema.prisma`) was converted from it and is the source
  of truth now.

## Env vars

See `.env.example`. Supabase needs BOTH strings: pooled (port 6543,
`?pgbouncer=true`) as `DATABASE_URL`, direct (port 5432) as `DIRECT_URL`.
