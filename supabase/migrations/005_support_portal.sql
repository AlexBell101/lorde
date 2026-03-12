-- ============================================================
-- SUPPORT PORTAL
-- Adds support role, support_tickets and support_messages tables
-- Run in Supabase SQL Editor
-- ============================================================

-- Add 'support' to user_role enum
alter type user_role add value if not exists 'support';

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================
create table public.support_tickets (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.profiles(id) on delete cascade not null,
  category     text not null check (category in ('billing', 'maintenance', 'application', 'account', 'other')),
  subject      text not null,
  body         text not null,
  status       text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority     text not null default 'low' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to  uuid references public.profiles(id),
  created_at   timestamptz default now() not null,
  updated_at   timestamptz default now() not null
);

alter table public.support_tickets enable row level security;

-- Users can see and create their own tickets
create policy "Users can view own tickets" on public.support_tickets
  for select using (auth.uid() = user_id);

create policy "Users can create tickets" on public.support_tickets
  for insert with check (auth.uid() = user_id);

-- Support agents can see all tickets
create policy "Support agents can view all tickets" on public.support_tickets
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'support'
    )
  );

create policy "Support agents can update tickets" on public.support_tickets
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'support'
    )
  );

-- ============================================================
-- SUPPORT MESSAGES
-- ============================================================
create table public.support_messages (
  id        uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.support_tickets(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  body      text not null,
  created_at timestamptz default now() not null
);

alter table public.support_messages enable row level security;

-- Users can read messages on their own tickets; agents can read all
create policy "Users can view messages on own tickets" on public.support_messages
  for select using (
    exists (
      select 1 from public.support_tickets
      where id = ticket_id and user_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'support'
    )
  );

create policy "Ticket owner and agents can send messages" on public.support_messages
  for insert with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from public.support_tickets
        where id = ticket_id and user_id = auth.uid()
      )
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'support'
      )
    )
  );

-- updated_at trigger
create trigger support_tickets_updated_at
  before update on public.support_tickets
  for each row execute function update_updated_at();
