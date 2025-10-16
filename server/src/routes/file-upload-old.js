import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { supabase } from '../index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword' // .doc
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// ============================================
// HELPER: Extract text from Word document with structure
// ============================================
async function extractTextFromWord(buffer) {
  try {
    // Get both raw text and HTML for better structure detection
    const rawResult = await mammoth.extractRawText({ buffer });
    const htmlResult = await mammoth.convertToHtml({ buffer });

    return {
      text: rawResult.value,
      html: htmlResult.value
    };
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

// ============================================
// HELPER: Extract text from PDF
// ============================================
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// ============================================
// HELPER: Parse text into questionnaire structure
// ============================================
function parseTextToQuestionnaire(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sections = [];
  let currentSection = null;
  let currentQuestions = [];
  let questionCounter = 0;
  let lineBuffer = []; // For multi-line questions

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Enhanced section detection
    const isSectionHeader = (
      // All uppercase lines (3+ words)
      (line === line.toUpperCase() && line.split(/\s+/).length >= 3 && !line.includes('?')) ||
      // Explicit section markers
      line.match(/^(SECTION|Part|Chapter|Module|Unit)\s+(\d+|[IVX]+):?\s*/i) ||
      // Numbered sections like "I.", "II.", "III."
      line.match(/^([IVX]+|[A-Z])\.?\s+[A-Z]/i) ||
      // Bold or emphasized text patterns (common in Word/PDF)
      line.match(/^#+\s+/) || // Markdown headers
      // Centered text indicators (short lines between blank lines)
      (line.length > 10 && line.length < 80 && !line.includes('?') &&
       i > 0 && i < lines.length - 1 &&
       (lines[i-1] === '' || i === 0))
    );

    if (isSectionHeader) {
      // Save previous section if exists
      if (currentSection && currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: [...currentQuestions]
        });
      }

      // Clean section title
      let sectionTitle = line
        .replace(/^(SECTION|Part|Chapter|Module|Unit)\s+(\d+|[IVX]+):?\s*/i, '$1 $2: ')
        .replace(/^#+\s+/, '')
        .trim();

      // Start new section
      currentSection = {
        title: {
          en: sectionTitle,
          sq: sectionTitle,
          sr: sectionTitle
        },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      currentQuestions = [];
      continue;
    }

    // Enhanced question detection
    const questionPatterns = [
      /^(\d+\.?\d*\.?)\s+(.+)/, // Numbered: "1.", "1.1", "1.1.1"
      /^Q\.?\s*(\d+)\.?\s*(.+)/i, // "Q1.", "Q. 1"
      /^Question\s+(\d+)\.?\s*(.+)/i, // "Question 1."
      /^\[(\d+)\]\s*(.+)/, // "[1]"
      /^•\s*(.+)/, // Bullet points
      /^-\s*(.+)/, // Dashes
    ];

    let questionMatch = null;
    let matchedPattern = -1;

    for (let p = 0; p < questionPatterns.length; p++) {
      questionMatch = line.match(questionPatterns[p]);
      if (questionMatch) {
        matchedPattern = p;
        break;
      }
    }

    // Also check for lines ending with "?"
    const endsWithQuestion = line.endsWith('?');
    const isQuestion = questionMatch || endsWithQuestion;

    if (isQuestion) {
      questionCounter++;

      let questionText = line;
      if (questionMatch) {
        // Extract question text based on pattern
        if (matchedPattern === 0 || matchedPattern === 1 || matchedPattern === 2 || matchedPattern === 3) {
          questionText = questionMatch[2] || questionMatch[1];
        } else {
          questionText = questionMatch[1];
        }
      }

      // Clean question text
      questionText = questionText
        .replace(/\s+/g, ' ')
        .replace(/^\W+/, '') // Remove leading non-word chars
        .trim();

      // Enhanced question type detection
      let questionType = 'textarea'; // default

      // Check for explicit type indicators
      if (lowerLine.match(/(yes\/no|true\/false|agree\/disagree)/)) {
        questionType = 'radio';
      } else if (lowerLine.match(/(date|when|year|month)/)) {
        questionType = 'date';
      } else if (lowerLine.match(/(email|e-mail|contact)/)) {
        questionType = 'email';
      } else if (lowerLine.match(/(website|url|link|http)/)) {
        questionType = 'url';
      } else if (lowerLine.match(/(number|quantity|amount|how many|count)/)) {
        questionType = 'number';
      } else if (lowerLine.match(/(select|choose|pick|multiple choice)/)) {
        questionType = 'select';
      } else if (lowerLine.match(/(check all|select all|multiple)/)) {
        questionType = 'checkbox';
      } else if (questionText.length < 150 && !lowerLine.includes('explain') && !lowerLine.includes('describe')) {
        questionType = 'text';
      }

      // Enhanced option detection
      const options = [];
      let j = i + 1;
      let foundOptions = false;

      while (j < lines.length) {
        const nextLine = lines[j];

        // Multiple option patterns
        const optionPatterns = [
          /^[\(\[]?([a-z]|[A-Z]|\d+)[\)\.\]\:]?\s+(.+)/, // a) b) c) or a. b. c.
          /^[○●▪▫■□•◦‣⁃]\s+(.+)/, // Bullet symbols
          /^[-–—]\s+(.+)/, // Dashes
          /^[\*]\s+(.+)/, // Asterisks
          /^[►▸►]\s+(.+)/, // Arrows
        ];

        let optionMatch = null;
        for (const pattern of optionPatterns) {
          optionMatch = nextLine.match(pattern);
          if (optionMatch) break;
        }

        if (optionMatch) {
          foundOptions = true;
          const optionText = optionMatch[optionMatch.length - 1].trim();

          options.push({
            value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
            label: {
              en: optionText,
              sq: optionText,
              sr: optionText
            }
          });
          j++;
        } else if (foundOptions && nextLine.trim() === '') {
          // Empty line after options - stop
          break;
        } else if (foundOptions) {
          // Non-option line after finding options - stop
          break;
        } else {
          // No options found yet - stop
          break;
        }
      }

      if (options.length > 0) {
        i = j - 1; // Skip the option lines

        // Determine type based on number of options
        if (options.length === 2 && options.some(o => o.label.en.match(/yes|no|true|false/i))) {
          questionType = 'radio';
        } else if (options.length <= 4) {
          questionType = 'radio';
        } else if (options.length > 8) {
          questionType = 'select';
        } else if (questionType === 'checkbox') {
          questionType = 'checkbox'; // Keep checkbox if explicitly detected
        } else {
          questionType = 'radio';
        }
      }

      // Check for required indicator
      const isRequired = lowerLine.includes('*') || lowerLine.includes('required') ||
                        lowerLine.includes('mandatory') || lowerLine.includes('(r)');

      const question = {
        question_text: {
          en: questionText,
          sq: questionText,
          sr: questionText
        },
        question_type: questionType,
        options: options.length > 0 ? options : null,
        required: isRequired,
        order_index: currentQuestions.length,
        validation_rules: questionType === 'number' ? { min: 0 } : null,
        help_text: { en: '', sq: '', sr: '' }
      };

      currentQuestions.push(question);
    }
  }

  // Add last section
  if (currentSection && currentQuestions.length > 0) {
    sections.push({
      ...currentSection,
      questions: [...currentQuestions]
    });
  }

  // If no sections were detected, create a default one
  if (sections.length === 0 && currentQuestions.length > 0) {
    sections.push({
      title: {
        en: 'General Questions',
        sq: 'Pyetje të Përgjithshme',
        sr: 'Општа питања'
      },
      description: { en: '', sq: '', sr: '' },
      order_index: 0,
      questions: currentQuestions
    });
  }

  // If we still have no sections/questions, try more aggressive parsing
  if (sections.length === 0 && lines.length > 0) {
    // Create questions from any line that looks like it could be a question
    const fallbackQuestions = [];
    for (const line of lines) {
      if (line.length > 10 && line.length < 500) {
        fallbackQuestions.push({
          question_text: {
            en: line,
            sq: line,
            sr: line
          },
          question_type: line.length < 150 ? 'text' : 'textarea',
          options: null,
          required: false,
          order_index: fallbackQuestions.length,
          validation_rules: null,
          help_text: { en: '', sq: '', sr: '' }
        });
      }
    }

    if (fallbackQuestions.length > 0) {
      sections.push({
        title: {
          en: 'Imported Content',
          sq: 'Përmbajtje e Importuar',
          sr: 'Увезени садржај'
        },
        description: { en: '', sq: '', sr: '' },
        order_index: 0,
        questions: fallbackQuestions
      });
    }
  }

  return sections;
}

// ============================================
// UPLOAD AND CONVERT FILE TO QUESTIONNAIRE
// ============================================
router.post('/convert', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Questionnaire title is required' });
    }

    // Extract text based on file type
    let extractedText;
    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractTextFromPDF(req.file.buffer);
    } else {
      extractedText = await extractTextFromWord(req.file.buffer);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // Parse text into questionnaire structure
    const sections = parseTextToQuestionnaire(extractedText);

    if (sections.length === 0) {
      return res.status(400).json({
        error: 'Could not detect any questions in the document',
        extractedText: extractedText.substring(0, 500) // Return first 500 chars for debugging
      });
    }

    // Create questionnaire in database
    const { data: questionnaire, error: qError } = await supabase
      .from('questionnaires')
      .insert([{
        title,
        description: description || `Imported from ${req.file.originalname}`,
        status: 'draft',
        created_by: req.user.id
      }])
      .select()
      .single();

    if (qError) {
      console.error('Create questionnaire error:', qError);
      return res.status(500).json({ error: 'Failed to create questionnaire' });
    }

    // Create sections and questions
    for (const section of sections) {
      const { data: createdSection, error: sError } = await supabase
        .from('questionnaire_sections')
        .insert([{
          questionnaire_id: questionnaire.id,
          title: section.title,
          description: section.description,
          order_index: section.order_index
        }])
        .select()
        .single();

      if (sError) {
        console.error('Create section error:', sError);
        continue;
      }

      if (section.questions && section.questions.length > 0) {
        const questionsData = section.questions.map(q => ({
          section_id: createdSection.id,
          questionnaire_id: questionnaire.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          required: q.required,
          order_index: q.order_index,
          validation_rules: q.validation_rules,
          help_text: q.help_text
        }));

        const { error: qsError } = await supabase
          .from('questions')
          .insert(questionsData);

        if (qsError) {
          console.error('Create questions error:', qsError);
        }
      }
    }

    // Record file upload
    const { error: fError } = await supabase
      .from('file_uploads')
      .insert([{
        questionnaire_id: questionnaire.id,
        original_filename: req.file.originalname,
        file_type: req.file.mimetype,
        file_size: req.file.size,
        uploaded_by: req.user.id,
        upload_status: 'completed',
        processing_result: {
          sections_created: sections.length,
          total_questions: sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
        }
      }]);

    if (fError) {
      console.error('Record file upload error:', fError);
    }

    res.status(201).json({
      success: true,
      message: 'File converted to questionnaire successfully',
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        sections_count: sections.length,
        questions_count: sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
      },
      preview: sections.map(s => ({
        title: s.title.en,
        questions_count: s.questions?.length || 0
      }))
    });
  } catch (error) {
    console.error('File conversion error:', error);

    // Record failed upload
    if (req.file) {
      try {
        await supabase
          .from('file_uploads')
          .insert([{
            original_filename: req.file.originalname,
            file_type: req.file.mimetype,
            file_size: req.file.size,
            uploaded_by: req.user?.id,
            upload_status: 'failed',
            processing_result: {
              error: error.message
            }
          }]);
      } catch (dbError) {
        console.error('Failed to record error:', dbError);
      }
    }

    res.status(500).json({
      error: 'Failed to convert file to questionnaire',
      details: error.message
    });
  }
});

// ============================================
// GET UPLOAD HISTORY
// ============================================
router.get('/uploads', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Fetch uploads error:', error);
      return res.status(500).json({ error: 'Failed to fetch upload history' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fetch uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch upload history' });
  }
});

export default router;
