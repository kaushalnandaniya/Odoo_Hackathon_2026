# TransitOps — Smart Transport Operations Platform

![TransitOps Banner](./app/favicon.ico) *A next-generation fleet, driver, trip, maintenance, and expense management platform built for the Odoo Hackathon 2026.*

**TransitOps** handles automatic status transitions, role-based access control (RBAC), secure OTP authentication, and mandatory driver onboarding workflows with a stunning glassmorphic UI.

**Read `PLAN.md` first** — it has the full task split (Person 1–4), timeline, business rules, and demo script.

---

## 🚀 Key Features

*   **Premium Glassmorphic UI**: Powered by **Framer Motion** and **Tailwind CSS v4** for buttery-smooth animations and modern aesthetics.
*   **Production-Grade Authentication**:
    *   2-Step Verification Flow (Email + OTP)
    *   **Brevo SMTP** for lightning-fast email delivery
    *   **Upstash Redis** for high-performance OTP caching (10-minute TTL)
    *   Forgot Password flow with 60-second cooldown protections
*   **Mandatory Driver Onboarding**: Newly approved drivers are intercepted by edge middleware and forced to complete their legal profile (License, Expiry, Contact) before accessing the dashboard.
*   **Role-Based Access Control (RBAC)**: Next.js middleware explicitly guards routes for `FLEET_MANAGER`, `DRIVER`, `SAFETY_OFFICER`, and `FINANCIAL_ANALYST`.
*   **Atomic Transactions**: Status transitions (e.g. dispatching a trip) flip the trip, vehicle, and driver atomically via Prisma to prevent double-booking.

---

## 🛠 Tech Stack

**Core**
*   **Next.js 15 (App Router)** - React Framework
*   **TypeScript** - Type Safety
*   **Auth.js v5 (NextAuth)** - Session Management

**Database & Caching**
*   **Prisma 6** - ORM
*   **Supabase** - PostgreSQL Database (Connection Pooled)
*   **Upstash** - Serverless Redis (OTP & Session Caching)

**UI & Styling**
*   **Tailwind CSS v4** - Utility-first CSS
*   **Framer Motion** - Animations
*   **shadcn/ui** - Accessible UI Components
*   **Lucide React** - Icons
*   **Recharts** - Data Visualization

**Services**
*   **Brevo** - Transactional Emails

---

## ⚡ Quickstart

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   *Fill in the real values for Supabase, Upstash Redis, and Brevo API Keys.*

3. **Database Setup**:
   ```bash
   npm run db:migrate   # Applies schema changes
   npm run db:seed      # Seeds demo users + fleet data
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

---

## 🔑 Seed Credentials

*(Password for all seed users: `password123`)*

| Role | Email | Access Level |
| :--- | :--- | :--- |
| **Fleet Manager** | `manager@transitops.in` | Full System Access |
| **Driver** | `driver@transitops.in` | Trips & Fuel Logging |
| **Safety Officer** | `safety@transitops.in` | Dashboard, Drivers, Maintenance |
| **Finance Analyst**| `finance@transitops.in` | Dashboard, Reports, Fuel, Maintenance |

---

## 🏗 Architecture Notes

*   **Server Actions**: All database mutations occur exclusively inside `lib/actions/` via Next.js Server Actions. Client components *never* call Prisma directly.
*   **Zod Validation**: Every server action rigorously validates inputs using `zod` before touching the database.
*   **Middleware Guard**: `middleware.ts` intercepts all requests and evaluates them against `lib/rbac.ts` at the edge.
*   **Authorization**: Individual server actions are protected by a strict `requireRole(...)` helper in `lib/authz.ts`.
*   **Database Pooling**: Supabase uses BOTH connection strings: the pooled string (port 6543, `?pgbouncer=true`) as `DATABASE_URL` for serverless scale, and the direct string (port 5432) as `DIRECT_URL` for Prisma migrations.
