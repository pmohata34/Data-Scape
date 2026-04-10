# DataScrape Project Synopsis

## Overview
DataScrape is a full-stack data extraction platform where authenticated users can submit a URL, extract structured website data, connect approved social accounts, export results (JSON/CSV), and manage private scrape history. The app uses a React + TypeScript frontend, Supabase for backend services (Auth, Postgres, Edge Functions), and Firecrawl for extraction.

## Core Workflow
1. User signs up/logs in.
2. User submits a website URL.
3. Frontend calls a Supabase Edge Function.
4. Edge Function validates auth and calls Firecrawl API or an approved social connector.
5. Results return to frontend for viewing/export.
6. Metadata is saved in user-specific scrape history.
7. Users can connect Instagram and LinkedIn via OAuth to fetch approved account data.

## Tech Stack and Where It Is Used

### Frontend
- React 18: App UI and component architecture.
  - src/main.tsx
  - src/App.tsx
  - src/pages/Index.tsx
- TypeScript: Type safety across components, API responses, and DB types.
  - src/lib/api/scraper.ts
  - src/integrations/supabase/types.ts
- React Router DOM: Client-side routing.
  - src/App.tsx
- TanStack React Query: Global query client provider setup.
  - src/App.tsx
- Tailwind CSS: Utility-first styling and design tokens.
  - tailwind.config.ts
  - src/index.css
- Framer Motion: UI animations and transitions.
  - src/pages/Index.tsx
  - src/pages/Auth.tsx
  - src/pages/History.tsx
- Lucide React: Icons for UI/UX.
  - src/components/ScraperForm.tsx
  - src/components/ResultsPanel.tsx
- Radix UI + shadcn-style components: Accessible primitives and reusable UI building blocks.
  - src/components/ui/

### Backend and Data
- Supabase Auth: Email/password authentication and session handling.
  - src/hooks/useAuth.tsx
  - src/pages/Auth.tsx
- Supabase Postgres: Stores user profiles and scrape history.
  - supabase/migrations/20260404055731_5fd602b0-3ebd-4864-b9b1-5a299d2ac072.sql
- Row Level Security (RLS): Enforces per-user data access.
  - supabase/migrations/20260404055731_5fd602b0-3ebd-4864-b9b1-5a299d2ac072.sql
- Supabase Edge Functions (Deno): Secure serverless scraping endpoint.
  - supabase/functions/firecrawl-scrape/index.ts
- Supabase Edge Functions (Deno): Social OAuth and approved social-data connectors.
  - supabase/functions/social-oauth/index.ts
  - supabase/functions/social-data/index.ts
- Firecrawl API: External website data extraction engine.
  - supabase/functions/firecrawl-scrape/index.ts
  - src/lib/api/scraper.ts
- Official social APIs:
  - Instagram Graph API via Facebook OAuth in supabase/functions/social-oauth/index.ts
  - LinkedIn OAuth and userinfo API in supabase/functions/social-oauth/index.ts

### Export and History Features
- JSON/CSV export helpers using browser Blob download flow.
  - src/lib/api/scraper.ts
  - src/pages/History.tsx
- History CRUD operations (fetch/delete/save metadata).
  - src/pages/Index.tsx
  - src/pages/History.tsx

### Tooling and Quality
- Vite: Dev server and production build tooling.
  - vite.config.ts
  - package.json scripts
- ESLint + typescript-eslint: Linting and static quality checks.
  - eslint.config.js
- Vitest + Testing Library + jsdom: Unit test environment.
  - vitest.config.ts
  - src/test/example.test.ts
  - src/test/setup.ts

### Deployment
- Vercel: Frontend hosting for SPA build.
  - vercel.json
- Supabase: Backend hosting for Auth, DB, and Edge Functions.
  - supabase/config.toml

## Key Value Proposition
- Secure user-authenticated scraping workflow.
- Structured extraction from static and dynamic pages.
- Export-ready outputs for analytics and automation.
- Private history with row-level data protection.
- Official OAuth connectors for approved Instagram and LinkedIn account data.
- Modern, animated, responsive UI experience.
