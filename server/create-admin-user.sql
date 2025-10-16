-- Create Admin User for Testing
-- Run this in Supabase SQL Editor to create a test admin account

-- First, check if admin_users table exists, if not create it
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin_users
CREATE POLICY "Admins can view all admin users" ON admin_users
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert admin users" ON admin_users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update admin users" ON admin_users
  FOR UPDATE
  USING (true);

-- Insert test admin user
-- Email: admin@example.com
-- Password: Admin123!
INSERT INTO admin_users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '$2a$10$8wV7ipSCsuXOjnVvDbmjYuIebkQZuJUGVnaadgChqV8.gvt9bbiCK',
  'Test Admin',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    updated_at = NOW();

-- Verify the admin user was created
SELECT id, email, name, role, created_at FROM admin_users WHERE email = 'admin@example.com';

-- You can now login with:
-- Email: admin@example.com
-- Password: Admin123!
