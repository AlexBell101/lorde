-- Allow anonymous users to view properties that have active listings
-- (needed for public /search page)

drop policy if exists "Authenticated users can view active listed properties" on public.properties;
create policy "Anyone can view active listed properties" on public.properties
  for select using (
    exists (
      select 1 from public.listings
      where property_id = properties.id
      and status = 'active'
    )
  );

-- Allow anonymous users to view available units
drop policy if exists "Authenticated users can view available units" on public.units;
create policy "Anyone can view available units" on public.units
  for select using (status = 'available');

-- Landlords can view renter profiles for applicants to their listings
-- (moved here from 001 to avoid forward-reference errors)
drop policy if exists "Landlords can view renter profiles for their applications" on public.renter_profiles;
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
