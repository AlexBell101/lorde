-- ============================================================
-- SEED DATA — Demo listings for map search
-- Run this AFTER 001_initial_schema.sql in Supabase SQL Editor
-- ============================================================

-- Create a demo landlord in auth.users
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values (
  'a0000000-0000-0000-0000-000000000001',
  'demo-landlord@lorde.app',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"full_name": "Demo Landlord", "role": "landlord"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Create a demo renter in auth.users
insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) values (
  'a0000000-0000-0000-0000-000000000002',
  'demo-renter@lorde.app',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"full_name": "Demo Renter", "role": "renter"}'::jsonb,
  now(),
  now(),
  'authenticated',
  'authenticated'
) on conflict (id) do nothing;

-- Profiles
insert into public.profiles (id, email, full_name, role) values
  ('a0000000-0000-0000-0000-000000000001', 'demo-landlord@lorde.app', 'Demo Landlord', 'landlord'),
  ('a0000000-0000-0000-0000-000000000002', 'demo-renter@lorde.app',   'Demo Renter',   'renter')
on conflict (id) do nothing;

-- ============================================================
-- PROPERTIES (real coordinates across US cities)
-- ============================================================
insert into public.properties (id, landlord_id, name, address, city, state, zip_code, latitude, longitude, property_type, total_units, year_built, amenities, description) values

  ('b0000001-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'The Hayes', '400 Hayes St', 'San Francisco', 'CA', '94102',
   37.7765, -122.4242, 'apartment', 3, 2018,
   ARRAY['Gym', 'Rooftop deck', 'In-unit laundry', 'Pet-friendly', 'Bike storage', 'Doorman'],
   'Modern boutique building in Hayes Valley with rooftop views.'),

  ('b0000001-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'Mission Flats', '2847 Mission St', 'San Francisco', 'CA', '94110',
   37.7510, -122.4183, 'apartment', 4, 2015,
   ARRAY['In-unit laundry', 'Hardwood floors', 'Pet-friendly', 'Storage'],
   'Sunny Mission District apartments with exposed brick.'),

  ('b0000001-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'SoMa Lofts', '888 Brannan St', 'San Francisco', 'CA', '94103',
   37.7712, -122.4034, 'condo', 2, 2020,
   ARRAY['Gym', 'Concierge', 'EV charging', 'Rooftop deck', 'Co-working space'],
   'Industrial-chic lofts in the heart of SoMa.'),

  ('b0000001-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'Noe Valley Cottage', '3980 24th St', 'San Francisco', 'CA', '94114',
   37.7502, -122.4327, 'house', 1, 1910,
   ARRAY['Backyard', 'Parking', 'Pet-friendly', 'Washer/dryer'],
   'Charming Victorian cottage on prime 24th Street.'),

  ('b0000001-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'Marina View', '2100 Chestnut St', 'San Francisco', 'CA', '94123',
   37.8001, -122.4371, 'apartment', 3, 2012,
   ARRAY['Bay views', 'Gym', 'Parking', 'In-unit laundry', 'Pet-friendly'],
   'Bright Marina apartments with Bay Bridge views.'),

  ('b0000001-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'Castro Terrace', '550 Castro St', 'San Francisco', 'CA', '94114',
   37.7609, -122.4350, 'apartment', 2, 2008,
   ARRAY['Hardwood floors', 'In-unit laundry', 'Balcony'],
   'Stylish Castro apartments with vibrant neighborhood access.'),

  ('b0000001-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001',
   'Richmond Flats', '400 Clement St', 'San Francisco', 'CA', '94118',
   37.7833, -122.4639, 'apartment', 4, 2005,
   ARRAY['Pet-friendly', 'Storage', 'Laundry in building'],
   'Quiet Inner Richmond apartments near Golden Gate Park.'),

  ('b0000001-0000-0000-0000-000000000008',
   'a0000000-0000-0000-0000-000000000001',
   'Dogpatch Modern', '800 Illinois St', 'San Francisco', 'CA', '94107',
   37.7598, -122.3877, 'condo', 2, 2022,
   ARRAY['Gym', 'Rooftop deck', 'EV charging', 'Concierge', 'Bike storage'],
   'Brand new Dogpatch condos with waterfront access.')

on conflict (id) do nothing;

-- ============================================================
-- UNITS
-- ============================================================
insert into public.units (id, property_id, unit_number, bedrooms, bathrooms, square_feet, rent_amount, deposit_amount, status) values

  -- The Hayes
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '1A', 1, 1.0, 680,  3200, 3200, 'available'),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', '2B', 2, 2.0, 1050, 4800, 4800, 'available'),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', '3C', 3, 2.0, 1400, 6500, 6500, 'available'),

  -- Mission Flats
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000002', '101', 1, 1.0, 720,  2800, 2800, 'available'),
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002', '202', 2, 1.0, 950,  3600, 3600, 'available'),
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000002', '303', 2, 2.0, 1100, 4200, 4200, 'available'),

  -- SoMa Lofts
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000003', 'L1',  1, 1.0, 800,  3400, 3400, 'available'),
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000003', 'L2',  2, 2.0, 1300, 5500, 5500, 'available'),

  -- Noe Valley Cottage
  ('c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000004', 'Main', 3, 2.0, 1600, 5800, 5800, 'available'),

  -- Marina View
  ('c0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000005', '1',   1, 1.0, 700,  3100, 3100, 'available'),
  ('c0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000005', '2',   2, 2.0, 1200, 4900, 4900, 'available'),
  ('c0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000005', '3',   3, 2.0, 1500, 6800, 6800, 'available'),

  -- Castro Terrace
  ('c0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000006', 'A',   1, 1.0, 650,  2900, 2900, 'available'),
  ('c0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000006', 'B',   2, 1.0, 880,  3800, 3800, 'available'),

  -- Richmond Flats
  ('c0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000007', '1',   0, 1.0, 480,  2100, 2100, 'available'),
  ('c0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000007', '2',   1, 1.0, 650,  2700, 2700, 'available'),
  ('c0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000007', '3',   2, 1.0, 850,  3300, 3300, 'available'),

  -- Dogpatch Modern
  ('c0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000008', '101', 1, 1.0, 750,  3600, 3600, 'available'),
  ('c0000001-0000-0000-0000-000000000019', 'b0000001-0000-0000-0000-000000000008', '201', 2, 2.0, 1150, 5200, 5200, 'available')

on conflict (id) do nothing;

-- ============================================================
-- LISTINGS (active — visible on map search)
-- ============================================================
insert into public.listings (id, property_id, unit_id, title, description, rent_amount, available_date, lease_term_months, status) values

  ('d0000001-0000-0000-0000-000000000001',
   'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001',
   'Sun-drenched 1BR in Hayes Valley',
   'Stunning 1-bedroom in the heart of Hayes Valley featuring hardwood floors, in-unit laundry, and a chef''s kitchen with quartz countertops. Steps from top restaurants, Whole Foods, and the BART. Building has a rooftop deck with panoramic city views and a fully equipped gym.',
   3200, current_date + 7, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000002',
   'b0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000002',
   'Spacious 2BR Hayes Valley with Rooftop',
   'Beautiful 2-bedroom, 2-bath in boutique Hayes Valley building. Open-plan living, stainless steel kitchen, and floor-to-ceiling windows. Access to rooftop deck, gym, and secure bike storage. Pet-friendly — dogs and cats welcome.',
   4800, current_date + 14, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000003',
   'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000004',
   'Bright 1BR Mission District Flat',
   'Sunny 1-bedroom in the vibrant Mission District with exposed brick, hardwood floors, and a renovated kitchen. Walk to Valencia Street dining, Dolores Park, and multiple BART stations. In-unit washer/dryer included.',
   2800, current_date + 3, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000004',
   'b0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000005',
   'Mission 2BR — Walk to BART',
   'Charming 2-bedroom Mission flat steps from 24th St BART. Featuring high ceilings, period details, and a private patio perfect for outdoor dining. Pet-friendly building with excellent walkability score.',
   3600, current_date + 10, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000005',
   'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000007',
   'Industrial SoMa Loft — 1BR',
   'Dramatic loft-style 1-bedroom with 14-foot ceilings, polished concrete floors, and designer fixtures. Located in a converted warehouse with concierge service, EV charging, and a stunning rooftop co-working space. Moments from Caltrain.',
   3400, current_date + 21, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000006',
   'b0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000008',
   'SoMa 2BR Designer Loft',
   'Exceptional 2-bed, 2-bath loft with original brick walls, open kitchen with waterfall island, and two full spa bathrooms. Full building amenities include concierge, gym, rooftop, and EV charging. Move-in ready.',
   5500, current_date + 30, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000007',
   'b0000001-0000-0000-0000-000000000004', 'c0000001-0000-0000-0000-000000000009',
   'Noe Valley Victorian Cottage — 3BR',
   'Rare 3-bedroom cottage on prime 24th Street in coveted Noe Valley. Original Victorian details meet modern renovation — chef''s kitchen, spa master bath, and a private sunny backyard perfect for entertaining. Off-street parking included.',
   5800, current_date + 14, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000008',
   'b0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000010',
   'Marina 1BR with Bay Views',
   'Beautifully appointed 1-bedroom in the Marina with partial Bay Bridge views. Newly renovated with quartz counters, spa bathroom, and hardwood floors. Building has gym and secure parking. Steps from Chestnut Street cafes and Marina Green.',
   3100, current_date + 7, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000009',
   'b0000001-0000-0000-0000-000000000005', 'c0000001-0000-0000-0000-000000000011',
   'Marina 2BR — Steps from the Bay',
   'Stunning 2-bedroom, 2-bath Marina apartment with sweeping Bay views. Gourmet kitchen, in-unit laundry, and generous storage. Parking included. Pet-friendly. Walk to Fort Mason, the marina, and world-class dining on Chestnut Street.',
   4900, current_date + 14, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000010',
   'b0000001-0000-0000-0000-000000000006', 'c0000001-0000-0000-0000-000000000013',
   'Castro 1BR with Character',
   'Sunny 1-bedroom in the heart of the Castro with original hardwood floors, crown molding, and a renovated kitchen. Juliet balcony overlooking Castro Street. Steps from everything the neighborhood has to offer. Available immediately.',
   2900, current_date + 1, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000011',
   'b0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000015',
   'Richmond Studio — Golden Gate Park Steps',
   'Efficient and charming studio in the Inner Richmond, literally one block from Golden Gate Park. Renovated kitchen and bathroom, ample closet space, and laundry in building. Quiet street. Ideal for one person or a couple.',
   2100, current_date + 5, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000012',
   'b0000001-0000-0000-0000-000000000007', 'c0000001-0000-0000-0000-000000000016',
   'Inner Richmond 1BR Near Park',
   'Spacious 1-bedroom in the heart of the Inner Richmond. Hardwood floors, updated kitchen, and large windows. Walk to Clement Street farmers market, ethnic restaurants, and Golden Gate Park trails. Quiet, residential building.',
   2700, current_date + 10, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000013',
   'b0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000018',
   'Brand New Dogpatch 1BR Condo',
   'Just completed 1-bedroom condo in Dogpatch''s newest luxury building. Polished concrete, custom cabinetry, Bosch appliances, and spa bath. Building amenities: rooftop terrace, gym, concierge, and EV charging. Moments from the waterfront and Chase Center.',
   3600, current_date + 30, 12, 'active'),

  ('d0000001-0000-0000-0000-000000000014',
   'b0000001-0000-0000-0000-000000000008', 'c0000001-0000-0000-0000-000000000019',
   'Dogpatch 2BR — New Construction',
   'Rare 2-bedroom, 2-bath in Dogpatch''s premier new development. Designer finishes throughout, open floorplan, private balcony, and in-unit laundry. Full amenity building with panoramic rooftop, co-working lounge, and secured parking.',
   5200, current_date + 30, 12, 'active')

on conflict (id) do nothing;
