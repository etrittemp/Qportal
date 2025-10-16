-- Create Admin User for EUDA Portal
-- Run this in Supabase SQL Editor: https://gzzgsyeqpnworczllraa.supabase.co

-- Insert admin user
INSERT INTO admin_users (email, password_hash, name, created_at)
VALUES (
  'admin@euda-portal.com',
  '$2a$10$mS4JoddUFJdeCvjpDyyca.sVGp6NwgmtBjF.fVsCEPVewSiO13gvW',
  'EUDA Admin',
  NOW()
);

-- Verify the user was created
SELECT id, email, name, created_at FROM admin_users WHERE email = 'admin@euda-portal.com';
