# EUDA Questionnaire Portal - Complete Setup Guide

This guide will help you set up the entire application with Supabase backend, admin authentication, and online functionality.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Creating Admin Users](#creating-admin-users)
6. [Testing Locally](#testing-locally)
7. [Deployment](#deployment)

---

## Prerequisites

Before you begin, make sure you have:

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account (free tier works fine)
- Git (for deployment)

---

## 1. Supabase Setup

### Step 1.1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project name**: `euda-questionnaire`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait 2-3 minutes

### Step 1.2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "+ New query"
3. Copy and paste this SQL:

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

4. Click **Run** (or F5) to execute

### Step 1.3: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Click the eye icon to reveal
   - **service_role key**: Click "Reveal" button (keep this SECRET!)

---

## 2. Backend Setup

### Step 2.1: Configure Environment Variables

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your actual values:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   JWT_SECRET=create_a_random_32_character_string_here
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   **For JWT_SECRET**, you can generate a random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Step 2.2: Install Dependencies

```bash
npm install
```

### Step 2.3: Start the Backend Server

```bash
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 Environment: development
```

Keep this terminal window open!

---

## 3. Frontend Setup

### Step 3.1: Configure Environment Variables

1. In a new terminal, navigate to the project root:
   ```bash
   cd ..  # If you're still in the server folder
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

### Step 3.2: Install Frontend Dependencies

```bash
npm install
```

### Step 3.3: Start the Frontend

```bash
npm run dev
```

The app should open at `http://localhost:5173`

---

## 4. Creating Admin Users

You have two options:

### Option A: Create Superuser via SQL (Recommended for first user)

1. Generate a password hash:
   ```bash
   cd server
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123', 10));"
   ```

2. Copy the hash output (starts with `$2a$10$...`)

3. In Supabase dashboard, go to **SQL Editor** → **New query**

4. Run this SQL (replace with your values):
   ```sql
   INSERT INTO admin_users (email, password_hash, name, role, is_active)
   VALUES (
     'admin@example.com',
     '$2a$10$paste_your_hash_here',
     'Admin Name',
     'superuser',
     true
   );
   ```

### Option B: Use API Endpoint (For additional admins)

Once you have a superuser, you can create more admins via the API:

```bash
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "newadmin@example.com",
    "password": "SecurePassword123",
    "name": "New Admin"
  }'
```

---

## 5. Testing Locally

### Test Admin Login

1. Open `http://localhost:5173/login`
2. Enter the admin credentials you created
3. You should be redirected to `/dashboard`

### Test Questionnaire Submission

1. Open `http://localhost:5173/questionnaire`
2. Fill out the form (at minimum, the required fields)
3. Click "Submit Questionnaire"
4. Check the dashboard - the response should appear

### Test Dashboard Features

- **View responses**: Click the eye icon on any response
- **Download CSV**: Click the download icon
- **Delete response**: Click the trash icon
- **Filter**: Use the search and filter dropdowns
- **Logout**: Click the logout button in the header

---

## 6. Deployment

### Option 1: Deploy to Vercel (Recommended)

#### Deploy Frontend

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project" → Import your repository

4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_URL` with your backend URL

5. Click "Deploy"

#### Deploy Backend

1. In Vercel, create a new project for the backend

2. Configure:
   - **Root Directory**: `server`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
   - **Environment Variables**: Add all variables from `server/.env`

3. Click "Deploy"

4. Update your frontend's `VITE_API_URL` to point to the deployed backend URL

### Option 2: Deploy to Railway

#### Deploy Backend

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables
5. Railway will auto-detect and deploy

#### Deploy Frontend

1. Use Vercel or Netlify for the frontend (same as Option 1)

### Option 3: Deploy to Your Own Server

#### Backend (Node.js)

```bash
# On your server
cd server
npm install --production
npm start
```

Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/index.js --name euda-backend
pm2 save
pm2 startup
```

#### Frontend (Static Files)

```bash
# Build locally
npm run build

# Upload the dist/ folder to your server
scp -r dist/* user@yourserver:/var/www/euda-questionnaire/
```

Configure nginx:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/euda-questionnaire;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 7. Production Checklist

Before going live, make sure:

- [ ] Change all default passwords
- [ ] Use HTTPS for both frontend and backend
- [ ] Set `NODE_ENV=production` in backend
- [ ] Update `FRONTEND_URL` in backend `.env` to production URL
- [ ] Update `VITE_API_URL` in frontend `.env` to production backend URL
- [ ] Enable CORS only for your production domain
- [ ] Set up database backups in Supabase
- [ ] Test all functionality in production
- [ ] Set up monitoring (e.g., Sentry)
- [ ] Document admin procedures

---

## Troubleshooting

### Backend won't start

- Check if port 3001 is already in use
- Verify all environment variables are set correctly
- Check Supabase credentials are correct

### Frontend can't connect to backend

- Verify `VITE_API_URL` is correct
- Check backend is running
- Check CORS settings in backend

### Login not working

- Verify admin user exists in database
- Check password hash was generated correctly
- Check `JWT_SECRET` is set in backend

### Questionnaire submissions not showing

- Check browser console for errors
- Verify backend API is accessible
- Check Supabase RLS policies

---

## Support

For questions or issues:
- Check the logs: Backend terminal and browser console
- Review Supabase logs in dashboard
- Check [Supabase docs](https://supabase.com/docs)

---

## Security Notes

- Never commit `.env` files to Git
- Keep `service_role` key secret (server-side only)
- Use strong passwords for admin accounts
- Enable 2FA on Supabase account
- Regularly update dependencies
- Monitor API usage in Supabase dashboard

---

Happy deploying! 🚀
