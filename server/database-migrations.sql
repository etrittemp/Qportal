-- Database Migration for Questionnaire Management System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE QUESTIONNAIRES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- ============================================
-- 2. CREATE QUESTIONNAIRE SECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questionnaire_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  title JSONB NOT NULL, -- Multi-language support: {"en": "Title", "sq": "Titulli", "sr": "Naslov"}
  description JSONB, -- Multi-language support
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES questionnaire_sections(id) ON DELETE CASCADE,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text JSONB NOT NULL, -- Multi-language support
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN (
    'text', 'textarea', 'radio', 'checkbox', 'select', 'date', 'number', 'email', 'url', 'file'
  )),
  options JSONB, -- For radio, checkbox, select types: [{"value": "yes", "label": {"en": "Yes", "sq": "Po", "sr": "Da"}}]
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  validation_rules JSONB, -- {"min": 0, "max": 100, "pattern": "regex", etc.}
  help_text JSONB, -- Multi-language help text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. UPDATE QUESTIONNAIRE_RESPONSES TABLE
-- ============================================
-- Add questionnaire_id foreign key to existing table
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL;

-- Add language preference
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add response version tracking
ALTER TABLE questionnaire_responses
ADD COLUMN IF NOT EXISTS questionnaire_version INTEGER DEFAULT 1;

-- ============================================
-- 5. CREATE FILE UPLOADS TABLE (for Word/PDF imports)
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  original_filename VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  upload_status VARCHAR(50) DEFAULT 'processing' CHECK (upload_status IN ('processing', 'completed', 'failed')),
  processing_result JSONB, -- Store extraction results or errors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questionnaires_status ON questionnaires(status);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created_by ON questionnaires(created_by);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created_at ON questionnaires(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sections_questionnaire ON questionnaire_sections(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_sections_order ON questionnaire_sections(questionnaire_id, order_index);

CREATE INDEX IF NOT EXISTS idx_questions_section ON questions(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_questionnaire ON questions(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(section_id, order_index);

CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_responses_language ON questionnaire_responses(language);

CREATE INDEX IF NOT EXISTS idx_file_uploads_questionnaire ON file_uploads(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status);

-- ============================================
-- 7. UPDATE RLS POLICIES
-- ============================================
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (this is what our backend uses)
CREATE POLICY "Service role can do everything on questionnaires"
  ON questionnaires FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on sections"
  ON questionnaire_sections FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on questions"
  ON questions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can do everything on file_uploads"
  ON file_uploads FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for auto-updating updated_at
CREATE TRIGGER update_questionnaires_updated_at BEFORE UPDATE ON questionnaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON questionnaire_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. MIGRATE EXISTING DATA (if needed)
-- ============================================

-- Create a default questionnaire for existing responses
INSERT INTO questionnaires (id, title, description, status, version, published_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'EUDA Roadmap to Participation Questionnaire',
  'Original questionnaire for EUDA participation assessment',
  'active',
  1,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Link existing responses to the default questionnaire
UPDATE questionnaire_responses
SET questionnaire_id = '00000000-0000-0000-0000-000000000001'
WHERE questionnaire_id IS NULL;

-- ============================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE questionnaires IS 'Stores questionnaire templates created by admins';
COMMENT ON TABLE questionnaire_sections IS 'Sections within questionnaires for organizing questions';
COMMENT ON TABLE questions IS 'Individual questions with multi-language support';
COMMENT ON TABLE file_uploads IS 'Tracks Word/PDF files uploaded for questionnaire generation';

COMMENT ON COLUMN questionnaires.status IS 'draft: being edited, active: accepting responses, archived: no longer active';
COMMENT ON COLUMN questions.question_type IS 'Defines the input type for the question';
COMMENT ON COLUMN questions.options IS 'JSON array of options for radio/checkbox/select types';
COMMENT ON COLUMN questions.validation_rules IS 'JSON object with validation rules (min, max, pattern, etc.)';
