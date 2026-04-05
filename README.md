# Back2U — MSU Lost & Found System

A web-based Lost & Found Reporting and Recovery System built with Next.js, Supabase, and Cloudinary. Supports three user roles: **User**, **Security**, and **Admin**. Features automated email notifications for claim updates, lost item reports, and item match alerts.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **File Storage:** Cloudinary
- **Email:** Nodemailer + Gmail SMTP
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudinary](https://cloudinary.com) account
- A Gmail account with **2-Step Verification** enabled (for email notifications)

---

## 1. Clone & Install

```bash
git clone <your-repo-url>
cd my-app
npm install
```

---

## 2. Environment Variables

Create a `.env.local` file in the project root (same level as `package.json`):

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

# Gmail SMTP (for email notifications)
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

**Getting your keys:**

- **Supabase:** Dashboard → Project Settings → API
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`
- **Cloudinary:** Dashboard → API Keys
- **Gmail App Password:** See Section 6 below

> ⚠️ Always restart the dev server after editing `.env.local`.

---

## 3. Supabase Database Setup

Go to **Supabase Dashboard → SQL Editor** and run `supabase-schema.sql` found in the project root.

### Fix RLS Policies (Required)

The default schema can produce recursive RLS policies that cause 500 errors. Run this in the SQL Editor:

```sql
-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Allow read role for auth users" ON profiles;

-- Create a security-definer function to safely check roles
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- Recreate non-recursive SELECT policy
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Fix found_items policies to use the function instead of subquery
DROP POLICY IF EXISTS "Security and admin can insert found items" ON found_items;
DROP POLICY IF EXISTS "Security and admin can update found items" ON found_items;
DROP POLICY IF EXISTS "Security/admin can view all claims" ON claim_requests;
DROP POLICY IF EXISTS "Security/admin can update claims" ON claim_requests;

CREATE POLICY "Security and admin can insert found items"
  ON found_items FOR INSERT WITH CHECK (
    get_my_role() IN ('security', 'admin')
  );

CREATE POLICY "Security and admin can update found items"
  ON found_items FOR UPDATE USING (
    get_my_role() IN ('security', 'admin')
  );

CREATE POLICY "Security/admin can view all claims"
  ON claim_requests FOR SELECT USING (
    get_my_role() IN ('security', 'admin')
  );

CREATE POLICY "Security/admin can update claims"
  ON claim_requests FOR UPDATE USING (
    get_my_role() IN ('security', 'admin')
  );
```

### Fix Notification Type Constraint

Add the `match_found` type used by email notifications:

```sql
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'claim_approved', 'claim_rejected', 'item_found',
  'claim_submitted', 'info', 'system', 'match_found'
));
```

### Set Admin / Security Roles

After registering accounts, promote them via SQL:

```sql
UPDATE profiles SET role = 'admin'    WHERE email = 'admin@example.com';
UPDATE profiles SET role = 'security' WHERE email = 'security@example.com';
```

### Fix Missing Profile Rows

If a user can log in but gets redirected back to login, their profile row may be missing:

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

## 6. Gmail App Password Setup (Email Notifications)

The system sends automated emails using Gmail SMTP via Nodemailer. You must use an **App Password** — not your regular Gmail password.

**Steps:**

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. **Security** → Enable **2-Step Verification** (required)
3. Search for **"App Passwords"** in the Google Account search bar
4. Select App: **Mail**, Device: **Other** → type `Back2U` → click **Generate**
5. Copy the 16-character password (e.g. `xxxx xxxx xxxx xxxx`)
6. Paste it into `.env.local` as `GMAIL_APP_PASSWORD` — **keep the spaces**

> ⚠️ Never use your real Gmail password. App Passwords are separate and can be revoked anytime.

---

## 7. Email Notifications

The system automatically sends emails in three scenarios:

| Trigger | Email Sent To | Content |
|---|---|---|
| User reports a lost item with no matching found items | User | "No match yet — we'll notify you" |
| Security logs a found item matching an existing report | Matching users | "Possible match found!" |
| Security approves a claim | Claimant | "Your claim is approved — visit security office" |
| Security rejects a claim | Claimant | "Claim not approved" with reason |

All emails are sent through `app/api/email/route.ts` using Nodemailer + Gmail SMTP.

---

## User Roles & Access

| Role | Login Redirect | Access |
|---|---|---|
| `user` | `/dashboard` | Report lost items, search found items, submit claims |
| `security` | `/security` | Log found items, review and verify claims |
| `admin` | `/admin` | Full access: users, reports, all items |

Route protection is enforced by `proxy.ts` (Next.js 16 middleware). Users are automatically redirected if they try to access a route outside their role.

---

## Project Structure

```
my-app/
├── app/
│   ├── (auth)/                   # Login & Register pages
│   ├── (dashboard)/              # User dashboard, lost items, claims, notifications
│   ├── (security)/               # Security staff pages (found items, claim verification)
│   ├── (admin)/                  # Admin pages (users, reports, overview)
│   └── api/
│       ├── auth/callback/        # Supabase auth callback
│       ├── email/                # Email notifications (Nodemailer + Gmail)
│       ├── notifications/        # In-app notification insert
│       ├── register/             # User registration
│       ├── resend-verification/  # Resend email verification
│       └── upload/               # Cloudinary image upload
├── components/
│   ├── Sidebar.tsx               # Role-aware navigation sidebar
│   ├── ImageUpload.tsx           # Cloudinary image uploader
│   └── ui/                       # Shared UI components (Button, Card, Badge, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Client-side Supabase instance
│   │   └── server.ts             # Server-side Supabase instance
│   ├── cloudinary.ts             # Cloudinary config
│   ├── errorLogger.ts            # Error logging utility
│   └── utils.ts                  # Shared utilities and constants
├── types/
│   └── index.ts                  # TypeScript type definitions
├── public/                       # Static assets
├── proxy.ts                      # Auth & role-based route protection (Next.js 16)
├── supabase-schema.sql           # Full database schema
├── package.json
└── .env.local                    # Environment variables (not committed to git)
```

---

## Common Issues & Fixes

### Blank dashboard / redirect loop after login
- Make sure `.env.local` exists with the correct Supabase keys
- Restart the dev server after any `.env.local` changes
- Run the RLS policy fix SQL in Section 3
- Check that the user's profile row exists in the `profiles` table

### `No API key found in request`
- Your `.env.local` is missing or the dev server hasn't been restarted

### `infinite recursion detected in policy for relation "profiles"`
- Run the full RLS policy fix in Section 3

### `new row violates row-level security policy for table "found_items"`
- The user's `role` in the `profiles` table is not set to `security` or `admin`
- Run: `UPDATE profiles SET role = 'security' WHERE email = 'your@email.com';`
- Also run the `get_my_role()` function fix in Section 3

### `535 Username and Password not accepted` (Email error)
- You are using your regular Gmail password instead of an App Password
- Follow Section 6 to generate a proper App Password
- Make sure `GMAIL_APP_PASSWORD` in `.env.local` keeps the spaces in the 16-character password

### `Module not found: Can't resolve 'nodemailer'`
- Run `npm install nodemailer @types/nodemailer`
- Make sure `export const runtime = 'nodejs'` is at the top of `app/api/email/route.ts`

### Wrong page showing for a user role (e.g. security seeing user form)
- The route protection in `proxy.ts` handles this automatically
- Make sure the user's `role` in Supabase `profiles` table is correctly set
- Hard refresh the browser or clear cookies if the session is stale

### `The "middleware" file convention is deprecated`
- Rename `middleware.ts` to `proxy.ts` in the project root
- Next.js 16 uses `proxy.ts` instead of `middleware.ts`

---

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all `.env.local` variables in **Vercel → Project Settings → Environment Variables**
4. Update Supabase Auth URLs:
   - **Site URL:** `https://your-app.vercel.app`
   - **Redirect URLs:** `https://your-app.vercel.app/api/auth/callback`
5. Deploy

> ✅ Nodemailer with Gmail works on Vercel — no additional configuration needed.