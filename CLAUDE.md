# Job Tracker — CLAUDE.md

A small web app to track job applications: company, role, link, stack, salary, status, notes.
Single developer project. Goal: ship a clean, working MVP fast, without cutting corners on security.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase: PostgreSQL + Auth (email/password)
- Drizzle ORM for schema, migrations and server-side queries
- Zod for validation
- Anthropic Claude API (server-side only) for parsing job descriptions
- Deploy: Vercel

## Project structure

- `app/` — routes (App Router). Pages are Server Components by default; add `"use client"` only when needed (forms, drag and drop, interactivity).
- `app/api/` — route handlers
- `lib/db/schema.ts` — Drizzle schema
- `lib/db/index.ts` — Drizzle client
- `lib/supabase/` — Supabase server and browser clients
- `lib/validation.ts` — Zod schemas
- `components/` — UI components
- `drizzle/` — generated migrations

## Data model

- `applications`: id (uuid), user_id (uuid, references auth.users), company, role, url, stack (text[]), salary (text), status (enum: saved, applied, interview, offer, rejected), applied_at (date), notes, created_at, updated_at

## Rules (always follow)

1. Every query on user data is scoped by the current user's id, taken from the Supabase session on the server. Never trust a user_id sent from the client.
2. Drizzle connects with a role that bypasses RLS, so scoping in code is mandatory. Enable RLS policies in Supabase too, as a second layer.
3. Update and delete check ownership: `WHERE id = $id AND user_id = $userId`.
4. Validate all input on the server with Zod, not only in the form.
5. Secrets (DATABASE_URL, ANTHROPIC_API_KEY, Supabase service key) live in `.env.local` and are only used on the server. Never import them into client components. Never commit `.env*`.
6. Never edit a migration that has already been applied. Create a new one.
7. Handle loading, empty and error states in the UI.
8. Keep changes small: one step per commit. Do not refactor unrelated code.
9. Before finishing a step: run `npm run lint` and `npx tsc --noEmit`, and fix errors.

## Workflow: Spec-Driven Development

- `docs/spec.md` is the source of truth: what we build and why, with acceptance criteria. Do not change it without asking me.
- `docs/plan.md` is the technical plan (how), derived from the spec.
- `docs/tasks.md` is a numbered task list derived from the plan. Each task is small, references the user story it implements (US-1, US-2...), and has a way to verify it.
- Implement one task at a time. After each task, tick it in tasks.md and say which acceptance criteria it covers.
- If the code needs something the spec doesn't say, stop and ask. Don't invent requirements.
- When I ask for a plan, write the plan only. No code until I confirm.
- If something is unclear, ask instead of guessing.
- After each step, summarize what you changed and anything I should double-check.

## Commands

- `npm run dev` — dev server
- `npx drizzle-kit generate` — generate migration from schema
- `npx drizzle-kit migrate` — apply migrations
- `npm run lint`, `npx tsc --noEmit`
