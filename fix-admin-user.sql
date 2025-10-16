-- Fix Admin User Creation for EUDA Portal
-- Run this in Supabase SQL Editor: https://gzzgsyeqpnworczllraa.supabase.co

-- Step 1: Check if user already exists
SELECT * FROM admin_users WHERE email = 'admin@euda-portal.com';

-- Step 2: Delete existing user if any (optional - only if recreating)
-- DELETE FROM admin_users WHERE email = 'admin@euda-portal.com';

-- Step 3: Create admin user with ALL required fields
INSERT INTO admin_users (
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  'admin@euda-portal.com',
  '$2a$10$mS4JoddUFJdeCvjpDyyca.sVGp6NwgmtBjF.fVsCEPVewSiO13gvW',
  'EUDA Admin',
  'admin',
  true,
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  password_hash = '$2a$10$mS4JoddUFJdeCvjpDyyca.sVGp6NwgmtBjF.fVsCEPVewSiO13gvW',
  is_active = true,
  role = 'admin';

-- Step 4: Verify the user was created correctly
SELECT
  id,
  email,
  name,
  role,
  is_active,
  created_at,
  CASE
    WHEN password_hash IS NOT NULL THEN 'Password hash exists ✓'
    ELSE 'Password hash MISSING ✗'
  END as password_status
FROM admin_users
WHERE email = 'admin@euda-portal.com';

/*
Expected result:
- email: admin@euda-portal.com
- name: EUDA Admin
- role: admin
- is_active: true
- password_status: Password hash exists ✓

Login Credentials:
- Email: admin@euda-portal.com
- Password: Admin123!
*/
