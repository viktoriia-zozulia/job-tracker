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
- [ ] I can never see or change another user's applications, even by guessing an id

### US-2: Add an application

As a user, I can add an application with: company, role, link, stack, salary, status, applied date, notes.

- [ ] Company and role are required; the rest is optional
- [ ] Invalid input (empty company, broken URL) shows a clear error
- [ ] Validation happens on the server, not only in the form
- [ ] New applications default to status "applied" and today's date

### US-3: See and filter applications

As a user, I can see all my applications in a table, newest first, and filter by status.

- [ ] Statuses: saved, applied, interview, offer, rejected
- [ ] Empty state when I have no applications
- [ ] Loading and error states are shown

### US-4: Edit and delete

As a user, I can edit any field, change the status quickly, and delete an application.

- [ ] Delete asks for confirmation
- [ ] Changing status updates the list without a full page reload

### US-5: Fill from job description (AI)

As a user, I can paste a job description and get the form prefilled with company, role, stack, salary and link.

- [ ] The text is sent to the Claude API from the server only; the API key never reaches the browser
- [ ] The model's response is validated; if it is broken or missing fields, I still get an editable form and a clear message
- [ ] I review and confirm before anything is saved

### US-6: Stats

As a user, I can see how many applications I sent this week and how many are in each status.

## Non-goals (not in this version)

- Email or calendar integrations
- Reminders and notifications
- Team or shared boards
- Mobile app

## Constraints

- Stack: Next.js (App Router), TypeScript, Tailwind, Supabase (Postgres + Auth), Drizzle, Zod, Claude API, Vercel
- Must be deployed and usable by the end of one day
- Security rules from CLAUDE.md apply to every task

## Definition of done

- All acceptance criteria above are checked
- Lint and type check pass
- Deployed on Vercel with a public link in the README

Claude finished the response
