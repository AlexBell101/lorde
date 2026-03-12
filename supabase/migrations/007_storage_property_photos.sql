-- ============================================================
-- 007_storage_property_photos.sql
-- Supabase Storage bucket for landlord property photos
-- ============================================================

-- Create the bucket (public so photos are accessible without auth)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-photos',
  'property-photos',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Authenticated users can upload photos
create policy "Authenticated users can upload property photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-photos');

-- Anyone can view property photos (bucket is public)
create policy "Public can view property photos"
  on storage.objects for select
  using (bucket_id = 'property-photos');

-- Authenticated users can update (overwrite) their own uploads
create policy "Authenticated users can update property photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'property-photos');

-- Authenticated users can delete their own uploads
create policy "Authenticated users can delete property photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-photos');
