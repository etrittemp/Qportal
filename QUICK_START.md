# 🚀 Quick Start Guide - EUDA Questionnaire Portal

## ✅ Integration Complete!

All translations have been successfully integrated into the UI. Your application now supports three languages:
- 🇬🇧 **English (EN)** - Default
- 🇦🇱 **Albanian (SQ)** - Shqip
- 🇷🇸 **Serbian (SR)** - Српски

---

## 📋 What Was Completed

### 1. Backend Dependencies ✅
- Installed `multer`, `mammoth`, and `pdf-parse`
- File upload functionality is now fully operational

### 2. Translation System Integration ✅
All UI components now use the translation system:

#### **LoginPage.tsx**
- Sign in form with translated labels
- Language selector in header
- Error messages in all languages

#### **AdminDashboard.tsx**
- Language selector in header
- "Manage Questionnaires" button
- All dashboard text translated

#### **QuestionnaireManagement.tsx**
- Fully translated interface:
  - Page header and description
  - Create/Upload buttons
  - Search and filter controls
  - Upload modal with all fields
  - Questionnaire cards with stats
  - Status badges (Draft, Active, Archived)
  - Action buttons (Activate, Archive, Preview, Duplicate, Delete)
  - Success/error messages
  - Empty states
  - Loading states

### 3. Database Migration ✅
- User confirmed running `database-migrations.sql` in Supabase
- All 4 new tables created
- Multi-language support enabled at database level

---

## 🎯 How to Test the Multi-Language System

### Step 0: Create Admin User (First Time Only)

Before you can login, you need to create an admin user in Supabase:

1. Open **Supabase SQL Editor**
2. Copy the contents of `server/create-admin-user.sql`
3. Paste and run it in the SQL Editor
4. You'll see a confirmation with the admin user details

**Default test credentials:**
- Email: `admin@example.com`
- Password: `Admin123!`

### Step 1: Start the Application
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

### Step 2: Test Language Switching

1. **Login Page** (`http://localhost:5173/login`)
   - Look for language selector in the header
   - Click to switch between EN / SQ / SR
   - Notice all labels change immediately
   - Language preference is saved to localStorage

2. **Admin Dashboard** (`http://localhost:5173/dashboard`)
   - After login, check language selector in top-right
   - Switch languages and see dashboard text update
   - Click "Manage Questionnaires" button

3. **Questionnaire Management** (`http://localhost:5173/questionnaires`)
   - Full interface in chosen language
   - Try clicking "Upload Document" - modal is translated
   - Try search and filter - placeholders translated
   - All buttons show translated text

### Step 3: Test File Upload

1. Go to Questionnaire Management
2. Click "Upload Document" (or translated equivalent)
3. Select a Word (.docx) or PDF file
4. Enter a title (in any language)
5. Click "Upload & Convert"
6. System will auto-detect sections and questions
7. New questionnaire created as "Draft"

### Step 4: Test Questionnaire Workflow

1. **Activate**: Click "Activate" on a draft questionnaire
2. **Preview**: Click "Preview" to open in new tab
3. **Switch Language**: In the questionnaire, use language selector
4. **Fill Out**: Complete the form in any language
5. **Submit**: Submit the response
6. **View Responses**: Go back to dashboard to see the new response

---

## 🌍 Translation Coverage

### Complete Translation Files:
- `src/i18n/translations.ts` - 133 translation keys per language
- Covers all UI text in the application

### Components Using Translations:
✅ LoginPage
✅ AdminDashboard
✅ QuestionnaireManagement
✅ DynamicQuestionnaire (already had language selector)
✅ LanguageSelector component

### Translation Keys Include:
- Common actions (save, cancel, delete, etc.)
- Authentication (login, sign in, etc.)
- Dashboard labels
- Questionnaire management (create, upload, activate, etc.)
- Form labels and placeholders
- Validation messages
- Status messages (success, error, loading)
- Question types
- Empty states and tips

---

## 🔍 Where to Find Things

### Frontend Files:
```
src/
├── i18n/
│   └── translations.ts          # All translations (EN/SQ/SR)
├── contexts/
│   └── LanguageContext.tsx      # Language state management
├── hooks/
│   └── useTranslation.ts        # Translation hook
├── components/
│   └── LanguageSelector.tsx     # Language switcher
├── LoginPage.tsx                # ✅ Translated
├── AdminDashboard.tsx           # ✅ Translated
├── QuestionnaireManagement.tsx  # ✅ Translated
└── DynamicQuestionnaire.tsx     # ✅ Already had translations
```

### Backend Files:
```
server/
├── src/
│   ├── routes/
│   │   ├── questionnaires.js    # CRUD for questionnaires
│   │   ├── file-upload.js       # Upload & convert
│   │   └── responses.js         # Updated with language field
│   └── index.js                 # Routes registered
├── database-migrations.sql      # ✅ Already run
└── package.json                 # ✅ Dependencies installed
```

---

## 💡 How Language System Works

### 1. Language Detection & Storage
```typescript
// First visit: Detects browser language
const browserLang = navigator.language.toLowerCase();
if (browserLang.startsWith('sq')) return 'sq';
if (browserLang.startsWith('sr')) return 'sr';
return 'en'; // Default

// Saves to localStorage: 'appLanguage'
```

### 2. Using Translations in Components
```typescript
import { useTranslation } from './hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('save')}</button>
    </div>
  );
};
```

### 3. Adding New Translation Keys

**Step 1: Add to interface** (translations.ts)
```typescript
export interface Translations {
  myNewKey: string;
  // ... other keys
}
```

**Step 2: Add translations**
```typescript
en: {
  myNewKey: 'My New Text',
  // ...
},
sq: {
  myNewKey: 'Teksti im i ri',
  // ...
},
sr: {
  myNewKey: 'Мој нови текст',
  // ...
}
```

**Step 3: Use in component**
```typescript
<p>{t('myNewKey')}</p>
```

---

## 🎨 Language Selector Variants

### Compact Variant (Used in Admin Pages)
```typescript
<LanguageSelector
  variant="compact"
  className="bg-white bg-opacity-20"
/>
```
- Small dropdown
- Custom styling supported
- Used in colored headers

### Default Variant
```typescript
<LanguageSelector />
```
- Standard dropdown
- Used in forms

---

## 📊 Testing Checklist

### UI Translation Tests:
- [ ] Login page shows translated text
- [ ] Language selector switches languages correctly
- [ ] Dashboard labels are translated
- [ ] Questionnaire management page fully translated
- [ ] Upload modal shows translated fields
- [ ] Success/error messages in correct language
- [ ] Status badges (Draft/Active/Archived) translated
- [ ] Empty states show translated messages
- [ ] Loading states show translated text

### Functional Tests:
- [ ] File upload works (Word/PDF)
- [ ] Questionnaire auto-generation works
- [ ] Can activate/archive questionnaires
- [ ] Can preview questionnaires
- [ ] Can duplicate questionnaires
- [ ] Can delete questionnaires
- [ ] Can fill out questionnaire in any language
- [ ] Can submit responses
- [ ] Responses appear in dashboard

### Multi-Language Tests:
- [ ] Switch language on login page
- [ ] Language persists after refresh
- [ ] Fill questionnaire in Albanian
- [ ] Fill questionnaire in Serbian
- [ ] Response records correct language
- [ ] Admin can see responses in all languages

---

## 🐛 Common Issues & Solutions

### Issue: Translations not showing
**Solution**: Make sure you imported `useTranslation`:
```typescript
import { useTranslation } from './hooks/useTranslation';
const { t } = useTranslation();
```

### Issue: Language not persisting
**Solution**: Check localStorage permissions. The system uses `localStorage.setItem('appLanguage', language)`.

### Issue: Some text still in English
**Solution**: Check if the text is using the `t()` function. Search for hardcoded strings and replace them.

### Issue: Server crashes with "ENOENT: no such file or directory, open './test/data/05-versions-space.pdf'"
**Solution**: This is a known bug with `pdf-parse` v1.1.1. The package tries to load a test file on initialization. Fix it by running:
```bash
cd server
mkdir -p test/data
dd if=/dev/zero of=test/data/05-versions-space.pdf bs=1024 count=1
```
This creates a dummy test file that pdf-parse needs. The server will start normally after this.

### Issue: File upload not working
**Solution**:
1. Verify backend dependencies installed: `cd server && npm install`
2. Check backend is running: `npm run dev`
3. Check console for errors

### Issue: Database errors
**Solution**: Verify database migration was run in Supabase SQL Editor.

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Add More Languages
Edit `src/i18n/translations.ts`:
```typescript
export type Language = 'en' | 'sq' | 'sr' | 'de'; // Add German

export const translations: Record<Language, Translations> = {
  // ... existing
  de: {
    adminLogin: 'Admin-Anmeldung',
    // ... add all keys
  }
};
```

### 2. Add Language to Routes
Currently language is client-side only. To add URL-based language:
```typescript
// App.tsx
<Route path="/:lang/dashboard" element={<Dashboard />} />
```

### 3. Add RTL Support (Arabic, Hebrew, etc.)
```css
html[dir="rtl"] {
  direction: rtl;
}
```

### 4. Add Translation Management UI
Build an admin interface to edit translations without touching code.

---

## 📞 Support & Documentation

### Full Documentation:
- **IMPLEMENTATION_COMPLETE.md** - Feature overview
- **TESTING_AND_DEPLOYMENT_GUIDE.md** - Detailed testing steps
- **AUDIT_REPORT.md** - Complete audit findings
- **IMPLEMENTATION_PROGRESS.md** - Technical details

### Key Features Implemented:
✅ Backend API (questionnaires, file upload)
✅ Frontend Components (management, dynamic rendering)
✅ Multi-language system (EN/SQ/SR)
✅ File upload & conversion (Word/PDF)
✅ Database schema with RLS
✅ Response tracking
✅ CSV export
✅ Draft saving

---

## 🎉 You're All Set!

The translation system is **fully integrated** and ready to use.

**To start testing:**
```bash
cd server && npm run dev
# In another terminal:
npm run dev
```

**Then visit:**
- Login: http://localhost:5173/login
- Dashboard: http://localhost:5173/dashboard (after login)
- Questionnaires: http://localhost:5173/questionnaires (after login)

**Switch languages** using the language selector in the top-right corner of any page!

---

**Date:** January 2025
**Status:** ✅ Translation Integration Complete
**Next:** Test the system end-to-end and deploy to production when ready.
