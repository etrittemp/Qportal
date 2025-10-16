# 🔐 Admin Login Credentials

## Login URL
**https://euda-portal-i8w4u6jmh-etrit-neziris-projects-f42b4265.vercel.app/login**

---

## Default Admin Credentials

### Email:
```
admin@euda-portal.com
```

### Password:
```
Admin123!
```

---

## 📋 How to Create the Admin User

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase dashboard:
   **https://gzzgsyeqpnworczllraa.supabase.co**

2. Navigate to: **SQL Editor** (in left sidebar)

3. Click **"New Query"**

4. Copy and paste this SQL:
```sql
INSERT INTO admin_users (email, password_hash, name, created_at)
VALUES (
  'admin@euda-portal.com',
  '$2a$10$mS4JoddUFJdeCvjpDyyca.sVGp6NwgmtBjF.fVsCEPVewSiO13gvW',
  'EUDA Admin',
  NOW()
);
```

5. Click **"Run"**

6. You should see: "Success. No rows returned"

---

### Option 2: Using the API

```bash
curl -X POST https://server-n8ochsjl8-etrit-neziris-projects-f42b4265.vercel.app/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@euda-portal.com",
    "password": "Admin123!",
    "name": "EUDA Admin"
  }'
```

---

## ✅ After Creating the Admin User

1. **Visit the login page:**
   https://euda-portal-i8w4u6jmh-etrit-neziris-projects-f42b4265.vercel.app/login

2. **Enter credentials:**
   - Email: `admin@euda-portal.com`
   - Password: `Admin123!`

3. **Click "Sign In"**

4. **You'll be redirected to:**
   https://euda-portal-i8w4u6jmh-etrit-neziris-projects-f42b4265.vercel.app/dashboard

---

## 🔒 Security Recommendations

### Change the Default Password
After first login, it's recommended to:
1. Create a new admin user with a stronger password
2. Delete or disable the default admin account

### Create Additional Admin Users
Run this SQL in Supabase (change the email and generate a new password hash):

```sql
-- Generate password hash first using:
-- node -e "console.log(require('bcryptjs').hashSync('YourNewPassword', 10))"

INSERT INTO admin_users (email, password_hash, name, created_at)
VALUES (
  'newemail@example.com',
  'YOUR_BCRYPT_HASH_HERE',
  'Admin Name',
  NOW()
);
```

---

## 🆘 Troubleshooting

### "Invalid credentials" error
- Make sure you ran the SQL to create the user
- Check the email and password are correct (case-sensitive)
- Verify the user exists in Supabase:
  ```sql
  SELECT * FROM admin_users WHERE email = 'admin@euda-portal.com';
  ```

### Can't access Supabase
- Supabase URL: https://gzzgsyeqpnworczllraa.supabase.co
- Make sure you're logged into the correct Supabase account

### Token expired
- Simply login again - tokens expire after 24 hours for security

---

## 📊 What You Can Do After Login

Once logged in to the dashboard, you can:
- ✅ View all questionnaire responses
- ✅ Filter responses by country or status
- ✅ View individual response details
- ✅ Export responses as JSON
- ✅ Export responses as CSV
- ✅ Delete individual responses
- ✅ Delete all responses

---

## 🔑 Password Hash Information

The password `Admin123!` has been hashed using bcrypt with 10 rounds:
```
$2a$10$mS4JoddUFJdeCvjpDyyca.sVGp6NwgmtBjF.fVsCEPVewSiO13gvW
```

To generate your own password hash:
```bash
node -e "console.log(require('bcryptjs').hashSync('YourPassword', 10))"
```

---

**Last Updated:** $(date)
