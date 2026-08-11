# BudgetAgent

Upload your bills, loan statements, and bank CSVs — an AI agent (Claude) reads
each one, extracts the amount/due date/category, and files it as a bill or a
loan. Enter your monthly income and get a waterfall budget: living expenses
first, then loan payments, then whatever's left for discretionary spending.
Loans get a ring showing % balance remaining, with a click-through to the full
amortization schedule and payoff projection.

## Stack

- Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui
- Convex — database, file storage, serverless functions, auth
- Convex Auth (email + password)
- Anthropic API (Claude) — called from a Convex action to parse uploaded
  documents into structured bill/loan records
- Vercel — hosting

## One-time setup

1. **Install dependencies**

   ```
   bun install
   ```

2. **Log in to Convex and create the project** (interactive — opens your
   browser; this is a one-time step per machine)

   ```
   bunx convex dev
   ```

   This provisions a Convex deployment, writes `.env.local` with
   `VITE_CONVEX_URL`, and generates `convex/_generated/*` (required for the
   app to type-check — nothing will build until this has run once). Leave
   it running in a terminal, or Ctrl-C once it says "Convex functions ready"
   and use `bun run dev` from then on.

3. **Get an Anthropic API key** at https://console.anthropic.com/settings/keys
   and set it as a Convex environment variable (this is read server-side by
   the parsing action, never exposed to the browser):

   ```
   bunx convex env set ANTHROPIC_API_KEY sk-ant-...
   ```

4. **Run the app**

   ```
   bun run dev
   ```

   This runs the Vite dev server and `convex dev` together. Open the printed
   localhost URL and sign up with an email/password — Convex Auth is scoped
   to this deployment, so the first account you create is yours.

## Deploying

- **Convex**: `bunx convex deploy` pushes functions/schema to production.
  Set `ANTHROPIC_API_KEY` on the prod deployment too:
  `bunx convex env set ANTHROPIC_API_KEY sk-ant-... --prod`.
- **Vercel**: `vercel` (or connect the GitHub repo in the Vercel dashboard).
  Set the build's `VITE_CONVEX_URL` env var to your **production** Convex
  deployment URL (from `bunx convex deploy` output or the Convex dashboard).

## Data model

- `documents` — uploaded file metadata + parse status
- `bills` — biller, amount, due day, category (`living` / `loan` /
  `discretionary`), linked back to the source document if auto-extracted
- `loans` — balance, rate, monthly payment, due day, servicer
- `incomeEntries` — one row per user per month

The monthly budget (`convex/budget.ts`) is computed on the fly, not stored:
income minus living-expense bills, minus loan payments, minus discretionary
bills, in that priority order.
