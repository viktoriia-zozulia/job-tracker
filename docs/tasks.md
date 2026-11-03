# Tasks: Job Application Tracker

Derived from `docs/plan.md`. Do one task at a time, with one commit per task. After each task, tick it here and say which acceptance criteria it covers.

Each user story gets its own branch, named above its tasks. Tasks with no user story go on the branch named in their section.

Before finishing every task, run `npm run lint` and `npx tsc --noEmit`. Read the matching guide in `node_modules/next/dist/docs/` before writing Next.js code.

"You" marks a step only the project owner can do, such as creating accounts or entering keys.

## Setup (branch: `chore/setup`)

- [x] **1. Install dependencies and add an env template** (all stories)
  - Add the packages from plan section 1 and a `.env.example` with variable names only. Add `!.env.example` to `.gitignore` so the template can be committed.
  - Verify: `npm run build` passes, `.env.example` is tracked, and `.env.local` stays ignored.
- [x] **2. Create the Supabase project and local env** (all stories, you)
  - Create the project, turn off "Confirm email", and fill in `.env.local`.
  - Verify: the keys are in `.env.local`, and `git status` doesn't list it.
- [x] **3. Add Supabase server and browser clients** (US-1)
  - Add `lib/supabase/`, following the current `@supabase/ssr` docs.
  - Verify: lint and type check pass.
- [x] **4. Add the Drizzle client and config** (all stories)
  - Add `lib/db/index.ts` and `drizzle.config.ts`, with `server-only` on the client.
  - Verify: a one-off query succeeds against the database, and importing the client from a client component fails the build.

## Schema (branch: `chore/schema`)

- [x] **5. Add the `applications` table** (US-2, US-3)
  - Add the schema, status enum, index and defaults, then generate and apply the migration.
  - Verify: the table, enum, index and cascade show up in Supabase.
- [x] **6. Add the `ai_usage` table** (US-5)
  - Add the schema and primary key, then generate and apply a new migration.
  - Verify: the table shows up in Supabase with the expected key.
- [x] **7. Add RLS in a custom migration** (US-1, US-5)
  - Add owner-only policies on `applications`. Enable RLS on `ai_usage` with no policies.
  - Verify: using the browser key and a logged-in session, a direct API call reads only your own `applications` rows and can't read or change `ai_usage`.

## US-1: Account (branch: `us-1-account`)

- [ ] **8. Add `requireUser()` and session handling in `proxy.ts`** (US-1)
  - `proxy.ts` refreshes the session and handles the `/`, `/dashboard` and `/login` redirects. Add a placeholder `/dashboard` page that calls `requireUser()`.
  - Verify: logged out, `/` and `/dashboard` go to `/login`.
- [ ] **9. Add sign-up, login and logout** (US-1)
  - Add the forms and Server Actions, with errors shown in the form.
  - Verify: sign-up lands on `/dashboard` with no confirmation step; login lands on `/dashboard`; a wrong password shows an error; logout returns to `/login`; a logged-in user opening `/login` or `/` goes to `/dashboard`.
- [ ] **10. Deploy early to Vercel** (US-1, you for accounts and env vars)
  - Link the project and set the env vars.
  - Verify: sign-up, login and logout work on the deployed URL.

## US-2: Add an application (branch: `us-2-add-application`)

- [ ] **11. Add the application validation schema** (US-2)
  - Add the field rules from plan section 5 to `lib/validation.ts`, and the date rules to `lib/dates.ts`.
  - Verify: run a throwaway script with empty and whitespace company, each length limit, `linkedin.com/jobs/1`, `javascript:alert(1)`, messy stack input and a future date.
- [ ] **12. Add the create query and Server Action** (US-2, US-1)
  - Add `lib/db/queries.ts`. The action gets the user id from `requireUser()` and ignores any id sent by the client. New "saved" applications store a null date.
  - Verify: submitting invalid data directly returns errors and saves nothing, and a `user_id` field in the request is ignored.
- [ ] **13. Add the add page and form** (US-2)
  - Add `/applications/new` and `ApplicationForm`, with today's browser date and status "applied" as defaults. Selecting "saved" clears the date, and a validation error keeps what was typed.
  - Verify: the defaults are correct; invalid input shows clear errors; "Save and add another" gives an empty form; a plain save returns to `/dashboard`.

## US-3: See and filter applications (branch: `us-3-list`)

- [ ] **14. Add the applications table** (US-3, US-1)
  - Show the user's rows newest first, with `loading.tsx` and `error.tsx`. Show links only if they are http or https. The table scrolls sideways at phone width.
  - Verify: the order is correct, a second account sees none of the first account's rows, and the page works at 400px wide.
- [ ] **15. Add the status filter** (US-3)
  - Single-select, stored in `?status=`. An unknown value means no filter.
  - Verify: the filter survives a refresh, and `?status=nonsense` shows all rows.
- [ ] **16. Add the empty states** (US-3)
  - Separate messages for "no applications yet" and "nothing matches".
  - Verify: check a new account and a filter with no matches.

## US-4: Edit and delete (branch: `us-4-edit-delete`)

- [ ] **17. Add the edit page and update action** (US-4, US-2, US-1)
  - Reuse `ApplicationForm` at `/applications/[id]/edit`, with update filtered on `id` and `user_id`. Apply the date rule when status changes.
  - Verify: all fields save; moving from "saved" to "applied", "interview" or "offer" with an empty date sets today; moving from "saved" to "rejected" keeps it empty; a malformed id, a missing id and another user's id all give the same 404.
- [ ] **18. Add the quick status change** (US-4, US-2)
  - Add a table control using `useOptimistic` and `useTransition`, with the same date rule and refresh on success.
  - Verify: no full page reload; blocking the request in dev tools rolls back with an error; another user's id changes nothing.
- [ ] **19. Add delete with confirmation** (US-4, US-1)
  - Add an HTML `<dialog>` and an action filtered on `id` and `user_id`.
  - Verify: cancel keeps the row, confirm removes it permanently, and another user's id deletes nothing.

## US-5: Fill from job description (branch: `us-5-ai-fill`)

- [ ] **20. Add the usage limit query** (US-5)
  - Add one atomic upsert that increments only while `count` is below 50.
  - Verify: set the count to 49, send parallel calls, and confirm only one succeeds and the count stops at 50.
- [ ] **21. Add the Claude extraction module** (US-5)
  - Add `lib/ai/parse-job.ts` using `claude-haiku-5-5` from one constant, `client.messages.parse`, effort `low`, no retries and a timeout. Treat refusal and `max_tokens` stops as failures.
  - Verify: a throwaway script extracts from a real posting, and a posting with no link or salary returns them as null.
- [ ] **22. Add the "appears in the text" check** (US-5)
  - Link and salary must match exactly as written. Company, role and stack entries match after normalising case and whitespace. Failed values are dropped and listed as not found.
  - Verify: an invented link, a reworded salary and a salary with different spacing are dropped, and a company with different case is kept.
- [ ] **23. Add `POST /api/parse-job`** (US-5, US-1)
  - Run the checks in the order in plan section 8, and reject a mismatched `Origin`. Log only error type and status, never the text.
  - Verify: no session returns 401; empty or over-20,000-character text returns 400 and isn't counted; at the limit it returns 429 and doesn't call Claude; a failed call still counts; server logs contain no job description text.
- [ ] **24. Add the paste box to the add page** (US-5)
  - Merge results into empty fields only, leave status and date alone, and list fields not found. Nothing saves until the form is submitted.
  - Verify: typed values aren't overwritten; with an invalid API key and at the limit, a clear message appears and the form still works; `ANTHROPIC_API_KEY` isn't in the client bundle.

## US-6: Stats (branch: `us-6-stats`)

- [ ] **25. Add status counts to the dashboard** (US-6)
  - Add a `GROUP BY` query that ignores the filter and search, with zero for missing statuses.
  - Verify: the counts stay the same when filtering, and a new account shows all five statuses at zero.
- [ ] **26. Add "sent this week"** (US-6, US-2)
  - The server sends the last 8 days of applied dates for non-saved applications, and a client component counts from its local Monday.
  - Verify: saved applications aren't counted; rejected ones with a date this week are; one moved from "saved" to "interview" with an empty date is counted; one moved from "saved" to "rejected" with an empty date isn't; the count is right with the browser in a timezone far from UTC, including around Sunday to Monday.

## Cuttable items

Built last so they're the first to go if time runs out. If one is cut, move it to non-goals in the spec, after checking with the owner.

- [ ] **27. Add search on company and role** (US-3, branch: `us-3-search`, second to cut)
  - Add `?q=` with debounced input, combined with the status filter, escaping `%`, `_` and `\`.
  - Verify: partial and case-insensitive matches work; `%` matches only a literal `%`; search survives a refresh; no matches shows the "nothing matches" message; stats don't change.
- [ ] **28. Add the duplicate warning** (US-2, branch: `us-2-duplicate-warning`, first to cut)
  - Add a read-only action that runs when link, company or role loses focus, and after AI fill.
  - Verify: the same URL warns; the same company and role in different case warns; saving still works; another account's rows never trigger it.

## Finish (branch: `chore/release`)

- [ ] **29. Run the full verification on production** (all stories)
  - Run every check in plan section 11 on the deployed app, and tick the acceptance criteria in the spec.
  - Verify: every criterion is ticked, or was cut under "If one day isn't enough".
- [ ] **30. Set the Anthropic spend limit** (US-5, you)
  - Set a monthly limit in the Anthropic Console.
  - Verify: the limit shows in the Console.
- [ ] **31. Add the public link to the README** (definition of done)
  - Add the deployed URL.
  - Verify: the link opens the app in a private window, and `npm run lint` and `npx tsc --noEmit` pass.
