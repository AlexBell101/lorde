-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('landlord', 'renter');
create type property_type as enum ('apartment', 'house', 'condo', 'townhouse', 'commercial');
create type unit_status as enum ('available', 'occupied', 'maintenance', 'reserved');
create type listing_status as enum ('draft', 'active', 'paused', 'rented');
create type application_status as enum ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');
create type screening_status as enum ('pending', 'in_progress', 'completed');
create type lease_status as enum ('active', 'expired', 'terminated', 'renewed');
create type payment_type as enum ('rent', 'deposit', 'late_fee', 'maintenance', 'other');
create type payment_status as enum ('pending', 'processing', 'completed', 'failed', 'refunded');
create type maintenance_category as enum ('plumbing', 'electrical', 'hvac', 'appliance', 'structural', 'other');
create type maintenance_priority as enum ('low', 'medium', 'high', 'emergency');
create type maintenance_status as enum ('open', 'in_progress', 'completed', 'cancelled');
create type syndication_target as enum ('zillow', 'apartments_com', 'facebook_marketplace', 'craigslist');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role user_role not null,
  avatar_url text,
  phone text,
  stripe_customer_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- RENTER PROFILES
-- ============================================================
create table public.renter_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  monthly_income numeric(10,2),
  employment_status text,
  employer_name text,
  credit_score_range text,
  rental_history jsonb default '[]'::jsonb,
  personal_references jsonb default '[]'::jsonb,
  income_verification_docs text[] default '{}',
  has_pets boolean default false,
  pet_details text,
  move_in_date date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.renter_profiles enable row level security;

create policy "Renters can view own profile" on public.renter_profiles
  for select using (auth.uid() = user_id);

create policy "Landlords can view renter profiles for their applications" on public.renter_profiles
  for select using (
    exists (
      select 1 from public.applications a
      join public.listings l on l.id = a.listing_id
      join public.properties p on p.id = l.property_id
      where a.renter_id = renter_profiles.user_id
      and p.landlord_id = auth.uid()
    )
  );

create policy "Renters can manage own profile" on public.renter_profiles
  for all using (auth.uid() = user_id);

-- ============================================================
-- PROPERTIES
-- ============================================================
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  landlord_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip_code text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  description text,
  property_type property_type not null default 'apartment',
  total_units integer not null default 1,
  year_built integer,
  amenities text[] default '{}',
  photos text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.properties enable row level security;

create policy "Landlords can manage own properties" on public.properties
  for all using (auth.uid() = landlord_id);

create policy "Authenticated users can view active listed properties" on public.properties
  for select using (
    auth.role() = 'authenticated'
    and exists (
      select 1 from public.listings
      where property_id = properties.id
      and status = 'active'
    )
  );

-- ============================================================
-- UNITS
-- ============================================================
create table public.units (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_number text not null,
  bedrooms integer not null default 1,
  bathrooms numeric(3,1) not null default 1,
  square_feet integer,
  rent_amount numeric(10,2) not null,
  deposit_amount numeric(10,2) not null default 0,
  status unit_status not null default 'available',
  floor integer,
  features text[] default '{}',
  photos text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (property_id, unit_number)
);

alter table public.units enable row level security;

create policy "Landlords can manage units of own properties" on public.units
  for all using (
    exists (
      select 1 from public.properties
      where id = units.property_id
      and landlord_id = auth.uid()
    )
  );

create policy "Authenticated users can view available units" on public.units
  for select using (
    auth.role() = 'authenticated'
    and status = 'available'
  );

create policy "Tenants can view their own unit" on public.units
  for select using (
    exists (
      select 1 from public.leases
      where unit_id = units.id
      and renter_id = auth.uid()
      and status = 'active'
    )
  );

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  title text not null,
  description text not null default '',
  rent_amount numeric(10,2) not null,
  available_date date not null,
  lease_term_months integer not null default 12,
  status listing_status not null default 'draft',
  ai_generated boolean default false,
  syndication_targets syndication_target[] default '{}',
  syndication_status jsonb default '{}'::jsonb,
  views integer default 0,
  inquiries integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.listings enable row level security;

create policy "Landlords can manage own listings" on public.listings
  for all using (
    exists (
      select 1 from public.properties
      where id = listings.property_id
      and landlord_id = auth.uid()
    )
  );

create policy "Anyone can view active listings" on public.listings
  for select using (status = 'active');

create index listings_status_idx on public.listings(status);
create index listings_property_id_idx on public.listings(property_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  renter_id uuid references public.profiles(id) on delete cascade not null,
  status application_status not null default 'draft',
  monthly_income numeric(10,2) not null,
  employment_status text not null,
  employer_name text,
  employment_years numeric(4,1),
  credit_score_range text not null,
  has_pets boolean default false,
  pet_details text,
  move_in_date date not null,
  additional_notes text,
  documents text[] default '{}',
  screening_status screening_status not null default 'pending',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (listing_id, renter_id)
);

alter table public.applications enable row level security;

create policy "Renters can manage own applications" on public.applications
  for all using (auth.uid() = renter_id);

create policy "Landlords can view applications for their listings" on public.applications
  for select using (
    exists (
      select 1 from public.listings l
      join public.properties p on p.id = l.property_id
      where l.id = applications.listing_id
      and p.landlord_id = auth.uid()
    )
  );

create policy "Landlords can update application status for their listings" on public.applications
  for update using (
    exists (
      select 1 from public.listings l
      join public.properties p on p.id = l.property_id
      where l.id = applications.listing_id
      and p.landlord_id = auth.uid()
    )
  );

-- ============================================================
-- LEASES
-- ============================================================
create table public.leases (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id) on delete cascade not null,
  landlord_id uuid references public.profiles(id) not null,
  renter_id uuid references public.profiles(id) not null,
  application_id uuid references public.applications(id),
  start_date date not null,
  end_date date not null,
  rent_amount numeric(10,2) not null,
  deposit_amount numeric(10,2) not null default 0,
  status lease_status not null default 'active',
  payment_due_day integer not null default 1 check (payment_due_day between 1 and 28),
  late_fee_amount numeric(10,2) not null default 50,
  late_fee_grace_days integer not null default 5,
  autopay_enabled boolean default false,
  stripe_subscription_id text,
  documents text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.leases enable row level security;

create policy "Landlords can manage leases for their properties" on public.leases
  for all using (auth.uid() = landlord_id);

create policy "Renters can view own leases" on public.leases
  for select using (auth.uid() = renter_id);

create policy "Renters can update own autopay setting" on public.leases
  for update using (auth.uid() = renter_id)
  with check (auth.uid() = renter_id);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  lease_id uuid references public.leases(id) on delete cascade not null,
  renter_id uuid references public.profiles(id) not null,
  landlord_id uuid references public.profiles(id) not null,
  amount numeric(10,2) not null,
  type payment_type not null default 'rent',
  status payment_status not null default 'pending',
  due_date date not null,
  paid_date timestamptz,
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.payments enable row level security;

create policy "Renters can view own payments" on public.payments
  for select using (auth.uid() = renter_id);

create policy "Landlords can view payments for their properties" on public.payments
  for select using (auth.uid() = landlord_id);

create policy "Service role manages payments" on public.payments
  for all using (auth.role() = 'service_role');

create index payments_lease_id_idx on public.payments(lease_id);
create index payments_due_date_idx on public.payments(due_date);
create index payments_status_idx on public.payments(status);

-- ============================================================
-- MAINTENANCE REQUESTS
-- ============================================================
create table public.maintenance_requests (
  id uuid default uuid_generate_v4() primary key,
  property_id uuid references public.properties(id) on delete cascade not null,
  unit_id uuid references public.units(id),
  lease_id uuid references public.leases(id),
  renter_id uuid references public.profiles(id) not null,
  landlord_id uuid references public.profiles(id) not null,
  title text not null,
  description text not null,
  category maintenance_category not null default 'other',
  priority maintenance_priority not null default 'medium',
  status maintenance_status not null default 'open',
  photos text[] default '{}',
  landlord_notes text,
  scheduled_date timestamptz,
  completed_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.maintenance_requests enable row level security;

create policy "Renters can create and view own requests" on public.maintenance_requests
  for all using (auth.uid() = renter_id);

create policy "Landlords can view and manage requests for their properties" on public.maintenance_requests
  for all using (auth.uid() = landlord_id);

create index maintenance_status_idx on public.maintenance_requests(status);
create index maintenance_priority_idx on public.maintenance_requests(priority);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  landlord_id uuid references public.profiles(id) not null,
  renter_id uuid references public.profiles(id) not null,
  property_id uuid references public.properties(id),
  listing_id uuid references public.listings(id),
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now() not null,
  unique (landlord_id, renter_id, listing_id)
);

alter table public.conversations enable row level security;

create policy "Users can view own conversations" on public.conversations
  for select using (auth.uid() = landlord_id or auth.uid() = renter_id);

create policy "Users can create conversations" on public.conversations
  for insert with check (auth.uid() = renter_id or auth.uid() = landlord_id);

create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) not null,
  receiver_id uuid references public.profiles(id) not null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert messages in their conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations
      where id = messages.conversation_id
      and (landlord_id = auth.uid() or renter_id = auth.uid())
    )
  );

create policy "Users can mark own received messages as read" on public.messages
  for update using (auth.uid() = receiver_id);

create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at desc);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.renter_profiles
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.properties
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.units
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.listings
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.applications
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.leases
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.payments
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.maintenance_requests
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'renter')::user_role
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: Auto-create renter profile
-- ============================================================
create or replace function public.handle_new_renter_profile()
returns trigger as $$
begin
  if new.role = 'renter' then
    insert into public.renter_profiles (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_renter_profile();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-photos', 'property-photos', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('documents', 'documents', false, 52428800, array['application/pdf','image/jpeg','image/png']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies
create policy "Property photos are publicly viewable" on storage.objects
  for select using (bucket_id = 'property-photos');

create policy "Landlords can upload property photos" on storage.objects
  for insert with check (
    bucket_id = 'property-photos'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users can upload documents" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
  );

create policy "Users can view own documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Avatars are publicly viewable" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
