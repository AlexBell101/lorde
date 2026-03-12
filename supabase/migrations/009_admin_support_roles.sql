-- Add admin and support roles to user_role enum
alter type user_role add value if not exists 'admin';
alter type user_role add value if not exists 'support';
