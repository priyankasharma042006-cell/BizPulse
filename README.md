# BizPulse

AI co-pilot for small business owners: cash flow, inventory and growth insights.

**Stack:** React + Vite + TypeScript + Tailwind · **Firebase** (Auth, Hosting) · **Supabase** (Postgres database, Edge Function)

Everything here runs on free plans: **no billing account or credit card needed**.

## How the pieces fit

- Users sign up / sign in with **Firebase Auth** (email + password), on the free Spark plan.
- Every database request sends the user's Firebase ID token to **Supabase**, which trusts Firebase through *Third-Party Auth*.
  Row level security keys all data on the Firebase UID (`auth.jwt() ->> 'sub'`).
- Supabase provides the Postgres database and the `ai-chat` Edge Function (free plan).
- The app is hosted on **Firebase Hosting** (Spark plan).

### What is intentionally NOT used (needs billing)
- **Firebase Cloud Storage** and **Cloud Functions** require the Blaze plan (a card). The app does not upload files.
  If you add uploads later, use **Supabase Storage** (free tier) instead.

## Setup

### 1. Firebase (Spark plan, no card)
1. Create a project at https://console.firebase.google.com and add a **Web app**. Keep the Spark plan.
2. **Authentication > Sign-in method**: enable **Email/Password**.
3. Put your project ID in `.firebaserc` and `supabase/config.toml`.

### 2. Supabase (Free plan, no card)
1. Create a project at https://supabase.com.
2. **Authentication > Sign In / Providers > Third-Party Auth > Add provider > Firebase**, enter your Firebase project ID.
3. Apply the schema (SQL editor, or `supabase db push`): `supabase/migrations/*.sql`.
4. Deploy the AI function (optional Groq free key; without it the function uses built-in rule-based answers):
   ```bash
   npm install -g supabase firebase-tools
   supabase login && supabase link --project-ref your-project-ref
   supabase functions deploy ai-chat
   supabase secrets set GROQ_API_KEY=your-key
   ```

### 3. Run the app
```bash
cp .env.example .env   # fill in the Supabase + Firebase values
npm install
npm run dev
```

### 4. Deploy to Firebase Hosting
```bash
npm run build
firebase login
firebase deploy --only hosting
```

## Free-plan things to know
- Supabase pauses free projects after about a week of inactivity (one click to resume) and allows 2 active free projects.
- Firebase Hosting free quota is 10 GB storage and about 360 MB/day transfer, plenty for a project like this.

## Quick check after setup
In the Supabase SQL editor, sign in to the app first, then confirm RLS works from the app: you should only ever see your own business.
Without signing in, the data should be empty.
