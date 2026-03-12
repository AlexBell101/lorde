# Lorde — Product Roadmap

> Cincinnati-focused rental platform connecting renters and landlords.
> Last updated: March 2026

---

## ✅ MVP (Shipped)

- Public property search with interactive map (Mapbox)
- Property listing detail pages with photo grid
- Renter & landlord signup / login (server-side admin flow)
- Supabase auth with role-based access (renter / landlord)
- Seed data: 8 Cincinnati neighborhoods with real coordinates and photos
- Public routes with gated dashboard routes (middleware)
- Stripe integration scaffold
- Vercel deployment with CI/CD

---

## 🟡 Immediate Polish

> Gaps that block core flows before wider sharing

| Feature | Notes |
|---|---|
| Onboarding flow | `/onboarding` protected but empty — collect role-specific info post-signup |
| Email notifications | Signup confirmation, application status updates |
| Listing photos in map search cards | Cards show no image currently |
| Mobile responsiveness | Map search UX needs work on small screens |

---

## 🟢 Phase 1 — Core Product (Months 1–3)

### Renter
- [ ] **Application form** — income, employment, references, pets, move-in date
- [ ] **Saved / favorited listings** — heart button on search, saved tab in dashboard
- [ ] **Application status tracker** — submitted → under review → approved / rejected
- [ ] **Lease viewer** — view and e-sign lease once approved
- [ ] **Rent payment portal** — pay via Stripe (ACH + card), payment history
- [ ] **Maintenance request submission** — photo upload, category, description

### Landlord
- [ ] **Add / edit listing UI** — full CRUD for properties, units, listings
- [ ] **Applicant review queue** — compare applicants, approve / reject with message
- [ ] **Tenant management** — current tenants per unit, lease dates, contact info
- [ ] **Rent collection dashboard** — who's paid, who's late, send reminders
- [ ] **Maintenance request inbox** — view, assign, update status, close

### Shared
- [ ] **In-app messaging** — threaded conversations between renters and landlords
- [ ] **AI listing copy generator** — Claude writes listing descriptions from landlord inputs
- [ ] **Support portal** — ticket submission for renters/landlords; agent resolution at `/supportportal`

---

## 🔵 Phase 2 — Growth Features (Months 4–6)

- [ ] **AI leasing agent** — Claude-powered chat widget on listing pages; answers questions, schedules tours, pre-qualifies renters
- [ ] **Smart pricing engine** — Claude + market data recommends optimal rent per unit based on comps, seasonality, and vacancy
- [ ] **Tenant screening** — TransUnion SmartMove or Checkr integration for background / credit checks
- [ ] **Automated rent reminders** — email / SMS 3 days before due via Supabase scheduled functions
- [ ] **Lease renewal workflow** — notify tenant 60 days out, landlord sends new terms, tenant counters or accepts
- [ ] **Landlord analytics dashboard** — occupancy rate, avg days to lease, revenue per unit, maintenance cost tracking
- [ ] **Document vault** — upload pay stubs, ID, lease agreements; RLS-protected Supabase storage
- [ ] **Multi-property syndication** — push listings to Zillow / Apartments.com via their APIs
- [ ] **Review system** — renters review landlords after lease ends, landlords review tenants
- [ ] **Referral program** — renters refer friends, earn rent credit
- [ ] **Saved searches + alerts** — save filter combos, email when new matches appear

---

## 🔴 2.0 Vision (Months 7–12+)

| Feature | Description |
|---|---|
| **Virtual tours** | Matterport / video walk-through embed on listing detail |
| **Mobile app** | React Native + Expo — push notifications for application updates and rent due |
| **Multi-city expansion** | Detroit, Cleveland, Columbus — same codebase, city-specific configs |
| **Institutional landlord tier** | Portfolio view for 20+ unit landlords, bulk actions, team roles |
| **Utility concierge** | Partner with utility companies — set up electric / gas / internet from move-in confirmation |
| **Mover marketplace** | Partner with Cincinnati movers — in-app booking after lease signed |
| **Predictive maintenance** | Track maintenance history per unit, surface patterns and cost trends |
| **Stripe Capital integration** | Offer landlords small business loans against rental income history |

---

## 🛟 Support Portal — Detailed Spec

### User-facing (renter / landlord dashboards)
- "Get help" button → ticket form: category (billing, maintenance, application, account), subject, description, optional screenshot
- Ticket list with status: Open / In Progress / Resolved
- In-ticket message thread with support agent

### Agent-facing (`/supportportal`)
- Separate login — agents have `role = 'support'` in `profiles`
- Ticket queue: all / open / mine / by category / by priority
- Ticket detail: full user context (their listings, applications, account), message thread, status controls
- Assign to agent, set priority (low / medium / high / urgent), close with resolution note
- Metrics: avg resolution time, open ticket count, volume by category

### Schema additions
```sql
-- Support tickets
create table support_tickets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  category text not null, -- 'billing' | 'maintenance' | 'application' | 'account' | 'other'
  subject text not null,
  status text default 'open', -- 'open' | 'in_progress' | 'resolved'
  priority text default 'low', -- 'low' | 'medium' | 'high' | 'urgent'
  assigned_to uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Support messages (threaded)
create table support_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references support_tickets(id) on delete cascade,
  sender_id uuid references public.profiles(id),
  body text not null,
  created_at timestamptz default now()
);
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS v3, shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Payments | Stripe |
| Maps | Mapbox / react-map-gl v8 |
| AI | Anthropic Claude API |
| Deployment | Vercel |
