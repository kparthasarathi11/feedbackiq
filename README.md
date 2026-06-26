# FeedbackIQ

AI-powered feedback triage for Product Managers. Submit feedback, get instant AI tagging (sentiment, priority, themes), and manage everything from a clean admin dashboard.

Built by [Partha Sarathi Komati](https://linkedin.com/in/partha-sarathi-komati)

---

## Stack

- **Frontend** — React + Vite + Tailwind CSS
- **Auth + DB** — Supabase
- **AI Analysis** — Google Gemini 1.5 Flash (free tier)
- **Hosting** — Vercel

## Features

- Email auth with role-based access (user / admin)
- Submit feedback with AI instant tagging
- Sentiment analysis (Positive / Neutral / Negative)
- Priority scoring (High / Medium / Low)
- Auto-generated tags and one-line summary
- Admin dashboard with filters and theme clustering
- Inline edit — override AI tags with human judgment
- Visual diff between AI-original and human-edited tags
- One-click revert to AI original
- PSK personal branding footer

## Setup

### 1. Clone and install
```bash
git clone https://github.com/kparthasarathi11/feedbackiq
cd feedbackiq
npm install
```

### 2. Environment variables
Copy `.env.example` to `.env` and fill in your Supabase values:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Supabase setup
- Run the SQL from `supabase/schema.sql` in your Supabase SQL editor
- Add `GEMINI_API_KEY` to Supabase Edge Function secrets
- Deploy the edge function: `supabase functions deploy analyze-feedback`

### 4. Set yourself as admin
After signing up, run in Supabase SQL editor:
```sql
update profiles set role = 'admin' where email = 'your@email.com';
```

### 5. Run locally
```bash
npm run dev
```

## Deploy
Connect your GitHub repo to Vercel. Add the env variables in Vercel dashboard. Every push auto-deploys.
