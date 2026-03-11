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
