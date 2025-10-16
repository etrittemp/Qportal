-- Create Three Additional Admin Users for EUDA Portal
-- Run this in Supabase SQL Editor: https://gzzgsyeqpnworczllraa.supabase.co
-- Default password for all three users: Admin123!
-- Same settings as admin@euda-portal.com

-- Insert admin user 1 - Ilir Bicja
INSERT INTO admin_users (
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  'ilir.bicja@hape-kosovo.eu',
  '$2a$10$POBg4aRhy2kWgPSwTbNlVOJ4cIehCVlgI0ACRLvPKpFH1yuV8V.kO',
  'Ilir Bicja',
  'admin',
  true,
  NOW()
);

-- Insert admin user 2 - Albert Avdiu
INSERT INTO admin_users (
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  'albert.avdiu@hape-kosovo.eu',
  '$2a$10$JxDTCHCB2XMGxqi.39uDluQoQb/R6xsEUNlJ4Syd2fEhpAdGt5ROe',
  'Albert Avdiu',
  'admin',
  true,
  NOW()
);

-- Insert admin user 3 - Rreze Hoxha
INSERT INTO admin_users (
  email,
  password_hash,
  name,
  role,
  is_active,
  created_at
) VALUES (
  'rreze.hoxha@hape-kosovo.eu',
  '$2a$10$La7siGNvQ/RZBVDpPFq81OYsEqX4m9Xp2i/PjtOMUwaY8eafnzF.q',
  'Rreze Hoxha',
  'admin',
  true,
  NOW()
);

-- Verify the users were created
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
WHERE email IN ('ilir.bicja@hape-kosovo.eu', 'albert.avdiu@hape-kosovo.eu', 'rreze.hoxha@hape-kosovo.eu')
ORDER BY email;

/*
Login Credentials for all three users:
- Email: ilir.bicja@hape-kosovo.eu | Password: Admin123!
- Email: albert.avdiu@hape-kosovo.eu | Password: Admin123!
- Email: rreze.hoxha@hape-kosovo.eu | Password: Admin123!
*/
