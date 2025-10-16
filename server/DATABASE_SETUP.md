# Database Setup Guide

## Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with your email
4. Create a new project:
   - Name: `euda-questionnaire`
   - Database Password: (choose a strong password)
   - Region: Choose closest to your users
   - Wait 2-3 minutes for setup

## Step 2: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the SQL below:

```sql
-- Create admin_users table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'superuser')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create questionnaire_responses table
CREATE TABLE questionnaire_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  completion_status VARCHAR(50) DEFAULT 'Partial',
  responses JSONB NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_responses_country ON questionnaire_responses(country);
CREATE INDEX idx_responses_status ON questionnaire_responses(completion_status);
CREATE INDEX idx_responses_submitted ON questionnaire_responses(submitted_at);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (service role bypasses these)
CREATE POLICY "Service role can do everything on admin_users"
  ON admin_users FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on responses"
  ON questionnaire_responses FOR ALL
  USING (auth.role() = 'service_role');
```

4. Click **Run** (or press F5)

## Step 3: Create Your Superuser Account

In the same SQL Editor, run this (replace with your details):

```sql
INSERT INTO admin_users (email, password_hash, name, role, is_active)
VALUES (
  'your-email@example.com',
  '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  'Your Name',
  'superuser',
  true
);
```

**Note**: We'll generate the actual password hash in Step 5

## Step 4: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "Reveal" to see it)

## Step 5: Setup Environment Variables

1. In the `server/` folder, copy `.env.example` to `.env`:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Edit `.env` and fill in your values:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   JWT_SECRET=your_random_secret_key_here_minimum_32_characters
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

## Step 6: Generate Password Hash for Superuser

1. Install dependencies:
   ```bash
   cd server
   npm install
   ```

2. Run this command to generate password hash:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123', 10));"
   ```

3. Copy the output hash

4. Go back to Supabase SQL Editor and run:
   ```sql
   INSERT INTO admin_users (email, password_hash, name, role, is_active)
   VALUES (
     'your-email@example.com',
     'paste_hash_here',
     'Your Name',
     'superuser',
     true
   );
   ```

## Step 7: Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Environment: development
```

## Step 8: Test the Setup

Open a new terminal and test:

```bash
# Test health check
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "YourPassword123"
  }'
```

You should get a JWT token back!

## What's Next?

Now we need to:
1. Update the frontend to use the API
2. Add login page
3. Update dashboard to fetch from API
4. Deploy to Vercel

## Database Schema Summary

### admin_users
- `id`: UUID (auto-generated)
- `email`: User's email (unique)
- `password_hash`: Hashed password
- `name`: User's full name
- `role`: 'admin' or 'superuser'
- `is_active`: Can user login?
- `created_at`: When account was created
- `last_login`: Last login timestamp

### questionnaire_responses
- `id`: UUID (auto-generated)
- `country`: Selected country
- `contact_name`: Respondent name
- `contact_email`: Respondent email
- `completion_status`: 'Complete' or 'Partial'
- `responses`: JSON object with all Q&A
- `submitted_at`: Submission timestamp

## Roles Explained

- **Superuser**: You! Can create/manage admin users
- **Admin**: Can view all responses, download, delete

## Security Notes

- ✅ Passwords are hashed with bcrypt (cannot be reversed)
- ✅ JWT tokens expire after 7 days
- ✅ Row Level Security (RLS) enabled on database
- ✅ CORS configured to only allow your frontend
- ✅ Service role key kept secret (server-side only)
