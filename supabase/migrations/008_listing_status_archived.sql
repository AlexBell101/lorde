-- Add 'archived' to listing_status enum for soft-deleting listings
alter type listing_status add value if not exists 'archived';
