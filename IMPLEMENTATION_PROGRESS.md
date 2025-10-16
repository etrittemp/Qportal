# Questionnaire Management System - Implementation Progress

## ✅ Completed Features (Phase 1)

### 1. Database Schema Design
**File:** `server/database-migrations.sql`

Created comprehensive database structure:
- **questionnaires table**: Stores questionnaire templates with multi-status support (draft, active, archived)
- **questionnaire_sections table**: Organizes questions into sections with multi-language support
- **questions table**: Individual questions with 10 different input types (text, textarea, radio, checkbox, select, date, number, email, url, file)
- **file_uploads table**: Tracks Word/PDF uploads and conversion status
- **Updated questionnaire_responses**: Added questionnaire_id and language fields

**Key Features:**
- Multi-language support (JSON fields for EN, SQ, SR)
- Versioning system
- RLS (Row Level Security) enabled
- Indexes for performance optimization
- Cascade deletion support
- Auto-updating timestamps

### 2. Backend API Routes

#### **Questionnaire Management** (`server/src/routes/questionnaires.js`)
- `GET /api/questionnaires` - List all questionnaires (with status filter)
- `GET /api/questionnaires/:id` - Get questionnaire with sections and questions
- `GET /api/questionnaires/public/:id` - Public endpoint for active questionnaires only
- `POST /api/questionnaires` - Create new questionnaire
- `PUT /api/questionnaires/:id` - Update questionnaire
- `DELETE /api/questionnaires/:id` - Delete questionnaire (with safety checks)
- `GET /api/questionnaires/:id/stats` - Get response statistics
- `POST /api/questionnaires/:id/duplicate` - Duplicate questionnaire

#### **File Upload & Conversion** (`server/src/routes/file-upload.js`)
- `POST /api/file-upload/convert` - Upload Word/PDF and auto-convert to questionnaire
- `GET /api/file-upload/uploads` - Get upload history

**Smart Document Parser:**
- Automatically detects sections (UPPERCASE headings, "SECTION X", etc.)
- Extracts questions (numbered, ending with ?, etc.)
- Detects question types (yes/no → radio, email → email, etc.)
- Parses options (a), b), c) format
- Creates multi-language stubs for admin to translate

**Dependencies Added:**
- `multer` - File upload handling
- `mammoth` - Word document text extraction
- `pdf-parse` - PDF text extraction

### 3. Frontend Components

#### **Questionnaire Management UI** (`src/QuestionnaireManagement.tsx`)
Features:
- Grid view of all questionnaires with status badges
- Search and filter by status (draft, active, archived)
- Upload modal for Word/PDF conversion
- Quick actions: View, Duplicate, View Responses, Archive, Delete
- Response statistics displayed on each card
- Status management (Activate, Archive, Reactivate)

#### **Updated API Client** (`src/api.ts`)
Added `questionnaireAPI` with all CRUD operations:
- getAll, getById, getPublic
- create, update, delete
- getStats, duplicate
- uploadFile, getUploadHistory

#### **Updated Routes** (`src/App.tsx`)
- Added `/questionnaires` route (protected)
- Navigation button added to AdminDashboard

### 4. Updated Response Tracking
Modified `server/src/routes/responses.js`:
- Now accepts `questionnaireId` and `language` fields
- Defaults to legacy questionnaire ID for backward compatibility
- All new responses linked to specific questionnaires

---

## 🚧 Next Steps (Phase 2)

### 5. Dynamic Questionnaire Renderer
**File to create:** `src/DynamicQuestionnaire.tsx`

Need to build:
- Component that renders any questionnaire from database structure
- Supports all question types (text, textarea, radio, checkbox, select, date, number, email, url, file)
- Multi-language support (language switcher)
- Form validation based on validation_rules JSON
- Progress indicator
- Section navigation
- Save as draft feature
- Submit functionality

### 6. Questionnaire Builder/Editor
**File to create:** `src/QuestionnaireBuilder.tsx`

Need to build:
- Visual editor for creating questionnaires manually
- Drag-and-drop section/question reordering
- Add/edit/delete sections
- Add/edit/delete questions
- Configure question types and options
- Multi-language editor (tabs for EN, SQ, SR)
- Validation rules editor
- Preview mode

### 7. Multi-Language Infrastructure
**Files to create:**
- `src/i18n/translations.ts` - Translation definitions
- `src/contexts/LanguageContext.tsx` - Language state management
- `src/hooks/useTranslation.ts` - Translation hook

Need to implement:
- Language selector component
- Translation system for UI elements
- Database translations for questionnaire content (already structured)
- Language persistence (localStorage)
- RTL support (if needed for Albanian/Serbian)

Translations needed:
- UI labels and buttons
- Error messages
- Validation messages
- Country list
- Status labels

### 8. Testing & Integration
- [ ] Run database migration in Supabase
- [ ] Install backend dependencies: `cd server && npm install`
- [ ] Test file upload with sample Word/PDF documents
- [ ] Create test questionnaires
- [ ] Test questionnaire duplication
- [ ] Test status changes (draft → active → archived)
- [ ] Verify backward compatibility with existing responses
- [ ] Test response submission with new questionnaire_id
- [ ] End-to-end testing

---

## 📋 Installation Instructions

### Step 1: Database Migration
1. Go to Supabase SQL Editor
2. Run the entire `server/database-migrations.sql` file
3. Verify all tables created successfully

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

This will install:
- multer@^1.4.5-lts.1
- mammoth@^1.6.0
- pdf-parse@^1.1.1

### Step 3: Install Frontend Dependencies (if needed)
```bash
cd ..
npm install
```

### Step 4: Test Locally
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
npm run dev
```

### Step 5: Access New Features
- Login at: http://localhost:5173/login
- Go to: http://localhost:5173/questionnaires
- Upload a Word/PDF document
- Create a new questionnaire

---

## 🎯 Usage Guide

### For Admins: Creating Questionnaires

#### Method 1: Upload Document (Easiest)
1. Navigate to `/questionnaires`
2. Click "Upload Document"
3. Select a Word (.docx) or PDF file
4. Provide a title
5. Click "Upload & Convert"
6. System automatically extracts sections and questions
7. Edit the generated questionnaire if needed

#### Method 2: Manual Creation (Coming in Phase 2)
1. Navigate to `/questionnaires`
2. Click "Create New"
3. Use the visual builder to add sections and questions
4. Configure multi-language content
5. Save as draft or publish immediately

### Managing Questionnaires
- **Draft**: Being edited, not visible to respondents
- **Active**: Accepting responses, visible to public
- **Archived**: No longer accepting responses, read-only

### Document Upload Tips
For best results when uploading documents:
- Use clear section headers (UPPERCASE or "Section 1: Title")
- Number your questions (1., 2., 3. or Q1, Q2, Q3)
- For multiple choice, use (a), (b), (c) or - option format
- Keep questions concise and clear
- The system will auto-detect question types but you can edit afterward

---

## 🔍 API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/questionnaires` | Admin | List all questionnaires |
| GET | `/api/questionnaires/:id` | Admin | Get questionnaire details |
| GET | `/api/questionnaires/public/:id` | Public | Get active questionnaire |
| POST | `/api/questionnaires` | Admin | Create questionnaire |
| PUT | `/api/questionnaires/:id` | Admin | Update questionnaire |
| DELETE | `/api/questionnaires/:id` | Admin | Delete questionnaire |
| GET | `/api/questionnaires/:id/stats` | Admin | Get statistics |
| POST | `/api/questionnaires/:id/duplicate` | Admin | Duplicate questionnaire |
| POST | `/api/file-upload/convert` | Admin | Upload & convert document |
| GET | `/api/file-upload/uploads` | Admin | Get upload history |
| POST | `/api/responses/submit` | Public | Submit response (now with questionnaire_id) |

---

## 🗄️ Database Schema

### questionnaires
```
id (UUID, PK)
title (VARCHAR 500)
description (TEXT)
status (VARCHAR 50) - draft | active | archived
version (INTEGER)
created_by (UUID, FK → admin_users)
created_at, updated_at, published_at
metadata (JSONB)
```

### questionnaire_sections
```
id (UUID, PK)
questionnaire_id (UUID, FK)
title (JSONB) - {"en": "...", "sq": "...", "sr": "..."}
description (JSONB)
order_index (INTEGER)
```

### questions
```
id (UUID, PK)
section_id (UUID, FK)
questionnaire_id (UUID, FK)
question_text (JSONB) - Multi-language
question_type (VARCHAR 50) - text|textarea|radio|checkbox|select|date|number|email|url|file
options (JSONB) - For select/radio/checkbox
required (BOOLEAN)
order_index (INTEGER)
validation_rules (JSONB)
help_text (JSONB)
```

### questionnaire_responses (Updated)
```
... (existing fields)
questionnaire_id (UUID, FK) - NEW
language (VARCHAR 10) - NEW (en|sq|sr)
questionnaire_version (INTEGER) - NEW
```

### file_uploads
```
id (UUID, PK)
questionnaire_id (UUID, FK)
original_filename (VARCHAR 500)
file_type (VARCHAR 50)
file_size (INTEGER)
uploaded_by (UUID, FK)
upload_status (VARCHAR 50) - processing|completed|failed
processing_result (JSONB)
created_at
```

---

## 🚀 Deployment Checklist

Before deploying to production:
- [ ] Run database migrations on production Supabase
- [ ] Update environment variables on Vercel
- [ ] Test file upload with 10MB limit
- [ ] Verify CORS settings for file uploads
- [ ] Test multi-language content
- [ ] Backup existing responses
- [ ] Test backward compatibility
- [ ] Update documentation
- [ ] Train admins on new features

---

## 🐛 Known Limitations

1. **File Upload Size**: Limited to 10MB (configurable in multer settings)
2. **Document Parsing**: Works best with well-structured documents
3. **Language Translations**: System creates stubs; admin must manually translate
4. **Question Types**: Auto-detection is best-effort; may need manual adjustment
5. **Legacy Support**: Old questionnaire (euda-questionnaire.html) still uses localStorage

---

## 📞 Support

For issues or questions:
1. Check the error logs in browser console
2. Check server logs for API errors
3. Verify database migrations ran successfully
4. Check Supabase RLS policies
5. Verify JWT tokens are valid

