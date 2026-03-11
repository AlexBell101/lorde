# Lorde — Modern Rental Property Platform

A full-stack rental platform with a landlord dashboard and renter experience, built with Next.js 14, Supabase, Stripe, and Mapbox.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark-first) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe Checkout |
| Maps | Mapbox GL JS |
| AI Copy | Anthropic Claude (claude-sonnet-4-6) |
| Deployment | Vercel |
| CI/CD | GitHub Actions → Vercel |

---

## Features

### Landlord Side
- **Property & unit management** — Add properties with photos, amenities, and unit details
- **AI listing creation** — Generate compelling listing copy from property details with one click
- **AI price recommendation** — Get data-driven rent pricing based on ZIP code comparables
- **Listing syndication** — Queue listings to Zillow, Apartments.com, Facebook Marketplace, Craigslist
- **Tenant management** — Review applications, screen applicants, approve/reject
- **Rent collection** — Track payments, view history, P&L per property
- **Maintenance inbox** — Priority-based request tracking with status updates

### Renter Side
- **Map-first search** — Dark Mapbox map with price markers and commute overlays
- **Advanced filters** — Rent range, bedrooms, pet-friendly, availability date
- **Renter profile** — Reusable profile with income, employment, rental history, references
- **One-click apply** — Apply to listings with pre-filled profile data
- **Payment portal** — Pay rent online, enable autopay, view history
- **Maintenance requests** — Submit and track maintenance issues
- **In-app messaging** — Real-time chat with landlords

### Background Jobs (Supabase Edge Functions)
- `rent-reminders` — Daily reminders 3 days before rent is due
- `late-fees` — Auto-assess late fees after grace period expires
- `syndication-queue` — Process listing syndication every 30 minutes
- `create-monthly-payments` — Auto-create rent payment records on the 1st of each month

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account
- A [Stripe](https://stripe.com) account
- A [Mapbox](https://mapbox.com) account
- An [Anthropic](https://anthropic.com) API key
- A [Vercel](https://vercel.com) account + GitHub repo

---

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/lorde
cd lorde
npm install
```

---

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **Anon Key** from Settings > API
3. Note your **Service Role Key** from Settings > API (keep secret!)

#### Run migrations

In your Supabase project, go to **SQL Editor** and run:
- `supabase/migrations/001_initial_schema.sql` — full schema with RLS
- `supabase/migrations/002_edge_function_schedules.sql` — cron job setup (requires pg_cron extension)

To enable pg_cron: **Database > Extensions > pg_cron**

---

### 3. Configure Mapbox

1. Go to [mapbox.com](https://mapbox.com) → Create account → Tokens
2. Create a public token with `styles:read` and `tiles:read` scopes
3. Copy the `pk.` token

---

### 4. Configure Stripe

1. Go to [stripe.com](https://stripe.com) → Dashboard → API keys
2. Copy your publishable key (`pk_test_...`) and secret key (`sk_test_...`)
3. Set up webhook endpoint (see step 6)

---

### 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your-mapbox-token

# Stripe
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### 6. Set Up Stripe Webhook

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Listen for webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret (`whsec_...`) into your `.env.local`.

For production: Add `https://your-app.vercel.app/api/stripe/webhook` in the Stripe dashboard under Webhooks.

---

### 7. Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy edge functions
supabase functions deploy rent-reminders
supabase functions deploy late-fees
supabase functions deploy syndication-queue
```

---

### 8. Deploy to Vercel

#### Via GitHub (recommended)

1. Push your code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New project → Import your repo
3. Add all environment variables in the Vercel dashboard (Project Settings > Environment Variables)
4. Deploy!

#### Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

### 9. GitHub Actions CI/CD

Add these secrets to your GitHub repo (Settings > Secrets > Actions):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Vercel will automatically deploy on every push to `main` via its GitHub integration.

---

## Project Structure

```
lorde/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, signup, onboarding
│   │   ├── (dashboard)/
│   │   │   ├── landlord/    # Properties, listings, tenants, payments, maintenance
│   │   │   ├── renter/      # Search, applications, payments, maintenance, profile
│   │   │   └── messages/    # Real-time messaging
│   │   └── api/             # API routes (AI, Stripe, applications)
│   ├── components/
│   │   ├── ui/              # Core UI components (button, card, dialog, etc.)
│   │   ├── landlord/        # Landlord-specific components
│   │   ├── renter/          # Renter-specific components
│   │   └── shared/          # Sidebar, messages, maintenance status
│   ├── lib/
│   │   ├── supabase/        # Client, server, middleware, admin
│   │   └── utils.ts         # Helpers (formatCurrency, formatDate, etc.)
│   ├── types/               # TypeScript interfaces
│   └── middleware.ts         # Auth middleware
├── supabase/
│   ├── migrations/          # SQL schema + RLS policies + cron jobs
│   ├── functions/           # Edge Functions (rent-reminders, late-fees, syndication)
│   └── config.toml          # Local dev config
├── .github/workflows/       # CI/CD pipeline
└── vercel.json              # Vercel deployment config
```

---

## Database Schema

| Table | Description |
|---|---|
| `profiles` | User accounts (landlord or renter) |
| `renter_profiles` | Extended renter data (income, history, references) |
| `properties` | Properties owned by landlords |
| `units` | Individual units within properties |
| `listings` | Active/draft listings tied to units |
| `applications` | Renter applications for listings |
| `leases` | Active lease agreements |
| `payments` | Rent and fee payment records |
| `maintenance_requests` | Maintenance tickets |
| `conversations` | Message threads |
| `messages` | Individual messages |

All tables have **Row Level Security** enabled. Landlords can only see their own data. Renters can only see their own leases, applications, and payments.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/ai/generate-listing` | POST | AI listing copy generation |
| `/api/ai/price-recommendation` | POST | AI rent price recommendation |
| `/api/stripe/create-payment` | POST | Create Stripe Checkout session |
| `/api/stripe/webhook` | POST | Stripe webhook handler |
| `/api/applications/[id]` | POST | Update application status |

---

## Development

```bash
# Start development server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Listing Syndication

The syndication system generates platform-specific export formats:

- **Zillow**: JSON with address, price, bedrooms, description
- **Apartments.com**: Extended Zillow format
- **Facebook Marketplace**: Title, price, location, description
- **Craigslist**: HTML-formatted posting

In production, replace the logging in `supabase/functions/syndication-queue/index.ts` with actual API calls to each platform's submission endpoint.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a pull request

---

## License

MIT
