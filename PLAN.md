# TransitOps — Team Build Plan (Odoo Hackathon 2026)

**Repo**: https://github.com/kaushalnandaniya/Odoo_Hackathon_2026
**Duration**: 8 hours · **Team**: 4 people (Person 1, Person 2, Person 3, Person 4)

> How to use this doc: find your Person number, read your track, and follow the shared rules. If you're using an AI coding agent, paste this whole file in and tell it which Person you are.

---

## 1. What we're building

TransitOps — a transport operations platform: vehicles, drivers, trips, maintenance, fuel/expenses, dashboard, and reports, with automatic status transitions and role-based access control. Judged on **working business rules** and **visible polish** — every hour goes into one of those two.

## 2. Stack (locked — do not relitigate mid-event)

- **Next.js 15 (App Router) + TypeScript** — one repo, frontend + backend together
- **Prisma + Supabase (Postgres)** — hosted DB, free tier. **Two connection strings required**: pooled (port 6543, `?pgbouncer=true`) as `DATABASE_URL`, direct (port 5432) as `DIRECT_URL` for migrations. Both in `.env` and Vercel.
- **Supabase Storage** — one private bucket `vehicle-docs` for vehicle document uploads (bonus feature)
- **Auth.js v5** — email/password (credentials provider), role stored in session. (We do NOT use Supabase Auth — one auth system only.)
- **shadcn/ui + Tailwind** — all UI components (tables, dialogs, badges, forms)
- **zod** — validation on every server action
- **Recharts** — dashboard charts
- **Vercel** — deployment (free), auto-deploys from `main`
- **Emergency fallback**: if venue wifi dies, a commented SQLite datasource in `.env` + local demo

## 3. Non-negotiable architecture rules

1. **All mutations go through server actions in `lib/actions/<feature>.ts`** with zod validation. Nobody calls Prisma directly from components. Business rules live in ONE place.
2. **Every status transition runs inside `prisma.$transaction`** — dispatching a trip updates trip + vehicle + driver atomically or not at all.
3. **Dropdowns only query eligible records** (e.g. dispatch shows only `AVAILABLE` vehicles and non-expired, non-suspended `AVAILABLE` drivers). Rules enforced twice: in the query AND in the transaction.
4. **RBAC is server-side** — middleware + checks in actions. Hiding buttons is not access control.
5. **Copy-paste over abstraction.** Duplicate the table/dialog pattern per feature. No shared-component refactors until after the demo.

## 4. Prisma schema (FROZEN after hour 0:30)

Person 1 owns this file. Need a field? Message Person 1 — they change it, migrate, push; everyone pulls. Never edit `schema.prisma` on a feature branch.

```
User            email, passwordHash, name, role: FLEET_MANAGER|DRIVER|SAFETY_OFFICER|FINANCIAL_ANALYST
Vehicle         regNumber @unique, name, type, maxLoadKg, odometer, acquisitionCost, region,
                status: AVAILABLE|ON_TRIP|IN_SHOP|RETIRED
VehicleDocument vehicleId, fileName, storagePath, uploadedAt
Driver          name, licenseNumber, licenseCategory, licenseExpiry, phone, safetyScore,
                status: AVAILABLE|ON_TRIP|OFF_DUTY|SUSPENDED
Trip            source, destination, vehicleId, driverId, cargoKg, plannedKm, revenue?,
                finalOdometer?, status: DRAFT|DISPATCHED|COMPLETED|CANCELLED
MaintenanceLog  vehicleId, description, cost, openedAt, closedAt?
FuelLog         vehicleId, tripId?, liters, cost, date
Expense         vehicleId, category: TOLL|OTHER, amount, date
```

Costs and KPIs are **computed queries**, never stored columns (no sync bugs).

## 5. Mandatory business rules (this is what judges test)

- Vehicle registration number is unique
- Retired / In Shop vehicles never appear in dispatch selection
- Expired-license or Suspended drivers cannot be assigned to trips
- A vehicle or driver already On Trip cannot be assigned to another trip
- Cargo weight ≤ vehicle max load capacity
- Dispatch → vehicle AND driver become On Trip
- Complete → both back to Available (trip records final odometer)
- Cancel → both restored to Available
- Opening a maintenance record → vehicle becomes In Shop (hidden from dispatch)
- Closing maintenance → vehicle back to Available (unless Retired)

---

## 6. Who does what

### Person 1 — Backend: Schema + Rules Engine
The core domain logic. Everything judges will try to break.

1. **0:00–0:30** Scaffold: `create-next-app`, Prisma init + full schema above, Supabase project + both connection strings (pooled `DATABASE_URL` + direct `DIRECT_URL`), first migration, shadcn init, push to `main` so everyone can start.
2. **0:30–3:00** Trips engine in `lib/actions/trips.ts` — every rule inside `prisma.$transaction`:
   - `createTrip` (Draft): zod-validate cargo ≤ vehicle `maxLoadKg`
   - `dispatchTrip`: re-check INSIDE the transaction — vehicle AVAILABLE, driver AVAILABLE + license not expired + not SUSPENDED, cargo ≤ capacity → trip DISPATCHED, vehicle + driver ON_TRIP
   - `completeTrip`: takes final odometer + revenue → both back to AVAILABLE, vehicle odometer updated
   - `cancelTrip`: both restored to AVAILABLE
3. **3:00–4:30** Trips UI: list page, create-trip form with eligible-only dropdowns, live capacity check, Dispatch / Complete / Cancel buttons.
4. **4:30–5:30** Adversarial testing: try to double-book a driver, over-load cargo, dispatch a retired vehicle, assign an expired-license driver — via the UI and by calling actions directly. Fix everything found.
5. **5:30–8:00** Bug triage across the app; approve any shared-file changes; call feature cuts at 5:30; enforce integration freeze at 7:00.

### Person 2 — Auth + Dashboard
Critical path first hour: everyone needs auth. Then the most judge-visible page.

1. **0:30–1:30** Auth.js v5 credentials: login page, bcrypt password check against `User`, `role` in JWT/session, middleware protecting all routes. **If auth isn't working by 1:15 — hardcode a stub session, unblock the team, fix it in parallel.**
2. **1:30–2:00** Role-filtered sidebar nav (Driver sees trips; Financial Analyst sees dashboard/reports; Fleet Manager sees everything; Safety Officer sees drivers + compliance).
3. **2:00–4:30** Dashboard KPI cards: Active Vehicles, Available Vehicles, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization % (= ON_TRIP / non-retired vehicles). Filters: vehicle type, status, region.
4. **4:30–6:00** Two Recharts (fleet status donut + cost-per-vehicle bar) and dark mode toggle.
5. **6:00–8:00** RBAC audit — verify a Driver session is blocked server-side from manager actions/routes (not just hidden buttons). Polish + bug fixes.

### Person 3 — CRUD: Vehicles + Drivers
The most screens, but it's one pattern repeated. Build it once, copy it.

1. **0:30–1:30** App shell: sidebar layout, header, page container. Merge early even if rough — everyone builds inside it.
2. **1:30–3:00** Vehicles: data table with status badges (Available / On Trip / In Shop / Retired), create/edit dialogs with zod validation, delete-with-confirm, duplicate `regNumber` error surfaced cleanly.
3. **3:00–4:00** **Vehicle documents**: upload to Supabase Storage bucket `vehicle-docs` via a server action, list + download (signed URLs) on the vehicle detail/dialog. This is the bonus-feature differentiator — but if running late, skip straight to Drivers and come back.
4. **4:00–5:30** Drivers: copy the vehicles pattern. License number/category/expiry, phone, safety score. **Red badge/row when license is expired.** Status management (Available / On Trip / Off Duty / Suspended).
5. **5:30–6:30** Search + filters + sorting on both tables.
6. **6:30–8:00** Empty states, loading states, form polish, bug fixes.

### Person 4 — Ops + Reports + Delivery
Many small independent pieces + owning the demo.

1. **0:30–1:30** **Seed script** (`prisma/seed.ts`) — demo-critical: 4 users (one per role, simple known passwords), 8 vehicles (include one RETIRED, one IN_SHOP), 6 drivers (include one expired license, one SUSPENDED), 5 trips in mixed states, fuel/maintenance/expense history so reports have real numbers.
2. **1:30–2:15** **Deploy to Vercel now** (not at hour 7): connect the repo, set env vars (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`), verify auto-deploy on merge to `main`.
3. **2:15–3:30** Maintenance workflow: create record → vehicle auto-flips to IN_SHOP; close record → back to AVAILABLE (unless RETIRED); maintenance history per vehicle.
4. **3:30–4:30** Fuel logs (liters, cost, date, optional trip link) + Expenses (tolls/other) forms and lists.
5. **4:30–6:30** Reports page: Fuel Efficiency (km per liter), Operational Cost per vehicle (fuel + maintenance), Vehicle ROI = (revenue − (maintenance + fuel)) / acquisition cost, Fleet Utilization. **CSV export** (string join + `Content-Disposition` header — no library).
6. **6:30–8:00** README with architecture notes, re-seed clean demo data, **drive the demo run-throughs**.

---

## 7. Git workflow

- `main` is always working. One branch per person: `feat/trips`, `feat/auth-dashboard`, `feat/crud`, `feat/ops`.
- **Merge to `main` every 45–60 minutes.** Small merges, no end-of-day integration hell.
- Directory ownership (near-zero conflicts): you own your `app/(dashboard)/<feature>/` folders and your `lib/actions/<feature>.ts`. Shared files (`schema.prisma`, auth config, root layout) change **only through Person 1**.
- 3-minute team sync every 90 minutes: what's merged / what's blocked / what's cut.

## 8. Timeline at a glance

| Time | Person 1 | Person 2 | Person 3 | Person 4 |
|------|----------|----------|----------|----------|
| 0:00–0:30 | Scaffold + schema + Supabase → push | Local setup | Local setup | Local setup |
| 0:30–1:30 | Start trips engine | Auth + middleware | App shell | Seed script |
| 1:30–3:00 | Trips engine (transactions) | Role nav → dashboard KPIs | Vehicles CRUD | Vercel deploy → maintenance |
| 3:00–4:30 | Trips UI | Dashboard filters + KPIs | Vehicle docs → Drivers CRUD | Fuel + expenses |
| 4:30–5:30 | Adversarial rule testing | Charts + dark mode | Drivers CRUD → search/sort | Reports + ROI |
| 5:30–6:30 | Bug triage, call cuts | RBAC audit | Table polish | CSV export |
| 6:30–7:00 | Integration fixes | Bug fixes | Bug fixes | README + re-seed |
| 7:00–8:00 | **FREEZE** → 2 full demo run-throughs, everyone watching | | | |

## 9. Cut order (if behind — Person 1 calls it at 5:30)

Cut in this order: charts → reports beyond CSV → search/sort → vehicle document uploads → region filter.
**NEVER cut**: trip validations, status transitions, RBAC, seed data.

## 10. Bonus features

Already in the plan: charts, dark mode, vehicle document uploads (Supabase Storage), search/filter/sort.
Only if genuinely ahead after 6:30: PDF export · email reminders for expiring licenses.

## 11. Demo script (~5 min, Person 4 drives)

1. Log in as Fleet Manager → dashboard KPIs + filters.
2. Register vehicle **Van-05**, max capacity 500 kg → status Available. Upload its registration document.
3. Create a trip with 450 kg cargo → Dispatch → **vehicle AND driver flip to On Trip live**.
4. The money 30 seconds — show the rules holding:
   - Assign the same driver to another trip → blocked
   - Try 600 kg cargo on a 500 kg vehicle → blocked
   - Expired-license driver → not even in the dropdown
   - In-Shop vehicle → not in the dropdown
5. Complete the trip (final odometer + fuel) → both Available again → dashboard/reports update.
6. Create a maintenance record → vehicle vanishes from dispatch. Close it → it's back.
7. Log in as a Driver → nav is stripped, manager routes blocked server-side (RBAC is real).
8. Export reports CSV → flip dark mode → open the Vercel URL on a phone (responsive checkbox) → done.

## 12. Known traps (read once, save an hour)

- **Supabase + Prisma**: the app must use the **pooled** connection string (port 6543, `?pgbouncer=true`) as `DATABASE_URL`, and migrations need the **direct** string (port 5432) as `DIRECT_URL` in the datasource block. Getting this wrong looks like "deploys hang / migrations fail" and wastes an hour.
- **Auth.js v5** wants `AUTH_SECRET` in `.env` (`openssl rand -base64 32`) and `AUTH_TRUST_HOST=true` on Vercel. We use Auth.js for login — do NOT also wire Supabase Auth.
- Add `"postinstall": "prisma generate"` to `package.json` so Vercel builds and fresh clones work.
- After every schema change: `npx prisma migrate dev` — and tell the team to pull + regenerate.
- The Supabase Storage bucket `vehicle-docs` should be **private**; downloads go through signed URLs generated in a server action.
- Server actions must `revalidatePath()` after mutations or the UI shows stale statuses.
- Deploy at hour ~2, not hour 7 — every merge after that auto-deploys, so demo-day deployment is a non-event.
- If venue wifi dies: swap in the commented SQLite datasource, `migrate dev` + seed locally, demo from localhost.
- Test the trip lifecycle at hour 4, not hour 7.
