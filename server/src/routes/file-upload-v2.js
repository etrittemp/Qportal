import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { supabase } from '../index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// ============================================
// HELPER: Extract text from Word with structure
// ============================================
async function extractTextFromWord(buffer) {
  try {
    const rawResult = await mammoth.extractRawText({ buffer });
    const htmlResult = await mammoth.convertToHtml({ buffer });
    return { text: rawResult.value, html: htmlResult.value };
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
    return { text: data.text, html: null };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// ============================================
// ADVANCED PARSING: Detect question type from text and context
// ============================================
function detectQuestionType(questionText, nextLines, htmlContext) {
  const lowerText = questionText.toLowerCase();

  // Check for scale/rating questions
  if (lowerText.match(/scale\s+of\s+\d+\s+to\s+\d+/) ||
      lowerText.match(/\d+\s*=.*\d+\s*=/) ||
      lowerText.match(/rate|rating/)) {
    return 'radio'; // Scale questions use radio buttons
  }

  // Check for ranking questions
  if (lowerText.match(/rank|order\s+of\s+importance|prioritize/)) {
    return 'text'; // Ranking becomes text input (can be enhanced later)
  }

  // Check for yes/no questions
  if (lowerText.match(/\(?\s*yes\s*\/\s*no\s*\)?/) ||
      (nextLines.some(l => l.match(/^\(\s*\)\s*(yes|no)/i)) &&
       nextLines.filter(l => l.match(/^\(\s*\)\s*(yes|no)/i)).length === 2)) {
    return 'radio';
  }

  // Check for checkbox questions (select all, multiple selection)
  if (lowerText.match(/select\s+all\s+that\s+apply|check\s+all|choose\s+all|up\s+to\s+\d+/i)) {
    return 'checkbox';
  }

  // Check for date/time questions
  if (lowerText.match(/date|when|year|month|day/i) && !lowerText.match(/update|to\s+date/)) {
    return 'date';
  }

  // Check for email
  if (lowerText.match(/email|e-mail|contact/i) && !lowerText.match(/send|forward/)) {
    return 'email';
  }

  // Check for URL
  if (lowerText.match(/website|url|link|http/i)) {
    return 'url';
  }

  // Check for number
  if (lowerText.match(/how\s+many|number\s+of|quantity|amount|count|age/i)) {
    return 'number';
  }

  // Check for long text (comment box, describe, explain)
  if (lowerText.match(/describe|explain|comment|feedback|thoughts|opinion|elaborate/) ||
      lowerText.match(/\[comment\s+box/i)) {
    return 'textarea';
  }

  // Check next lines for option indicators
  const hasParenthesesOptions = nextLines.some(l => l.match(/^\(\s*\)/));
  const hasBracketOptions = nextLines.some(l => l.match(/^\[\s*\]/));

  if (hasParenthesesOptions) return 'radio';
  if (hasBracketOptions) return 'checkbox';

  // Default based on question length
  return questionText.length < 200 ? 'text' : 'textarea';
}

// ============================================
// ADVANCED PARSING: Extract options from lines
// ============================================
function extractOptions(lines, startIndex) {
  const options = [];
  let i = startIndex;

  // Pattern for parentheses: ( ) Option text
  const parenthesesPattern = /^\(\s*\)\s+(.+)/;
  // Pattern for brackets: [ ] Option text
  const bracketsPattern = /^\[\s*\]\s+(.+)/;
  // Pattern for lettered: a) Option or (a) Option
  const letteredPattern = /^[\(\[]?([a-zA-Z]|\d+)[\)\.\]\:]?\s+(.+)/;
  // Pattern for bullets and symbols
  const symbolPattern = /^[○●▪▫■□•◦‣⁃\-–—\*►▸]\s+(.+)/;
  // Pattern for underscores (blank fields)
  const blankPattern = /^_{3,}/;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Stop at empty line
    if (!line) break;

    // Stop at next question number
    if (line.match(/^\d+\./)) break;

    // Stop at next section
    if (line.match(/^(SECTION|Part|Chapter)/i)) break;

    // Match parentheses options
    let match = line.match(parenthesesPattern);
    if (match) {
      const optionText = match[1].trim();
      // Handle "Other (please specify):" specially
      if (optionText.match(/other.*specify|other.*fill|other.*text/i)) {
        options.push({
          value: 'other',
          label: { en: optionText, sq: optionText, sr: optionText },
          allowText: true
        });
      } else {
        options.push({
          value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: optionText, sq: optionText, sr: optionText }
        });
      }
      i++;
      continue;
    }

    // Match bracket options
    match = line.match(bracketsPattern);
    if (match) {
      const optionText = match[1].trim();
      if (optionText.match(/other.*specify|other.*fill|other.*text/i)) {
        options.push({
          value: 'other',
          label: { en: optionText, sq: optionText, sr: optionText },
          allowText: true
        });
      } else {
        options.push({
          value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: optionText, sq: optionText, sr: optionText }
        });
      }
      i++;
      continue;
    }

    // Match lettered options
    match = line.match(letteredPattern);
    if (match && options.length > 0) { // Only if we've already found options
      const optionText = match[2].trim();
      options.push({
        value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label: { en: optionText, sq: optionText, sr: optionText }
      });
      i++;
      continue;
    }

    // Match symbol options
    match = line.match(symbolPattern);
    if (match && options.length > 0) {
      const optionText = match[1].trim();
      options.push({
        value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label: { en: optionText, sq: optionText, sr: optionText }
      });
      i++;
      continue;
    }

    // Match blank fields (for ranking or fill-in)
    if (line.match(blankPattern)) {
      i++;
      continue;
    }

    // If we have options and this line doesn't match, we're done
    if (options.length > 0) break;

    i++;
  }

  return { options, endIndex: i };
}

// ============================================
// ADVANCED PARSING: Detect if line is a section header
// ============================================
function isSectionHeader(line, prevLine, nextLine, htmlContext) {
  const trimmed = line.trim();

  // Exclude lines that are clearly not sections
  // Exclude option indicators
  if (trimmed.match(/^\(\s*\)|^\[\s*\]/)) return false;
  // Exclude scale indicators like "( ) 1 ( ) 2 ( ) 3 ( ) 4 ( ) 5"
  if (trimmed.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/)) return false;
  // Exclude blank fields
  if (trimmed.match(/^_{3,}/)) return false;
  // Exclude numbered questions
  if (trimmed.match(/^\d+\./)) return false;

  // Check HTML for strong/heading tags
  if (htmlContext && htmlContext.includes(`<strong>${line}</strong>`)) {
    return true;
  }
  if (htmlContext && htmlContext.match(new RegExp(`<h[1-6]>.*${line}.*</h[1-6]>`, 'i'))) {
    return true;
  }

  // Pattern 1: "Section X:" or "Part X:"
  if (trimmed.match(/^(SECTION|Part|Chapter|Module|Unit)\s+[A-Z0-9]+\s*:/i)) {
    return true;
  }

  // Pattern 2: All caps with multiple words (but not questions and not too short)
  if (trimmed === trimmed.toUpperCase() &&
      trimmed.split(/\s+/).length >= 3 &&
      !trimmed.includes('?') &&
      trimmed.length > 15 &&
      trimmed.length < 100) {
    return true;
  }

  // Pattern 3: Roman numerals or single capital letters followed by text
  if (trimmed.match(/^([IVX]+|[A-D])\.?\s+[A-Z][a-z]{3,}/)) {
    return true;
  }

  return false;
}

// ============================================
// ADVANCED PARSING: Parse text into questionnaire structure
// ============================================
function parseTextToQuestionnaire(extractedData) {
  const { text, html } = extractedData;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  const sections = [];
  let currentSection = null;
  let currentQuestions = [];
  let skipLines = new Set(); // Track lines we've already processed

  for (let i = 0; i < lines.length; i++) {
    // Skip if we've already processed this line
    if (skipLines.has(i)) continue;

    const line = lines[i];

    // Skip introduction text, titles, and thank you messages
    if (line.match(/^(introduction|thank\s+you|questionnaire|survey)/i) && !line.includes('?')) {
      continue;
    }

    // Detect section headers
    if (isSectionHeader(line, lines[i - 1], lines[i + 1], html)) {
      // Save previous section
      if (currentSection && currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: currentQuestions
        });
        currentQuestions = [];
      }

      // Clean and create new section
      let sectionTitle = line
        .replace(/^(SECTION|Part|Chapter|Module|Unit)\s+([A-Z0-9]+)\s*:?\s*/i, '$1 $2: ')
        .trim();

      currentSection = {
        title: { en: sectionTitle, sq: sectionTitle, sr: sectionTitle },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      continue;
    }

    // Detect questions - more sophisticated patterns
    const questionPatterns = [
      /^(\d+)\.\s+(.+)/, // "1. Question"
      /^(\d+\.?\d*\.?)\s+(.+)/, // "1.1 Question" or "1.1. Question"
      /^Question\s+(\d+)\.?\s*(.+)/i,
      /^Q\.?\s*(\d+)\.?\s*(.+)/i,
      /^\[(\d+)\]\s*(.+)/,
    ];

    let questionMatch = null;
    let matchedPattern = null;

    for (const pattern of questionPatterns) {
      questionMatch = line.match(pattern);
      if (questionMatch) {
        matchedPattern = pattern;
        break;
      }
    }

    // Check if it's a question
    // Must have question number OR end with ? AND be substantial (> 10 chars)
    const isQuestion = (questionMatch || (line.endsWith('?') && line.length > 10));

    if (isQuestion) {
      let questionText = line;
      let questionNumber = null;

      if (questionMatch) {
        questionNumber = questionMatch[1];
        questionText = questionMatch[2] || questionMatch[1];
      }

      // Clean question text
      questionText = questionText
        .replace(/^\W+/, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Look ahead for context (next 15 lines)
      const nextLines = lines.slice(i + 1, i + 16);

      // Detect question type
      const questionType = detectQuestionType(questionText, nextLines, html);

      // Extract options if applicable
      let options = [];
      let endIndex = i + 1;

      if (['radio', 'checkbox', 'select'].includes(questionType)) {
        const result = extractOptions(lines, i + 1);
        options = result.options;
        endIndex = result.endIndex;

        // Mark these lines as processed
        for (let j = i + 1; j < endIndex; j++) {
          skipLines.add(j);
        }
      }

      // Detect if required
      const isRequired = questionText.includes('*') ||
                        questionText.match(/\(required\)/i) ||
                        questionText.match(/\(mandatory\)/i);

      // Create question object
      const question = {
        question_text: {
          en: questionText.replace(/\*$/, '').trim(),
          sq: questionText.replace(/\*$/, '').trim(),
          sr: questionText.replace(/\*$/, '').trim()
        },
        question_type: questionType,
        options: options.length > 0 ? options : null,
        required: isRequired,
        order_index: currentQuestions.length,
        validation_rules: questionType === 'number' ? { min: 0 } : null,
        help_text: { en: '', sq: '', sr: '' }
      };

      currentQuestions.push(question);

      // Skip to end of options
      i = endIndex - 1;
      continue;
    }
  }

  // Add final section
  if (currentSection && currentQuestions.length > 0) {
    sections.push({
      ...currentSection,
      questions: currentQuestions
    });
  }

  // If no sections detected, create default one
  if (sections.length === 0 && currentQuestions.length > 0) {
    sections.push({
      title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
      description: { en: '', sq: '', sr: '' },
      order_index: 0,
      questions: currentQuestions
    });
  }

  // If still nothing, fallback to aggressive parsing
  if (sections.length === 0 && lines.length > 5) {
    const fallbackQuestions = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 15 && line.length < 500 &&
          !line.match(/^(introduction|thank|questionnaire|survey|section|part|chapter)/i)) {
        fallbackQuestions.push({
          question_text: { en: line, sq: line, sr: line },
          question_type: line.length < 200 ? 'text' : 'textarea',
          options: null,
          required: false,
          order_index: fallbackQuestions.length,
          validation_rules: null,
          help_text: { en: '', sq: '', sr: '' }
        });

        if (fallbackQuestions.length >= 20) break; // Limit fallback
      }
    }

    if (fallbackQuestions.length > 0) {
      sections.push({
        title: { en: 'Imported Content', sq: 'Përmbajtje e Importuar', sr: 'Увезени садржај' },
        description: { en: '', sq: '', sr: '' },
        order_index: 0,
        questions: fallbackQuestions
      });
    }
  }

  return sections;
}

// ============================================
// UPLOAD AND CONVERT ENDPOINT
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

    // Extract text
    let extractedData;
    if (req.file.mimetype === 'application/pdf') {
      extractedData = await extractTextFromPDF(req.file.buffer);
    } else {
      extractedData = await extractTextFromWord(req.file.buffer);
    }

    if (!extractedData.text || extractedData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // Parse into questionnaire structure
    const sections = parseTextToQuestionnaire(extractedData);

    if (sections.length === 0) {
      return res.status(400).json({
        error: 'Could not detect any questions in the document',
        hint: 'Please ensure questions are numbered (e.g., "1. Question text")',
        extractedText: extractedData.text.substring(0, 500)
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
    await supabase
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
        questions_count: s.questions?.length || 0,
        sample_questions: s.questions?.slice(0, 3).map(q => q.question_text.en)
      }))
    });
  } catch (error) {
    console.error('File conversion error:', error);

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
