# Testing and Deployment Guide

## 🎉 Implementation Complete!

All major features have been implemented. This guide will walk you through testing and deploying the new questionnaire management system.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup

#### Run Migration in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open `server/database-migrations.sql`
4. Copy the entire content
5. Paste and run in Supabase SQL Editor
6. Verify all tables are created:
   - questionnaires
   - questionnaire_sections
   - questions
   - file_uploads
   - Updated: questionnaire_responses (with new columns)

#### Verify Migration
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('questionnaires', 'questionnaire_sections', 'questions', 'file_uploads');

-- Check questionnaire_responses has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'questionnaire_responses';
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd server
npm install  # Installs multer, mammoth, pdf-parse

# Frontend dependencies (if needed)
cd ..
npm install
```

### 3. Environment Variables

Make sure all environment variables are set:

**Backend (.env in server/):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001
```

---

## 🧪 Testing Guide

### Phase 1: Local Development Testing

#### Start the Servers

```bash
# Terminal 1: Backend
cd server
npm run dev
# Should see: 🚀 Server running on http://localhost:3001

# Terminal 2: Frontend
cd ..
npm run dev
# Should see: Local: http://localhost:5173
```

### Phase 2: Feature Testing

#### Test 1: Authentication
- [ ] Visit http://localhost:5173/login
- [ ] Login with admin credentials
- [ ] Verify redirect to dashboard
- [ ] Check navigation buttons appear

#### Test 2: Questionnaire Management
- [ ] Click "Manage Questionnaires" from dashboard
- [ ] Verify you're at `/questionnaires`
- [ ] Should see empty state or existing questionnaires

#### Test 3: File Upload & Conversion

**Prepare Test Documents:**
Create a simple Word document with this structure:

```
SECTION 1: BASIC INFORMATION

1. What is your organization name?

2. What is your email address?

SECTION 2: FEEDBACK

3. How satisfied are you with our service?
a) Very satisfied
b) Satisfied
c) Neutral
d) Dissatisfied

4. Any additional comments?
```

**Test the Upload:**
- [ ] Click "Upload Document"
- [ ] Select your Word/PDF file
- [ ] Enter title: "Test Questionnaire"
- [ ] Enter description (optional)
- [ ] Click "Upload & Convert"
- [ ] Wait for conversion (should take 2-5 seconds)
- [ ] Verify success message
- [ ] Check questionnaire appears in list

#### Test 4: Questionnaire Preview
- [ ] Click "Preview" button on a questionnaire
- [ ] Opens in new tab: `/questionnaire/{id}`
- [ ] Verify all sections are visible
- [ ] Verify all questions render correctly
- [ ] Test language switcher (EN/SQ/SR)
- [ ] All translations should show

#### Test 5: Fill Out Questionnaire
- [ ] Fill in contact information
- [ ] Answer some questions
- [ ] Click "Save Draft" - verify "Saved" appears
- [ ] Refresh page - verify answers persist
- [ ] Click "Next" to go to next section
- [ ] Try to submit without completing required fields - should show errors
- [ ] Complete all sections
- [ ] Click "Submit Questionnaire"
- [ ] Verify success message

#### Test 6: View Responses in Dashboard
- [ ] Go back to `/dashboard`
- [ ] Verify new response appears
- [ ] Click "View" to see details
- [ ] Download CSV - verify file downloads
- [ ] Check all question-answer pairs are in CSV

#### Test 7: Questionnaire Status Management
- [ ] Go to `/questionnaires`
- [ ] Find a draft questionnaire
- [ ] Click "Activate" - status should change to Active
- [ ] Click "Archive" - status should change to Archived
- [ ] Click "Reactivate" - should go back to Active
- [ ] Try to delete a questionnaire with responses - should get error
- [ ] Delete a questionnaire without responses - should succeed

#### Test 8: Duplicate Questionnaire
- [ ] Click "Duplicate" on any questionnaire
- [ ] Enter new title when prompted
- [ ] Verify duplicated questionnaire appears
- [ ] Open both - verify content is identical but separate

#### Test 9: Multi-Language
- [ ] Open a questionnaire
- [ ] Switch language to Albanian (Shqip)
- [ ] Verify UI changes to Albanian
- [ ] Switch to Serbian (Српски)
- [ ] Verify UI changes to Serbian
- [ ] Switch back to English
- [ ] Refresh - language preference should persist

#### Test 10: Form Validation
- [ ] Open questionnaire
- [ ] Try submitting without contact info - should show error
- [ ] Enter invalid email - should show validation error
- [ ] Try submitting with required questions empty - should show errors
- [ ] Fill all required fields - should submit successfully

### Phase 3: Integration Testing

#### Test Complete Workflow:
1. Admin logs in
2. Uploads a Word document
3. Reviews the generated questionnaire
4. Activates the questionnaire
5. Shares link with respondent
6. Respondent fills out questionnaire in Albanian
7. Respondent submits
8. Admin views response in dashboard
9. Admin downloads CSV with all responses

---

## 🚀 Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

#### Deploy Backend (Serverless Functions)

```bash
cd server

# Update vercel.json if needed
cat > vercel.json << 'EOF'
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

# Deploy
vercel
# Follow prompts, select existing project or create new

# Set environment variables in Vercel dashboard:
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
# - JWT_SECRET
# - FRONTEND_URL (will be your frontend URL after deployment)
```

#### Deploy Frontend

```bash
cd ..

# Update .env.production
echo "VITE_API_URL=https://your-backend.vercel.app" > .env.production

# Deploy
vercel
# Follow prompts

# After deployment, update backend FRONTEND_URL to match frontend URL
```

### Option 2: Deploy Both Together

```bash
# Build frontend
npm run build

# The dist folder can be served by your backend
# Update server/src/index.js to serve static files

# Add this before routes in server/src/index.js:
# import path from 'path';
# app.use(express.static(path.join(__dirname, '../../dist')));

# Deploy everything
vercel
```

---

## 🔧 Environment-Specific Configuration

### Production Environment Variables

**Backend (.env.production in server/):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_production_service_key
JWT_SECRET=your_long_random_production_secret
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3001
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-backend.vercel.app
```

### Update CORS in Production

In `server/src/index.js`, CORS is already configured to use `process.env.FRONTEND_URL`, so just ensure it's set correctly.

---

## 🐛 Troubleshooting

### Issue: File upload fails
**Solution:** Check file size (<10MB), verify multer is installed, check server logs

### Issue: Questionnaire not rendering
**Solution:** Check browser console, verify API returns data, check network tab

### Issue: Translations not showing
**Solution:** Verify LanguageContext is wrapping App, check browser localStorage

### Issue: Database errors
**Solution:** Verify migrations ran successfully, check RLS policies, verify service key

### Issue: 401 Unauthorized
**Solution:** Check JWT_SECRET matches between login and verification, verify token in localStorage

### Issue: CORS errors
**Solution:** Update FRONTEND_URL in backend .env, redeploy backend

---

## 📊 Performance Optimization

### Backend
- [ ] Enable gzip compression
- [ ] Add request rate limiting
- [ ] Implement caching for public questionnaires
- [ ] Optimize database queries with proper indexes (already done)

### Frontend
- [ ] Enable code splitting
- [ ] Lazy load routes
- [ ] Compress images
- [ ] Enable service worker for offline support

---

## 🔒 Security Checklist

- [x] RLS enabled on all tables
- [x] Service key only used on backend
- [x] JWT tokens expire after 7 days
- [x] Passwords hashed with bcrypt
- [x] CORS configured
- [x] Input validation on backend
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Add rate limiting to prevent abuse
- [ ] Implement CSP headers
- [ ] Add request logging

---

## 📈 Monitoring & Analytics

### Things to Monitor:
1. **File Upload Failures:** Check `file_uploads` table for `upload_status='failed'`
2. **Response Submission Errors:** Monitor API logs
3. **User Growth:** Track `questionnaire_responses` count
4. **Active Questionnaires:** Monitor `status='active'` count
5. **Storage Usage:** Check Supabase database size

### SQL Queries for Monitoring:

```sql
-- Upload success rate
SELECT
  upload_status,
  COUNT(*) as count
FROM file_uploads
GROUP BY upload_status;

-- Responses by language
SELECT
  language,
  COUNT(*) as count
FROM questionnaire_responses
GROUP BY language;

-- Most popular questionnaires
SELECT
  q.title,
  COUNT(qr.id) as response_count
FROM questionnaires q
LEFT JOIN questionnaire_responses qr ON q.id = qr.questionnaire_id
GROUP BY q.id, q.title
ORDER BY response_count DESC;

-- Daily response rate
SELECT
  DATE(submitted_at) as date,
  COUNT(*) as responses
FROM questionnaire_responses
WHERE submitted_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(submitted_at)
ORDER BY date DESC;
```

---

## 🎓 Training Guide for Admins

### Creating a Questionnaire from Word/PDF

1. **Prepare your document:**
   - Use clear section headers (UPPERCASE or "Section 1:")
   - Number your questions (1., 2., 3.)
   - Use (a), (b), (c) for multiple choice options
   - Keep it well-structured

2. **Upload:**
   - Go to `/questionnaires`
   - Click "Upload Document"
   - Select your file
   - Enter a clear title
   - Add description
   - Click "Upload & Convert"

3. **Review:**
   - System creates questionnaire as DRAFT
   - Click "Preview" to see how it looks
   - Questions/sections are auto-detected
   - Translations are set to English by default

4. **Edit (if needed):**
   - Currently auto-generated, manual editor coming soon
   - Or re-upload with better formatting

5. **Activate:**
   - When ready, click "Activate"
   - Questionnaire becomes available to public
   - Share link: `yourdomain.com/questionnaire/{id}`

6. **Monitor:**
   - View statistics card shows response count
   - Click "View Responses" to see all answers
   - Download CSV for analysis

---

## 🎯 Next Steps (Optional Enhancements)

1. **Questionnaire Builder UI** - Visual drag-and-drop editor
2. **Email Notifications** - Notify admins on new responses
3. **Advanced Analytics** - Charts, graphs, insights
4. **Export to Excel** - XLSX format support
5. **Conditional Logic** - Show/hide questions based on answers
6. **File Uploads in Questions** - Allow respondents to upload documents
7. **Response Editing** - Allow respondents to edit before deadline
8. **Batch Operations** - Bulk activate/archive questionnaires
9. **User Management UI** - Manage admin users from dashboard
10. **Audit Logs** - Track all admin actions

---

## 📞 Support

For issues during deployment:
1. Check server logs in Vercel dashboard
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Check Supabase logs for database errors
5. Review this guide's troubleshooting section

**All systems ready for testing and deployment!** 🚀
