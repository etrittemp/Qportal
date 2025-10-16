-- Add New Admin User for Local Development
-- Email: ilir.bicja@hape-kosovo.eu
-- Password: Admin123!

-- First, check if is_active column exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Insert or update the admin user
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'ilir.bicja@hape-kosovo.eu',
  '$2a$10$8wV7ipSCsuXOjnVvDbmjYuIebkQZuJUGVnaadgChqV8.gvt9bbiCK',
  'Ilir Bicja',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    is_active = true,
    updated_at = NOW();

-- Also update existing users to ensure they have is_active = true
UPDATE admin_users SET is_active = true WHERE is_active IS NULL OR is_active = false;

-- Verify the admin user was created and all users are active
SELECT id, email, name, role, is_active, created_at FROM admin_users ORDER BY created_at DESC;

-- You can now login with:
-- Email: ilir.bicja@hape-kosovo.eu
-- Password: Admin123!
