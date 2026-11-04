# Technical Plan: Job Application Tracker

Derived from `docs/spec.md`. The spec says what to build; this file says how.

## 1. Architecture

- One Next.js 16 app on Vercel, using Server Components for reads and Server Actions for mutations.
- One route handler, `POST /api/parse-job`, for AI parsing. The client dispatches Server Actions one at a time, so a slow parse sent as an action would hold up other actions. It also fits the `app/api/` convention.
- Supabase provides Auth and Postgres. The browser uses Supabase only for auth through server code and never queries tables directly.
- All data access goes through Drizzle on the server.

### Dependencies

- Runtime: `@supabase/supabase-js`, `@supabase/ssr`, `drizzle-orm`, `postgres`, `zod`, `@anthropic-ai/sdk`, `server-only`
- Dev: `drizzle-kit`, plus `dotenv` so Drizzle can read `.env.local`

### Next.js 16 points

- Route protection uses `proxy.ts` in the project root. `middleware` was renamed.
- `cookies()`, `params` and `searchParams` are async.
- `next lint` is gone, and `npm run lint` already calls ESLint directly.
- `cacheComponents` is on in `next.config.ts`, so reading cookies outside a Suspense boundary is a build error. Every protected route has a `loading.tsx`, which provides that boundary.
- User data never uses `use cache`, so every read is fresh and nothing private is cached.
- With `cacheComponents` on, Next.js keeps up to 3 visited routes alive but hidden, including their state and form values. Logout therefore does a full page load, so no user data stays in the page. Forms and dialogs need checking for stale state when a user returns to them.
- React resets a form after its action runs, which puts a `<select>` back on its first option. Forms with a select submit through `onSubmit` and `startTransition` to skip that reset.
- Forms are tested in a real browser with JavaScript on. Plain HTTP requests can't see what the user sees.
- Database calls have a 10-second limit, so a stuck database gives an error instead of an endless wait.
- A rejected Server Action replaces the page with the error page, so forms catch it and show the error themselves.
- React holds back updates while a Server Action is pending, and a retry would queue behind it. A plain timer shows a "reload the page" message if an action never returns.
- Read the matching guide in `node_modules/next/dist/docs/` before each task, as `AGENTS.md` requires.

### Files beyond the `CLAUDE.md` structure

| Path | Purpose |
| --- | --- |
| `proxy.ts` | Refreshes the Supabase session and handles redirects |
| `lib/auth.ts` | `requireUser()`: reads the verified user from the Supabase session |
| `lib/db/queries.ts` | All application and usage queries; every function takes `userId` as a required argument |
| `lib/actions/` | Server Actions for auth and applications |
| `lib/ai/parse-job.ts` | Claude call, schema and the "appears in the text" check |
| `lib/dates.ts` | Shared date rules used by validation and defaults |

`lib/db/*` and `lib/ai/*` import `server-only`, so the build fails if a client component imports them.

## 2. Routes

| Route | Type | Notes |
| --- | --- | --- |
| `/` | Redirect | To `/dashboard` or `/login`, depending on the session |
| `/login`, `/signup` | Client forms with Server Actions | Logged-in users are redirected to `/dashboard` |
| `/dashboard` | Server Component | Stats and table; reads `?status=` and `?q=` |
| `/applications/new` | Form | Includes the job description paste box |
| `/applications/[id]/edit` | Form | Returns a 404 if the id is invalid, missing or not owned |
| `POST /api/parse-job` | Route handler | AI parsing |

`loading.tsx`, `error.tsx` and `not-found.tsx` cover the dashboard and application routes.

## 3. Data

The schema goes in `lib/db/schema.ts`, matching the data model in `CLAUDE.md`.

- **`applications`**
  - Add an index on `(user_id, created_at desc)`.
  - `status` defaults to `applied`.
  - `stack` defaults to an empty array.
  - `updated_at` is set in code on every update.
- **`ai_usage`** has a primary key on `(user_id, day)`.
- **Ordering:** `created_at` descending, with `id` as a tie-break so the order is stable.

### Row Level Security

RLS needs its own migration, generated with `drizzle-kit generate --custom`.

- **`applications`:** owner-only policies for select, insert, update and delete, using `auth.uid()`.
- **`ai_usage`:** RLS is enabled with **no policies**. A write policy would let a user reset their own AI limit through the public Supabase API using the browser key. Drizzle's role bypasses RLS, so the server can still update it.

## 4. Auth and ownership (US-1)

- **`proxy.ts`:** refreshes the session cookie and does the redirects. This is only a first filter, as the Next.js docs warn it shouldn't be the sole protection.
- **`requireUser()`:** called at the start of every protected page, Server Action and route handler, because Server Actions can be reached by direct POST. The user id comes only from here, never from client input. Check the current `@supabase/ssr` docs for the right verified-session call before implementing.
- **Ownership:** update and delete filter on `id` and `user_id` together, and zero affected rows returns not found.
- **Same 404 everywhere:** ids are checked as UUIDs with Zod first. A malformed id, a missing id and another user's id then all give the same 404, rather than a database error.
- **Real 404 status:** a page that has started streaming is stuck on status 200, so `proxy.ts` looks up the edit page's id first, using the user's session so RLS applies. The page still checks ownership with Drizzle. Edit links don't prefetch, so the dashboard doesn't run one lookup per row.
- **Sign-up:** "Confirm email" is turned off in the Supabase project settings. Sign-up and login errors are shown in the form.
- **Logout:** a Server Action.

## 5. Validation (US-2)

`lib/validation.ts` holds the shared application schema, which runs on the server for every create and update.

- **Company and role:** trimmed, required, up to 200 characters.
- **Salary and notes:** up to 100 and 5,000 characters; empty becomes null.
- **Link:** trimmed; empty becomes null. `https://` is added when no scheme is present, then the value must parse as an http or https URL.
- **Stack:** a comma-separated string becomes an array, with entries trimmed, empties dropped and case-insensitive duplicates removed. The first spelling is kept.
- **Applied date:** must be a valid date and not in the future. The server can't trust the browser's timezone, so "future" means later than today's date in the furthest-ahead timezone (UTC+14). A date up to about a day ahead can pass the server check, but the form's own check uses the browser's date.
- **Displaying links:** the table shows a link only if it is http or https, even though saving already enforces this. Rows could otherwise be written through the Supabase API with the owner's own session.

### Date and status rules

- The form sets today's date in the browser after mount, which avoids a server and client mismatch.
- Selecting "saved" on a new application clears the date, and the server also stores null for new saved applications.
- Moving an application to "applied", or from "saved" to "interview" or "offer", sets the date only if it's empty. The browser sends its local date, and the server validates it. This rule applies to both the quick status change and the edit form.
- Moving from "saved" to "rejected" leaves an empty date empty. "Sent this week" only counts applications with a date, so these aren't counted.

## 6. Application form (US-2, US-4, US-5)

One client component, `ApplicationForm`, serves both the new and edit pages. It uses controlled inputs and `useActionState`, so input survives validation errors and AI results can be merged in.

- **Errors:** the action returns errors per field, plus a general error for unexpected failures.
- **Save buttons:** a plain save redirects to `/dashboard`. "Save and add another" resets the form and shows a confirmation.
- **Duplicate warning:** a read-only Server Action runs when the link, company or role field loses focus, and after AI fill. It checks for the same URL, or the same company and role ignoring case, within the user's own applications. It only shows a warning and never blocks saving. This is the first item to cut.

## 7. Dashboard (US-3, US-4, US-6)

### Table

- A Server Component loads all matching rows, since pagination is a non-goal. Only the table scrolls sideways at phone width.
- **Filter and search:** both live in the URL. An unknown `status` value is treated as no filter.
- **Search:** input is debounced and matched case-insensitively against company and role. `%`, `_` and `\` are escaped so they match literally. Search is the second item to cut.
- **Empty states:** "no applications yet" and "nothing matches" are separate messages. The second case runs a count without the filters to tell them apart.

### Quick status change

- A client component uses `useOptimistic` and `useTransition`, following the Next.js interactive apps guide.
- A failed save returns to the previous value automatically and shows an error.
- On success, the dashboard refreshes so stats and filters are up to date. With a status filter on, a changed row can leave the current view, which is expected.

### Delete

An HTML `<dialog>` asks for confirmation, then a Server Action deletes the row permanently.

### Stats

- Status counts use a `GROUP BY` over all of the user's applications, ignoring the filter and search. Missing statuses show as zero.
- **"Sent this week":** the server can't know the browser's timezone. It sends the applied dates of non-saved applications from the last 8 days to a small client component, which counts those on or after its local Monday. A placeholder shows until mount, to avoid a hydration mismatch.

## 8. AI parsing (US-5)

### Request flow in `POST /api/parse-job`

1. `requireUser()`; returns 401 if there's no session.
2. Zod checks the text is non-empty and up to 20,000 characters. If not, returns 400 and nothing is sent or counted.
3. Claim one use of the daily limit with a single atomic upsert that only increments while `count` is below 50. If no row comes back, the limit is reached and it returns 429. Claiming first means parallel requests can't exceed the limit, and a failed call still counts, as the spec requires.
4. Call Claude.
5. Validate the response, then return the fields and the list of fields not found.

The handler should also reject requests whose `Origin` doesn't match the app, because route handlers don't get the origin check Server Actions have.

### Claude call

- Use the official SDK from the server only, with `claude-haiku-5-5` kept in one constant, and `output_config.effort` set to `low`, since this is simple extraction.
- **Output limit:** don't set a tight `max_tokens`. Haiku 5.5 has thinking on by default and it counts toward the limit, so a tight value could stop the response before any answer.
- **One attempt only:** set `maxRetries: 0`, because each SDK retry would be another request that the limit should count. A failure shows a message and the user can try again.
- **Timeout:** about 45 seconds, with the route's `maxDuration` set above it.
- **Output:** structured output through `client.messages.parse` and `zodOutputFormat`, from a Zod schema with nullable company, role, salary and link, and an array for stack.
- **Refusals:** Haiku 5.5 has safety classifiers and no server-side fallback, so a harmless posting, such as a security role, could occasionally be refused. Check `stop_reason` before reading content, and treat a refusal like any other parse failure: the user can still fill in the form by hand.

### Validating the response

- The job description is untrusted, so it goes in the user message as data, and the system prompt says to ignore any instructions in it. No tools are provided.
- The response is validated with Zod. A refusal, `max_tokens` stop, API error or schema failure all return the same result: no fields and a clear message.
- **The spec's "appears in the text" rule is enforced in code, not left to the model.** A value that fails its check is dropped and listed as not found, which stops an invented link or salary from reaching the form.
  - **Link and salary:** must appear exactly as written in the pasted text, including case and spacing. The prompt tells the model to copy them word for word. The link check runs before `https://` is added.
  - **Company, role and each stack entry:** must appear after normalising case and whitespace.
- Returned values then pass the same field rules as the form, including the link check.

### In the form

- The form merges results into empty fields only. Status and date are left alone.
- The message lists the fields that weren't found. Failures, including the limit being reached, show a message and the form stays usable.
- Nothing is saved until the user submits the form.
- **Privacy:** the text is never stored or logged by the app. Error logs record only the error type and status.
- The paste box appears on `/applications/new` only.
- **Cost:** my rough estimate is under $0.01 for a maximum-length job description, so well under $1 per user per day at the limit.

## 9. Security checklist

- Secrets are server-only: `DATABASE_URL` and `ANTHROPIC_API_KEY`. Only the Supabase URL and browser key use `NEXT_PUBLIC_`.
- The Supabase service key isn't needed, so it isn't added.
- `.env*` is already in `.gitignore`.
- Every query takes `userId`, and ownership checks follow `CLAUDE.md` rules 1 to 3.
- Text is rendered through React's escaping, with no raw HTML.

## 10. Implementation order

Each step is one or more small tasks in `docs/tasks.md`, one commit per task, with a separate branch for each user story.

1. **Setup:** dependencies, env template, Supabase and Drizzle clients.
2. **Schema:** tables, indexes, and the RLS migration.
3. **US-1:** auth pages, `proxy.ts`, `requireUser()`, redirects.
4. **Early deploy:** Vercel with env vars, to catch problems while they're cheap to fix.
5. **US-2:** validation and the add form.
6. **US-3:** table, status filter, empty, loading and error states.
7. **US-4:** edit, quick status change, delete.
8. **US-5:** parsing route and form integration. This comes before the remaining items because it can't be cut.
9. **US-6:** stats.
10. **Cuttable items:** search, then the duplicate warning, so that the first to cut is built last.
11. **Finish:** production deploy check, public link in the README, tick off acceptance criteria.

## 11. Verification

The spec doesn't ask for a test framework, so none is added. Each task has manual checks, plus `npm run lint` and `npx tsc --noEmit`. These checks matter most:

- **Isolation:** with two accounts, open, edit, status-change and delete the other account's application id, and confirm a 404 with nothing changed.
- **RLS:** using the browser key and a logged-in session, confirm a direct Supabase API call can't read another user's rows or change `ai_usage`.
- **Secrets:** search the built client bundle for `ANTHROPIC_API_KEY` and `DATABASE_URL`.
- **AI limit:** set the count to 49, send parallel requests, and confirm only one goes through.
- **AI failure:** test with an invalid key, a job description with no link, and text over 20,000 characters. The form must stay usable each time.
- **Timezone:** set the browser to a timezone far from UTC, and check the default date and "sent this week" around midnight and on a Sunday to Monday change.

## 12. Setup needed from you

- A Supabase project with email confirmation turned off, in a region close to the Vercel deployment.
- A Vercel project linked to the repo.
- An Anthropic API key, with a **monthly spend limit set in the Anthropic Console**. The 50-parse limit is per account and sign-up has no email confirmation, so one person could create many accounts. The spend limit is the backstop.
