# RapidLab Emergency Records — Vercel edition

This version has been converted from ChatGPT Sites/Cloudflare to a standard
Next.js application for Vercel. It uses Supabase PostgreSQL for application
data and a private Supabase Storage bucket for uploaded lab reports.

## What was changed

- Replaced Cloudflare D1 with PostgreSQL through `DATABASE_URL`.
- Replaced the Cloudflare R2 bucket with private Supabase Storage.
- Replaced Cloudflare-only build commands with `next build`.
- Converted all Drizzle tables and transactions to PostgreSQL.
- Removed the automatic workspace-reset behavior so production data cannot be
  cleared by opening the profile page.

## 1. Prepare Supabase

1. Open your Supabase project.
2. Select **SQL Editor** and then **New query**.
3. Copy all of `supabase-setup.sql`, paste it into the editor, and click
   **Run**. It creates the empty tables and the private `lab-reports` bucket.
4. Open **Project Settings -> Database** and copy the **Transaction pooler**
   connection string. Use it as `DATABASE_URL`.
5. Open **Project Settings -> API** and copy the project URL and service-role
   secret. Never expose the service-role secret in browser code or commit it to
   GitHub.

## 2. Add Vercel environment variables

In Vercel, open the project and select **Settings -> Environment Variables**.
Add these variables for Production, Preview, and Development:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Supabase Transaction Pooler connection string |
| `SUPABASE_URL` | Supabase project URL, such as `https://abc.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role secret |
| `SUPABASE_STORAGE_BUCKET` | `lab-reports` |
| `OTP_HASH_SECRET` | A long random secret of at least 32 characters |
| `BREVO_API_KEY` | Brevo API key used to send verification emails |
| `BREVO_SENDER_EMAIL` | A sender address verified in Brevo |

Do not add quotation marks around the values. If the database password contains
characters such as `@`, `#`, `/`, `?`, or `%`, use the exact encoded pooler URL
provided by Supabase rather than typing the URL manually.

## 3. Deploy

1. Upload this project to the GitHub repository connected to Vercel.
2. In Vercel, keep **Framework Preset** as Next.js.
3. Keep **Build Command** as `npm run build` or leave it at its default.
4. Keep **Output Directory** empty/default.
5. Redeploy. The build should run `next build` and no longer reference
   `cloudflare:workers`.

## Local verification

```bash
npm ci
npm run build
```

Copy `.env.example` to `.env.local` only when running locally. Environment
files and secrets are intentionally excluded from Git.

## Important upload limit

Vercel Functions accept request bodies up to 4.5 MB. RapidLab therefore accepts
report uploads totalling up to 4 MB per save. Larger uploads require a future
direct-to-storage upload flow.
