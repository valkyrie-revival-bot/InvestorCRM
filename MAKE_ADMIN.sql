-- Run this AFTER running ALL_MIGRATIONS.sql
-- Replace YOUR_EMAIL with the email you used to sign in

-- First, find your user_id from auth.users
select id, email from auth.users;

-- Then insert your admin role (replace the UUID below with your actual user_id from above)
insert into public.user_roles (user_id, role)
values (
  (select id from auth.users where email = 'YOUR_EMAIL_HERE'),
  'admin'
);

-- Verify it worked
select u.email, ur.role 
from auth.users u
join public.user_roles ur on ur.user_id = u.id;
