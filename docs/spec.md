# Spec: Job Application Tracker

## Problem

I send many job applications a day across many sites. I lose track of where I applied, what stack each role needs, and which companies replied. Spreadsheets are slow to fill in.

## Goal

A simple web app where I can log applications in seconds, see their status at a glance, and see how my search is going.

## Users

Job seekers (starting with me). Each user sees only their own data.

## User stories and acceptance criteria

### US-1: Account

As a user, I can sign up, log in and log out with email and password.

- [ ] Unauthenticated users who open /dashboard are redirected to /login
- [ ] After login I land on /dashboard
- [ ] After sign-up I land on /dashboard, with no email confirmation step
- [ ] Opening / redirects to /dashboard when logged in, otherwise to /login
- [ ] Logged-in users who open /login are redirected to /dashboard
- [ ] I can never see or change another user's applications, even by guessing an id
- [ ] Another user's application id returns the same 404 as an id that doesn't exist

### US-2: Add an application

As a user, I can add an application with: company, role, link, stack, salary, status, applied date, notes.

- [ ] Company and role are required; the rest is optional
- [ ] Invalid input (empty company, broken URL) shows a clear error
- [ ] Validation happens on the server, not only in the form
- [ ] New applications default to status "applied" and today's date, in my browser's timezone
- [ ] A new application with status "saved" has an empty applied date
- [ ] Moving an application to "applied" sets today's date if the date is empty
- [ ] Whitespace-only company or role counts as empty
- [ ] Limits: company and role 200 characters, salary 100, notes 5,000; applied date can't be in the future
- [ ] A link with no scheme gets https://; only http and https are accepted; an empty link is stored as no link
- [ ] Stack is entered comma-separated and shown as tags, with whitespace trimmed and case-insensitive duplicates removed (the first spelling is kept)
- [ ] "Save and add another" saves and opens an empty form; a plain save returns to /dashboard
- [ ] A non-blocking warning appears when adding an application with the same URL, or the same company and role (case-insensitive), as an existing one

### US-3: See and filter applications

As a user, I can see all my applications in a table, newest first, filter by status, and search by company or role.

- [ ] Statuses: saved, applied, interview, offer, rejected
- [ ] Newest first means by creation time (`created_at`)
- [ ] Filter is single-select and stored in the URL, so it survives a refresh
- [ ] Search is a case-insensitive partial match on company and role, and combines with the status filter
- [ ] Empty state when I have no applications, with a different message when nothing matches the filter or search
- [ ] Loading and error states are shown
- [ ] The table is usable at phone width, scrolling sideways if needed

### US-4: Edit and delete

As a user, I can edit any field, change the status quickly, and delete an application.

- [ ] Delete asks for confirmation and is permanent
- [ ] Changing status updates the list without a full page reload
- [ ] Status changes show immediately and roll back with an error message if the save fails
- [ ] Any status can change to any other status

### US-5: Fill from job description (AI)

As a user, I can paste a job description and get the form prefilled with company, role, stack, salary and link.

- [ ] The text is sent to the Claude API from the server only; the API key never reaches the browser
- [ ] The model's response is validated; if it is broken or missing fields, I still get an editable form and a clear message
- [ ] I review and confirm before anything is saved
- [ ] A field is filled only if its value appears in the pasted text; otherwise it stays blank and the message lists it
- [ ] Parsing fills only empty fields and never overwrites what I typed; status and date keep their defaults
- [ ] A job description can be up to 20,000 characters; longer text gets a clear error and isn't sent
- [ ] Each user gets 50 parses per UTC day; every request sent to the Claude API counts, even if it fails
- [ ] When the limit is reached I see a clear message and can still fill in the form by hand
- [ ] The job description text is not stored or logged

### US-6: Stats

As a user, I can see how many applications I sent this week and how many are in each status.

- [ ] "Sent this week" counts applications with an applied date in the current week and any status except "saved", including ones later rejected
- [ ] The week starts on Monday, in my browser's timezone
- [ ] All five statuses show a count, including zero
- [ ] Stats appear at the top of /dashboard and always cover all my applications, ignoring the filter and search

## Non-goals (not in this version)

- Email or calendar integrations
- Reminders and notifications
- Team or shared boards
- Mobile app
- Password reset and email confirmation
- Pagination
- Fetching a job description from a URL
- Storing the original job description
- Account deletion and data export
- Undo, soft delete and status history
- Reply rate and charts

## Constraints

- Stack: Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres + Auth), Drizzle, Zod, Claude API, Vercel
- Must be deployed and usable by the end of one day
- Security rules from CLAUDE.md apply to every task

## If one day isn't enough

US-5 is not cut. Cut in this order, moving each cut item to non-goals:

1. Duplicate warning (US-2)
2. Search (US-3)

## Definition of done

- All acceptance criteria above are checked, except items cut under "If one day isn't enough"
- Lint and type check pass
- Deployed on Vercel with a public link in the README
