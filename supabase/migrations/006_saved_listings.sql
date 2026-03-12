-- ============================================================
-- 006_saved_listings.sql
-- Saved / favorited listings for renters
-- ============================================================

create table public.saved_listings (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  listing_id  uuid references public.listings(id) on delete cascade not null,
  created_at  timestamptz default now() not null,
  unique(user_id, listing_id)
);

alter table public.saved_listings enable row level security;

-- Users can view their own saved listings
create policy "Users can view own saved listings" on public.saved_listings
  for select using (auth.uid() = user_id);

-- Users can save listings
create policy "Users can save listings" on public.saved_listings
  for insert with check (auth.uid() = user_id);

-- Users can unsave listings
create policy "Users can unsave listings" on public.saved_listings
  for delete using (auth.uid() = user_id);
