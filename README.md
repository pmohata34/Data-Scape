# DataScrape

Extract structured data from any website instantly. Save as JSON or CSV. No hassle, just results.

---

What You Get

- Secure Login - Your data stays yours, no tracking
- Scrape Any Website - Paste URL, get data automatically
- Export Formats - Download as JSON or CSV
- Keep History - All scrapes saved in your account
- Lightning Fast - Results in seconds
- Beautiful UI - Clean, modern, easy to use
- Works Everywhere - Desktop, tablet, mobile
- Built-in Security - Auth + encryption included

---

Tech Stack

Frontend: React 18 • TypeScript • Vite • Tailwind CSS • Framer Motion

Backend: Supabase (Database + Auth) • Edge Functions • PostgreSQL

Deployment: Vercel (frontend) + Supabase (backend)

---

Getting Started

Prerequisites
- Node.js 18+ or Bun
- Git
- Code editor (VS Code recommended)

Installation

1. Clone repository

```bash
git clone https://github.com/yourusername/datascrape.git
cd datascrape
```

2. Install dependencies

```bash
bun install
```

3. Set up environment

Create `.env` file in root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Note: Get these from Supabase project settings → API

4. Run locally

```bash
bun run dev
```

App opens at http://localhost:5173

Available Commands

```bash
bun run dev          # Start dev server (localhost:5173)
bun run build        # Build for production
bun run preview      # Preview production build
bun run test         # Run tests
bun run test:watch   # Tests in watch mode
bun run lint         # Check code style
```

---

How It Works

1. Sign Up - Create account with email
2. Submit URL - DataScrape extracts data
3. Data Saved - Results stored in your account
4. Download - Get JSON or CSV anytime

That's it. Simple and direct.

---

Project Structure

```
src/
├── pages/          # Home, Auth, History
├── components/     # UI widgets & forms
├── hooks/          # Custom React hooks
├── lib/            # Utilities & API calls
└── integrations/   # Supabase client

supabase/
├── functions/      # Edge functions (backend)
└── migrations/     # Database schema

public/             # Static assets
index.html          # Main entry
package.json        # Dependencies
vite.config.ts      # Build config
```

---

Security

Your data is protected:
- JWT authentication
- Database row-level security
- HTTPS encryption
- No selling user data
- No tracking

---

Deploy to Production

Frontend (Vercel):
1. Push code to GitHub
2. Connect repo to vercel.com
3. Add env variables in Vercel settings
4. Deploy (automatic on push)

Backend (Supabase):
1. Create Supabase project
2. Run SQL migrations
3. Deploy edge functions
4. Configure auth settings

---

Troubleshooting

Login issues?
- Check .env has correct Supabase keys
- Open F12 console for error details
- Verify Supabase project is active

Scraping not working?
- User must be logged in first
- Check website is accessible
- Review Supabase dashboard logs

Build errors?
- Delete node_modules & bun.lockb
- Run: bun install
- Restart dev server

---

What's Coming

- Batch URL processing
- Custom CSS selectors
- Data visualization
- Scheduled scraping
- Developer API

---

Contributing

Found a bug or have ideas?

1. Fork the repository
2. Create feature branch: git checkout -b feature/name
3. Commit: git commit -m 'Add feature'
4. Push: git push origin feature/name
5. Open Pull Request

---

Need Help?

- Check code comments
- Open GitHub issues
- Review Supabase docs: supabase.com/docs
- Check Vercel docs: vercel.com/docs

---

Built with React • Tailwind • Supabase • Vercel
