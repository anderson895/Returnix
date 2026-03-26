# LostFound System

A web-based Lost & Found Reporting and Recovery System built with Next.js 15, Supabase, and Cloudinary. Supports three user roles: **User**, **Security**, and **Admin**.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **File Storage:** Cloudinary
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd my-app
npm install
```

---

## 2. Environment Variables

Create a `.env.local` file in the `my-app` root folder (same level as `package.json`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your Supabase keys from: **Supabase Dashboard → Project Settings → API**
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ Always restart the dev server after creating or editing `.env.local`.

---

## 3. Supabase Database Setup

Go to **Supabase Dashboard → SQL Editor** and run `supabase-schema.sql` found in the project root.

### Fix RLS Policies (Important)

The default schema may generate recursive RLS policies that cause 500 errors. Run this in the SQL Editor to reset them cleanly:

```sql
-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Allow read role for auth users" ON profiles;

-- Create single, non-recursive SELECT policy
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

### Set Admin / Security Users

After registering accounts, promote them via SQL:

```sql
-- Set admin role
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- Set security role
UPDATE profiles SET role = 'security' WHERE email = 'security@example.com';
```

### Fix Missing Profile Rows

If a user can log in but gets redirected back to login, their profile row may be missing. Run:

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE email = 'user@example.com';

-- If missing, insert manually
INSERT INTO profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'user'
FROM auth.users
WHERE email = 'user@example.com';
```

---

## 4. Supabase Auth Settings

In **Supabase Dashboard → Authentication → URL Configuration**, set:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/api/auth/callback`

---

## 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## User Roles & Access

| Role       | Login Redirect  | Access                                      |
|------------|-----------------|---------------------------------------------|
| `user`     | `/dashboard`    | Report lost items, submit claims            |
| `security` | `/security`     | Log found items, verify claims              |
| `admin`    | `/admin`        | Full access: users, reports, all items      |

---

## Project Structure

```
my-app/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # User dashboard, lost items, claims
│   ├── (security)/      # Security staff pages
│   ├── (admin)/         # Admin pages
│   └── api/             # API routes (auth callback, uploads, notifications)
├── components/          # Shared UI components (Sidebar, ImageUpload)
├── lib/
│   └── supabase/        # Supabase server & client helpers
├── types/               # TypeScript type definitions
├── middleware.ts         # Auth & role-based route protection
├── supabase-schema.sql  # Full database schema
└── .env.local           # Environment variables (not committed to git)
```

---

## Common Issues & Fixes

### Blank dashboard / redirect loop after login
- Make sure `.env.local` exists and has the correct Supabase keys
- Restart the dev server after any changes to `.env.local`
- Run the RLS policy fix SQL above
- Use the fixed `login/page.tsx` that uses `window.location.href` instead of `router.push()`

### `No API key found in request`
- Your `.env.local` is missing or the dev server hasn't been restarted since it was created

### `infinite recursion detected in policy for relation "profiles"`
- Run the RLS policy fix SQL in Section 3 above

### `500 Internal Server Error` on profiles query
- RLS is blocking the query — run the policy fix SQL
- Or the profile row doesn't exist — use the insert query in Section 3

### TypeScript error: `Parameter 'cookiesToSet' implicitly has an 'any' type`
Add explicit types in `middleware.ts`:
```ts
import type { CookieOptions } from '@supabase/ssr'
// ...
setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[])
```

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all `.env.local` variables in **Vercel → Project Settings → Environment Variables**
4. Update Supabase Auth redirect URLs to your production domain
5. Deploy