# Troubleshooting Login Issue

## Problem
The backend API has Vercel deployment protection enabled, which prevents direct access.

## Solutions

### Solution 1: Disable Vercel Protection (Recommended for now)

1. Go to Vercel Dashboard: https://vercel.com/etrit-neziris-projects-f42b4265/server
2. Click "Settings"
3. Scroll to "Deployment Protection"
4. Disable protection or set to "Only Production Deployments"
5. Save changes
6. Redeploy: `cd server && vercel --prod --yes`

### Solution 2: Verify User in Supabase

1. Go to Supabase: https://gzzgsyeqpnworczllraa.supabase.co
2. Click "Table Editor" (left sidebar)
3. Select "admin_users" table
4. Check if the user exists with email: admin@euda-portal.com

### Solution 3: Check Table Structure

The admin_users table should have these columns:
- id (uuid, primary key)
- email (text)
- password_hash (text)  ← Make sure it's "password_hash" not "password"
- name (text)
- role (text, default: 'admin')
- is_active (boolean, default: true)
- created_at (timestamp)
- last_login (timestamp)

### Solution 4: Re-create User with Correct SQL

Run this in Supabase SQL Editor:

```sql
-- First, check if user exists
SELECT * FROM admin_users WHERE email = 'admin@euda-portal.com';

-- If exists, delete it
DELETE FROM admin_users WHERE email = 'admin@euda-portal.com';

-- Create new user with all fields
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
);

-- Verify
SELECT id, email, name, role, is_active, created_at 
FROM admin_users 
WHERE email = 'admin@euda-portal.com';
```
