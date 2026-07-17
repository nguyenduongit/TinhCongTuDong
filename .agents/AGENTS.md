# TinhCongTuDong Workspace Rules

This file defines project-specific rules and context for AI agents working in this repository.

## General
- This is a frontend-heavy project for automated salary calculation.
- Primary language is **TypeScript**. Avoid using plain JavaScript.

## Package Manager
- **ALWAYS use `pnpm`** for managing dependencies and running scripts.
- Do NOT use `npm` or `yarn`.

## Tech Stack & Frameworks
- **React**: Functional components and Hooks only.
- **Vite**: Used for building and dev server.
- **Tailwind CSS v4**: Use utility classes for styling. Do NOT use inline styles unless absolutely necessary.
- **Supabase**: Backend-as-a-Service for Auth, PostgreSQL Database, and Edge Functions.
- **Routing**: `wouter` is used for client-side routing.
- **Form Handling**: Use `react-hook-form` along with `zod` for validation.
- **UI Components**: Use `Radix UI` components integrated with Tailwind CSS.

## Edge Functions
- Supabase Edge Functions are written in Deno (TypeScript).
- Entry points are located in `supabase/functions/*/index.ts`.

## Deployment
- Project is likely deployed on Vercel (indicated by `vercel.json`) or Supabase hosting. Keep edge functions deployable via Supabase CLI.

## Workflow Rules
- Before installing new packages, confirm with the user unless it is extremely standard for the task.
- Check `package.json` for existing solutions (e.g. `sonner` for toasts) instead of installing new ones.
