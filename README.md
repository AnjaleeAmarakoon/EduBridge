# EduBridge

**Bridging Resources to Transform Education**

EduBridge is a multi-sided education charity platform that connects underprivileged schools (schools for the Blind, Deaf, and Rural communities in Sri Lanka) with donors and volunteers. Schools post resource needs; donors and volunteers discover and fulfill them.

---

## Features

### For School Admins
- Register and manage a school profile
- Post resource requests (monetary, goods, or volunteer/teaching help)
- Track donations received and outstanding needs
- Review, approve, or decline volunteer teaching session proposals
- Log student attendance and mark sessions as complete
- Update school details and manage active requests

### For Donors
- Browse urgent school requests with category, type, and urgency filters
- Make monetary or in-kind donations through a simple flow
- Track personal donation history and impact statistics
- View a dashboard summarising total given and schools supported

### For Volunteers
- Discover open volunteer opportunities at schools
- Propose teaching sessions directly to school admins
- Track upcoming and completed sessions in a calendar view
- Respond to school requests with availability

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | React 19, Tailwind CSS v4, Lucide React |
| Language | TypeScript 5 |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| Auth | Supabase Auth (email/password, email verification, password reset) |
| Data access | `@supabase/supabase-js` + `@supabase/ssr` |
| Fonts | Geist Sans / Geist Mono |
| Linting | ESLint 9 |
| Deployment | Vercel |

---

## Project Structure

```
edubridge/
├── app/
│   ├── api/                # REST API routes (auth, schools, requests, donations, sessions)
│   ├── auth/               # Auth pages (login, signup, forgot/reset password, callback)
│   ├── dashboard/          # Role-based dashboards + server actions
│   ├── requests/           # Browse, create, and detail pages for requests
│   ├── school/register/    # School onboarding
│   ├── components/         # Shared UI components
│   ├── layout.tsx
│   ├── page.tsx            # Public landing page
│   └── globals.css
├── lib/
│   ├── supabase/           # Supabase browser/server clients + middleware helper
│   ├── types/database.ts   # Hand-written TypeScript types mirroring the DB schema
│   └── currency.ts         # LKR (₨) formatter
├── services/               # Business logic layer (auth, school, request, donation, session)
├── supabase-schema.sql     # Full PostgreSQL schema with RLS policies and triggers
└── public/                 # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone and install

```bash
git clone <repo-url>
cd edubridge
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Optional — defaults to http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Both keys are available in your Supabase project under **Settings → API**.

### 3. Set up the database

Open your Supabase project's **SQL Editor** and run the full contents of `supabase-schema.sql`. This creates all tables, RLS policies, and database triggers.

### 4. Configure Supabase Auth redirect URLs

In your Supabase project go to **Authentication → URL Configuration** and add:

```
http://localhost:3000/auth/callback
```

Add your production URL here as well when deploying.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start at `http://localhost:3000` with hot reload |
| Production build | `npm run build` | Compile and optimise for production |
| Production server | `npm run start` | Run the compiled production build |
| Lint | `npm run lint` | Run ESLint across the project |

---

## Architecture Overview

```
Pages (RSC + Client Components)
    → API Routes / Server Actions
        → Service classes (static methods)
            → Supabase JS client
                → PostgreSQL + RLS
```

- **Server Components** handle data-heavy pages (`/dashboard`, `/requests`, `/requests/[id]`).
- **Client Components** (`'use client'`) power interactive dashboards and forms.
- **Server Actions** (`app/dashboard/actions.ts`) handle dashboard data fetching and mutations.
- **REST API routes** under `/app/api/` are called from client-side auth and request forms.
- **Row Level Security (RLS)** is enforced at the database level per role — the application uses only the anon key.

### User Roles

| Role | Access |
|------|--------|
| `school_admin` | Register a school, manage requests and sessions |
| `donor` | Browse requests, donate, view impact |
| `volunteer` | Browse opportunities, propose and manage sessions |
| `admin` | Reserved — admin dashboard is a planned future feature |

### Auth Flow

1. Users sign up and select a role.
2. A verification email is sent; clicking the link calls `/auth/callback` which exchanges the code for a session.
3. Middleware refreshes the session on every request and redirects unauthenticated users to `/auth/login`.
4. School admins without a registered school are redirected to `/school/register`.

---

## Database Schema (Summary)

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles linked to `auth.users`; stores role |
| `schools` | School records (Blind / Deaf / Rural); verified flag |
| `requests` | Resource needs posted by schools |
| `request_responses` | Donor/volunteer interest and commitments |
| `donations` | Monetary and in-kind donations |
| `volunteer_sessions` | Teaching session proposals and approvals |
| `session_participants` | Student attendance records |
| `notifications` | In-app notification records |
| `conversations`, `messages` | Messaging (schema defined, UI planned) |
| `ratings` | Feedback and ratings (schema defined, UI planned) |

---

## Roadmap

- [ ] Real payment gateway integration (Stripe or local provider)
- [ ] In-app messaging between schools, donors, and volunteers
- [ ] Notification centre UI
- [ ] Ratings and feedback system
- [ ] Full admin dashboard
- [ ] Tax receipt generation for donors
- [ ] Recurring donation support

---

## Deployment

The easiest way to deploy is [Vercel](https://vercel.com):

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`) in the Vercel project settings.
4. Add the Vercel deployment URL to your Supabase Auth redirect URLs.

---

## Notes

- Currency is formatted in **Sri Lankan Rupees (LKR, ₨)**.
- Payment processing is currently **simulated** — card details are validated locally and a fake transaction ID is generated. No real money moves.
- Messaging, ratings, and admin tooling are present in the database schema but not yet wired up in the UI.
