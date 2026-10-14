# BizPulse - what changed

## After pulling these changes (do these once)
1. Apply the new migration: `supabase db push` (or paste `supabase/migrations/20261014000000_fixes_unique_owner_stock_rpc.sql` into the SQL editor).
2. Redeploy the AI function: `supabase functions deploy ai-chat` (config.toml now sets `verify_jwt = false`; the function verifies the Firebase token itself).
3. Optional: `supabase secrets set FIREBASE_PROJECT_ID=bizpulse-v1` (defaults to bizpulse-v1).
4. `npm install && npm run build && firebase deploy --only hosting`

## Bugs fixed
- Infinite spinners: screens returned early when no business existed and never cleared `loading`; no try/finally/timeouts anywhere.
- All `shadow-hard-*` shadows were invalid CSS (underscores in tailwind.config.js) - none ever rendered.
- AI chat / digest always failed: gateway `verify_jwt=true` rejected the publishable key. Now sends the Firebase token and the function verifies it (also stops anonymous use of the Groq quota).
- AI fallback in the chat referenced an out-of-scope variable and crashed; it now answers from the user's own data.
- Cash projection started from the OPENING balance instead of the current balance.
- Monte Carlo chained every run off the previous day's average, so risk % was meaningless; each run now has its own path.
- "Last 7 days" meant last 7 days WITH entries (could span months); now real calendar days, and averages include zero-sale days.
- Dates used UTC (`toISOString`), logging the wrong day in India 00:00-05:30; now local dates.
- Only the first 1000 rows were ever loaded (PostgREST limit) - newest transactions silently dropped; now paginated.
- Reorder suggestion used revenue (rupees) as unit demand; now uses the item's own sold quantity.
- Quick Log: errors were swallowed, stock used a stale value, recent list and item dropdown never refreshed, quantity left blank skipped the stock update, zero/negative amounts allowed.
- Sign-up race could create two business rows (then `.maybeSingle()` errored); sign-up is now one atomic flow + unique index.
- Dashboard: cash projection labels said Day 10/20/30 but showed day 1/11/21; forecast bars were always 4px tall; "Log your first entry" link did nothing; health score shown before any data.
- Digest: "up 0%" headline when no prior week; failures were silent.
- Missing `.env` produced a blank page; now shows which variables are missing. Render errors / stale chunks after a deploy show a Reload screen instead of blank.
- `.firebaserc` had a placeholder project id; index.html is now never cached and hashed assets are cached for a year.
- Global `<style>` injected on every render replaced by a class; Google Fonts moved from CSS @import to `<link>`; favicon added.

## Performance
- Each screen is a lazy chunk; React / Firebase / Supabase / icons are separate vendor chunks; analytics computed once per data load.

## Known gaps (features, not bugs)
- There is no UI to add bills, so bill-based alerts/cash risk stay empty until bills exist in the DB.
- Items cannot be edited or deleted yet; restock by logging an expense linked to the item.
- `src/components/sections/*` and `Navbar` (landing page) are not used anywhere.
