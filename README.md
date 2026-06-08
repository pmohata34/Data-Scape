# DataScrape

Extract structured data from websites and export the results as JSON or CSV. DataScrape combines a clean authenticated UI with Supabase, Firecrawl, Apify, and edge functions for a practical scraping workflow.

## Features

- Secure login with Supabase Auth
- Submit a URL and extract structured website data
- Instagram and LinkedIn integrations through Apify and RapidAPI fallback flows
- Export scrape results as JSON or CSV
- Save scrape history per user account
- Responsive UI for desktop, tablet, and mobile
- Row-level security and authenticated database access

## Tech Stack

- React 18, TypeScript, Vite
- Tailwind CSS and Framer Motion
- Supabase Auth, PostgreSQL, and Edge Functions
- Firecrawl, Apify, and RapidAPI integrations
- Vercel frontend deployment

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
APIFY_API_TOKEN=your_apify_api_token
RAPIDAPI_KEY=your_rapidapi_key
```

The app runs locally at `http://localhost:5173`.

## Available Commands

```bash
npm run dev
npm run build
npm run preview
npm run test
npm run lint
```

## How It Works

1. Sign up or log in.
2. Submit a website URL.
3. DataScrape extracts and stores structured results.
4. Download the saved scrape as JSON or CSV.

## Project Structure

```text
src/
  pages/          App pages
  components/     UI widgets and forms
  hooks/          Custom React hooks
  lib/            Utilities and API calls
  integrations/   Supabase client

supabase/
  functions/      Edge functions
  migrations/     Database schema
```

## Deployment

- Frontend: deploy to Vercel.
- Backend: create a Supabase project, run migrations, deploy edge functions, and configure cloud secrets.
