# Vercel Deployment Guide

## Prerequisites
✅ Vercel CLI installed
✅ Supabase database configured
✅ Backend and Frontend ready

## Step-by-Step Deployment

### 1. Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate with your Vercel account.

---

### 2. Deploy Backend (API)

```bash
cd server
vercel
```

**Configuration prompts:**
- Set up and deploy? **Y**
- Which scope? **Choose your account**
- Link to existing project? **N** (first time)
- Project name: **euda-backend** (or your choice)
- In which directory is your code? **./src** (or press Enter for current)
- Override settings? **N**

**After deployment, Vercel will give you a URL like:**
`https://euda-backend-xxx.vercel.app`

**IMPORTANT: Save this URL! You'll need it for the frontend.**

#### Add Backend Environment Variables:
```bash
vercel env add SUPABASE_URL
# Paste: https://gzzgsyeqpnworczllraa.supabase.co

vercel env add SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emdzeWVxcG53b3JjemxscmFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDA3MzMsImV4cCI6MjA3NTQ3NjczM30.dgq_kSn5jVFbFEncrLfSp0idETluFaPWV1aUnxwNE0Q

vercel env add SUPABASE_SERVICE_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6emdzeWVxcG53b3JjemxscmFhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwMDczMywiZXhwIjoyMDc1NDc2NzMzfQ.EBn8ZlopUc5hQrMO1W5f8JXu-BxMDulkl42dgP6R2_o

vercel env add JWT_SECRET
# Paste: 1e7834c8b1215d707c29efd1ca78cd04be4855ee36ea0f87a0e53400b6444dd9

vercel env add NODE_ENV
# Type: production

vercel env add FRONTEND_URL
# Type: https://your-frontend-url.vercel.app (we'll update this after frontend deployment)
```

**Redeploy backend with environment variables:**
```bash
vercel --prod
```

---

### 3. Deploy Frontend

```bash
cd ..  # Back to root directory
```

**Update .env file with your backend URL:**
```bash
echo "VITE_API_URL=https://your-backend-url.vercel.app" > .env
```

**Deploy:**
```bash
vercel
```

**Configuration prompts:**
- Set up and deploy? **Y**
- Which scope? **Choose your account**
- Link to existing project? **N** (first time)
- Project name: **euda-questionnaire** (or your choice)
- In which directory is your code? **./** (press Enter)
- Override settings? **N**

**After deployment, you'll get a URL like:**
`https://euda-questionnaire-xxx.vercel.app`

#### Add Frontend Environment Variable:
```bash
vercel env add VITE_API_URL
# Paste your backend URL: https://euda-backend-xxx.vercel.app
```

**Redeploy frontend with environment variable:**
```bash
vercel --prod
```

---

### 4. Update Backend CORS

Go back to backend and update the FRONTEND_URL:
```bash
cd server
vercel env add FRONTEND_URL
# Paste your frontend URL: https://euda-questionnaire-xxx.vercel.app

# Redeploy
vercel --prod
```

---

## 5. Verify Deployment

### Test Backend:
```bash
curl https://your-backend-url.vercel.app/health
```
Should return: `{"status":"ok","message":"EUDA Backend API is running"}`

### Test Frontend:
1. Visit: `https://your-frontend-url.vercel.app`
2. Go to `/questionnaire` - fill and submit a test response
3. Go to `/login` - login with your admin credentials
4. Go to `/dashboard` - verify the response appears

---

## 6. Custom Domain (Optional)

In Vercel Dashboard:
1. Go to your project settings
2. Click "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update environment variables with new domain

---

## Production URLs

After deployment, update these in your .env files:

**Backend (.env):**
```
FRONTEND_URL=https://your-custom-domain.com
```

**Frontend (.env):**
```
VITE_API_URL=https://api.your-custom-domain.com
```

---

## Troubleshooting

### Backend not responding:
```bash
cd server
vercel logs
```

### Frontend not loading:
```bash
vercel logs
```

### CORS errors:
- Make sure FRONTEND_URL in backend matches your frontend URL exactly
- Redeploy backend after updating FRONTEND_URL

### Environment variables not working:
```bash
# List all env vars
vercel env ls

# Remove and re-add if needed
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

---

## Quick Commands Reference

```bash
# Deploy to preview (staging)
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View project info
vercel inspect

# Open project in browser
vercel open
```

---

## Next Steps

1. ✅ Backend deployed
2. ✅ Frontend deployed
3. ✅ Environment variables configured
4. ✅ Test all functionality
5. 🎉 Share the live URL!

Your application is now live at:
- **Questionnaire**: https://your-frontend-url.vercel.app/questionnaire
- **Dashboard**: https://your-frontend-url.vercel.app/dashboard
