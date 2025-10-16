# 🚀 Deploy Your EUDA Questionnaire Portal to Vercel

## Quick Start (5 minutes)

### Step 1: Login to Vercel
```bash
vercel login
```
Choose your authentication method (GitHub, GitLab, email, etc.)

---

### Step 2: Deploy Backend
```bash
./deploy-backend.sh
```

**OR manually:**
```bash
cd server
vercel --prod
```

**Save the backend URL!** (e.g., `https://euda-backend-xxx.vercel.app`)

---

### Step 3: Add Backend Environment Variables

```bash
cd server

# Add all required environment variables
vercel env add SUPABASE_URL
# Enter: https://gzzgsyeqpnworczllraa.supabase.co

vercel env add SUPABASE_ANON_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emdzeWVxcG53b3JjemxscmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDA3MzMsImV4cCI6MjA3NTQ3NjczM30.dgq_kSn5jVFbFEncrLfSp0idETluFaPWV1aUnxwNE0Q

vercel env add SUPABASE_SERVICE_KEY
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emdzeWVxcG53b3JjemxscmFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwMDczMywiZXhwIjoyMDc1NDc2NzMzfQ.EBn8ZlopUc5hQrMO1W5f8JXu-BxMDulkl42dgP6R2_o

vercel env add JWT_SECRET
# Enter: 1e7834c8b1215d707c29efd1ca78cd04be4855ee36ea0f87a0e53400b6444dd9

vercel env add NODE_ENV
# Enter: production

# Redeploy with environment variables
vercel --prod
```

---

### Step 4: Update Frontend .env

```bash
cd ..  # Back to root directory
echo "VITE_API_URL=https://your-backend-url.vercel.app" > .env
```
Replace `your-backend-url` with your actual backend URL from Step 2.

---

### Step 5: Deploy Frontend

```bash
./deploy-frontend.sh
```

**OR manually:**
```bash
vercel --prod
```

**Save the frontend URL!** (e.g., `https://euda-questionnaire-xxx.vercel.app`)

---

### Step 6: Add Frontend Environment Variable

```bash
vercel env add VITE_API_URL
# Enter your backend URL: https://euda-backend-xxx.vercel.app

# Redeploy
vercel --prod
```

---

### Step 7: Update Backend CORS

```bash
cd server
vercel env add FRONTEND_URL
# Enter your frontend URL: https://euda-questionnaire-xxx.vercel.app

# Redeploy
vercel --prod
```

---

## ✅ Verification

### Test Backend:
```bash
curl https://your-backend-url.vercel.app/health
```
Expected: `{"status":"ok","message":"EUDA Backend API is running"}`

### Test Frontend:
1. Visit: `https://your-frontend-url.vercel.app/questionnaire`
2. Fill out and submit a test response
3. Visit: `https://your-frontend-url.vercel.app/login`
4. Login with admin credentials
5. Visit: `https://your-frontend-url.vercel.app/dashboard`
6. Verify the test response appears

---

## 🎉 You're Live!

Your EUDA Questionnaire Portal is now deployed:

- **📝 Questionnaire**: `https://your-frontend-url.vercel.app/questionnaire`
- **📊 Dashboard**: `https://your-frontend-url.vercel.app/dashboard`
- **🔐 Login**: `https://your-frontend-url.vercel.app/login`

---

## 📋 Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Backend deployed with all environment variables
- [ ] Frontend deployed with VITE_API_URL
- [ ] Backend FRONTEND_URL updated with frontend URL
- [ ] Health check passes
- [ ] Test questionnaire submission works
- [ ] Admin login works
- [ ] Dashboard displays responses
- [ ] Share URLs with stakeholders! 🎊

---

## 🆘 Need Help?

See detailed instructions in: `VERCEL_DEPLOYMENT.md`

### Common Issues:

**CORS errors?**
- Make sure FRONTEND_URL in backend matches frontend URL exactly
- Redeploy backend: `cd server && vercel --prod`

**Environment variables not working?**
```bash
vercel env ls  # List all variables
vercel env pull  # Pull latest variables
vercel --prod  # Redeploy
```

**Build fails?**
```bash
npm install  # Reinstall dependencies
vercel --prod  # Redeploy
```

---

## 🔄 Future Updates

To update your deployed application:

**Backend changes:**
```bash
cd server
vercel --prod
```

**Frontend changes:**
```bash
vercel --prod
```

Vercel will automatically rebuild and redeploy! 🚀
