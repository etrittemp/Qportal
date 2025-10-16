import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { supabase } from '../index.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ADVANCED CONFIGURATION
// ============================================

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
// NLP-INSPIRED FEATURE EXTRACTION
// ============================================

/**
 * Extract linguistic features from question text
 * Based on 2025 NLP best practices: POS tagging, NER patterns, dependency parsing indicators
 */
function extractLinguisticFeatures(text) {
  const lower = text.toLowerCase();

  return {
    // Interrogative patterns (WH-questions)
    hasWho: /\b(who|whom|whose)\b/i.test(text),
    hasWhat: /\b(what|what's)\b/i.test(text),
    hasWhen: /\b(when|what time)\b/i.test(text),
    hasWhere: /\b(where)\b/i.test(text),
    hasWhy: /\b(why)\b/i.test(text),
    hasHow: /\b(how|how many|how much|how often|how long)\b/i.test(text),
    hasWhich: /\b(which)\b/i.test(text),

    // Modal verbs indicating preference/opinion
    hasWould: /\b(would|could|should|might)\b/i.test(text),
    hasPrefer: /\b(prefer|preference|like|love|enjoy|favorite)\b/i.test(text),

    // Temporal indicators
    hasTemporal: /\b(date|time|year|month|day|week|yesterday|today|tomorrow|when|schedule|deadline)\b/i.test(text),
    hasFrequency: /\b(often|frequency|daily|weekly|monthly|yearly|always|never|sometimes|regularly)\b/i.test(text),

    // Quantitative indicators
    hasQuantity: /\b(how many|number of|count|quantity|amount|total|sum)\b/i.test(text),
    hasNumeric: /\b(age|years old|score|rating|percentage|rate)\b/i.test(text),
    hasScale: /\b(scale|rate|rating|rank|grade|level|from \d+ to \d+|out of \d+|\d+-point)\b/i.test(text),

    // Qualitative/descriptive indicators
    hasDescribe: /\b(describe|explain|elaborate|tell us|share|detail|discuss)\b/i.test(text),
    hasOpinion: /\b(opinion|think|believe|feel|thoughts|view|perspective)\b/i.test(text),
    hasFeedback: /\b(feedback|comment|suggestion|input|remarks|notes)\b/i.test(text),

    // Multiple choice indicators
    hasSelect: /\b(select|choose|pick|mark)\b/i.test(text),
    hasAll: /\b(all that apply|all applicable|multiple|up to \d+)\b/i.test(text),
    hasOne: /\b(one|single|only one)\b/i.test(text),

    // Binary indicators
    hasBinary: /\b(yes\/no|true\/false|agree\/disagree)\b/i.test(text),

    // Contact/identity indicators
    hasEmail: /\b(email|e-mail|email address)\b/i.test(text),
    hasPhone: /\b(phone|telephone|mobile|cell|contact number)\b/i.test(text),
    hasName: /\b(name|first name|last name|full name)\b/i.test(text),
    hasAddress: /\b(address|street|city|zip|postal code|location)\b/i.test(text),
    hasUrl: /\b(website|url|link|web address|homepage|http)\b/i.test(text),

    // Ranking/priority indicators
    hasRank: /\b(rank|order|priority|prioritize|arrange|sequence)\b/i.test(text),
    hasImportance: /\b(importance|important|most|least|priority)\b/i.test(text),

    // Text length indicators
    wordCount: text.split(/\s+/).length,
    hasLongAnswer: /\b(maximum|up to \d+ words|brief|short|long)\b/i.test(text),

    // Sentiment/agreement scales
    hasAgreement: /\b(strongly agree|agree|neutral|disagree|strongly disagree|satisfaction|satisfied)\b/i.test(text),
    hasLikert: /\b(strongly|somewhat|neither|not at all)\b/i.test(text),

    // File upload indicators
    hasUpload: /\b(upload|attach|file|document|image|photo|resume|cv)\b/i.test(text),

    // Required/mandatory indicators
    hasRequired: text.includes('*') || /\b(required|mandatory|must|necessary)\b/i.test(text),
    hasOptional: /\b(optional|if applicable|if any)\b/i.test(text)
  };
}

/**
 * Analyze context from surrounding lines
 * Implements look-ahead and look-behind analysis
 */
function analyzeContext(lines, currentIndex, windowSize = 5) {
  const context = {
    before: lines.slice(Math.max(0, currentIndex - windowSize), currentIndex),
    after: lines.slice(currentIndex + 1, Math.min(lines.length, currentIndex + windowSize + 1))
  };

  return {
    hasOptionsAfter: context.after.some(l => l.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/)),
    hasScaleAfter: context.after.some(l => l.match(/[\(\[]\s*[\)\]]\s*\d+/)),
    hasBlankAfter: context.after.some(l => l.match(/_{3,}|\[.*\]/)),
    optionCount: context.after.filter(l => l.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/)).length,
    hasInstructions: context.before.some(l => /instruction|note|please|important/i.test(l))
  };
}

// ============================================
// ADVANCED QUESTION TYPE CLASSIFIER
// Using ML-inspired multi-feature heuristic approach
// ============================================

/**
 * Advanced question type detection using feature-based classification
 * Inspired by 2025 NLP best practices: Named Entity Recognition,
 * dependency parsing, and contextual embeddings
 */
function classifyQuestionType(questionText, nextLines, strongTexts, htmlContext = null) {
  const features = extractLinguisticFeatures(questionText);
  const context = analyzeContext([questionText, ...nextLines], 0, 10);

  // Confidence scoring for each type
  const scores = {
    email: 0,
    phone: 0,
    url: 0,
    date: 0,
    time: 0,
    number: 0,
    radio: 0,
    checkbox: 0,
    select: 0,
    textarea: 0,
    text: 0,
    rating: 0,
    slider: 0,
    file: 0
  };

  // ===== FILE UPLOAD DETECTION =====
  if (features.hasUpload) {
    scores.file += 100;
    return { type: 'file', confidence: 0.95 };
  }

  // ===== EMAIL DETECTION =====
  if (features.hasEmail) {
    scores.email += 80;
  }
  if (/email/i.test(questionText) && !features.hasSelect) {
    scores.email += 50;
  }

  // ===== PHONE DETECTION =====
  if (features.hasPhone) {
    scores.phone += 80;
  }

  // ===== URL DETECTION =====
  if (features.hasUrl) {
    scores.url += 80;
  }
  if (/website|url|link/i.test(questionText)) {
    scores.url += 40;
  }

  // ===== DATE/TIME DETECTION =====
  if (features.hasTemporal && !features.hasSelect) {
    scores.date += 60;
  }
  if (/\bdate\b|birth|dob|when did|when will/i.test(questionText) && !context.hasOptionsAfter) {
    scores.date += 50;
  }
  if (/\btime\b|hour|minute|am|pm/i.test(questionText) && !context.hasOptionsAfter) {
    scores.time += 60;
  }

  // ===== NUMBER DETECTION =====
  if (features.hasQuantity) {
    scores.number += 70;
  }
  if (features.hasNumeric && !features.hasScale) {
    scores.number += 50;
  }
  if (/\bhow many\b|\bnumber of\b/i.test(questionText) && !context.hasOptionsAfter) {
    scores.number += 60;
  }
  if (/\bage\b|years old/i.test(questionText) && !context.hasOptionsAfter) {
    scores.number += 70;
  }

  // ===== SCALE/RATING DETECTION (Advanced Likert detection) =====
  if (features.hasScale) {
    scores.rating += 80;
    scores.radio += 40;
  }
  if (features.hasAgreement) {
    scores.rating += 70;
    scores.radio += 50;
  }
  if (features.hasLikert) {
    scores.rating += 60;
    scores.radio += 40;
  }
  if (context.hasScaleAfter) {
    scores.rating += 50;
    scores.radio += 60;
  }
  // Detect numeric scales like "1 to 5", "1-10"
  if (/\b(\d+)\s*(to|-|through)\s*(\d+)\b/.test(questionText)) {
    scores.rating += 70;
    scores.radio += 50;
  }
  // Slider for continuous scales
  if (/slider|continuous|spectrum/i.test(questionText)) {
    scores.slider += 80;
  }

  // ===== RANKING DETECTION =====
  if (features.hasRank && features.hasImportance) {
    scores.textarea += 40; // Complex ranking often needs text explanation
    scores.checkbox += 30; // Or multi-select with order
  }
  if (/rank.*order|order.*importance|top \d+|first.*second.*third/i.test(questionText)) {
    scores.textarea += 50;
  }

  // ===== CHECKBOX DETECTION (Multiple selection) =====
  if (features.hasAll) {
    scores.checkbox += 90;
  }
  if (/select all|check all|mark all|choose all|multiple|up to \d+/i.test(questionText)) {
    scores.checkbox += 80;
  }
  // Detect bracket patterns [ ]
  const hasBrackets = nextLines.some(l => l.match(/^\[\s*\]/));
  if (hasBrackets) {
    scores.checkbox += 100;
  }

  // ===== RADIO DETECTION (Single selection) =====
  if (features.hasOne && features.hasSelect) {
    scores.radio += 70;
  }
  if (/select one|choose one|pick one|single choice/i.test(questionText)) {
    scores.radio += 80;
  }
  // Detect parentheses patterns ( )
  const hasParentheses = nextLines.some(l => l.match(/^\(\s*\)\s+[A-Za-z]/));
  if (hasParentheses) {
    scores.radio += 100;
  }

  // ===== BINARY (Yes/No) DETECTION =====
  if (features.hasBinary) {
    scores.radio += 90;
  }
  const yesNoCount = nextLines.filter(l => /^[\(\[]?\s*[\)\]]?\s*(yes|no)$/i.test(l.trim())).length;
  if (yesNoCount === 2) {
    scores.radio += 100;
  }

  // ===== SELECT DROPDOWN DETECTION =====
  if (context.optionCount > 10 && !features.hasAll) {
    scores.select += 60; // Many options suggest dropdown
    scores.radio -= 20;
  }

  // ===== TEXTAREA DETECTION (Long-form text) =====
  if (features.hasDescribe) {
    scores.textarea += 70;
  }
  if (features.hasOpinion || features.hasFeedback) {
    scores.textarea += 60;
  }
  if (features.hasWhy) {
    scores.textarea += 50; // "Why" questions need explanation
  }
  if (/explain|elaborate|detail|discuss|comment|feedback|thoughts/i.test(questionText)) {
    scores.textarea += 70;
  }
  if (features.hasLongAnswer) {
    scores.textarea += 60;
  }
  if (context.hasBlankAfter && !context.hasOptionsAfter) {
    scores.textarea += 40;
  }
  if (features.wordCount > 20) {
    scores.textarea += 30; // Long questions often need long answers
  }

  // ===== TEXT DETECTION (Short-form text) =====
  if (features.hasName && !context.hasOptionsAfter) {
    scores.text += 80;
  }
  if ((features.hasWhat || features.hasWho || features.hasWhere) &&
      !context.hasOptionsAfter &&
      !features.hasDescribe &&
      features.wordCount < 15) {
    scores.text += 50;
  }
  if (context.hasBlankAfter && features.wordCount < 12) {
    scores.text += 40;
  }

  // ===== CONTEXT-BASED ADJUSTMENTS =====
  // If we have options, prioritize selection types
  if (context.hasOptionsAfter) {
    scores.text = Math.max(0, scores.text - 50);
    scores.textarea = Math.max(0, scores.textarea - 50);
    scores.number = Math.max(0, scores.number - 30);
    scores.date = Math.max(0, scores.date - 30);
  }

  // If no options and asking for input, deprioritize selection types
  if (!context.hasOptionsAfter && !context.hasScaleAfter) {
    scores.radio = Math.max(0, scores.radio - 40);
    scores.checkbox = Math.max(0, scores.checkbox - 40);
    scores.select = Math.max(0, scores.select - 40);
  }

  // ===== DECISION: Pick highest score =====
  const maxScore = Math.max(...Object.values(scores));
  const bestType = Object.keys(scores).find(key => scores[key] === maxScore);
  const confidence = Math.min(maxScore / 100, 0.99);

  // Fallback logic with intelligence
  if (maxScore < 30) {
    // Very low confidence - use intelligent defaults
    if (features.wordCount > 15) return { type: 'textarea', confidence: 0.4 };
    if (context.hasBlankAfter) return { type: 'text', confidence: 0.4 };
    return { type: 'text', confidence: 0.3 };
  }

  return { type: bestType, confidence };
}

// ============================================
// TEXT EXTRACTION (Enhanced with metadata)
// ============================================

async function extractTextFromWord(buffer) {
  try {
    const rawResult = await mammoth.extractRawText({ buffer });
    const htmlResult = await mammoth.convertToHtml({ buffer });

    // Extract metadata from HTML
    const metadata = {
      hasBold: /<strong>|<b>/i.test(htmlResult.value),
      hasItalic: /<em>|<i>/i.test(htmlResult.value),
      hasUnderline: /<u>/i.test(htmlResult.value),
      hasList: /<ul>|<ol>/i.test(htmlResult.value),
      hasTable: /<table>/i.test(htmlResult.value)
    };

    return {
      text: rawResult.value,
      html: htmlResult.value,
      metadata
    };
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error('Failed to extract text from Word document');
  }
}

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      html: null,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

// ============================================
// ADVANCED PARSER with Multi-pass Analysis
// ============================================

function parseTextToQuestionnaire(extractedData) {
  const { text, html, metadata } = extractedData;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('========================================');
  console.log('PARSING DEBUG - Total lines:', lines.length);
  console.log('First 10 lines:');
  lines.slice(0, 10).forEach((line, idx) => {
    console.log(`  ${idx + 1}: ${line.substring(0, 80)}`);
  });
  console.log('========================================');

  // Extract strong tags from HTML for better section/question detection
  const strongTexts = new Set();
  if (html) {
    const strongTags = html.match(/<strong>([^<]+)<\/strong>/g) || [];
    strongTags.forEach(tag => {
      const content = tag.replace(/<\/?strong>/g, '').trim();
      strongTexts.add(content);
    });
  }

  const sections = [];
  let currentSection = {
    title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
    description: { en: '', sq: '', sr: '' },
    order_index: 0
  }; // Start with a default section instead of null
  let currentQuestions = [];
  let processedLines = new Set();

  // First pass: Identify document structure
  const structureMap = lines.map((line, idx) => ({
    index: idx,
    line,
    isSection: isSectionHeader(line, strongTexts),
    isQuestion: isQuestionLine(line),
    isOption: isOptionLine(line),
    isBlank: isBlankLine(line)
  }));

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = lines[i];
    const structure = structureMap[i];

    // Skip meta content
    if (shouldSkipLine(line)) continue;

    // DETECT SECTIONS
    if (structure.isSection) {
      // Save previous section (always save, even if no questions)
      if (currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: currentQuestions
        });
      } else if (sections.length > 0) {
        // Only save empty section if it's not the first default one
        sections.push({
          ...currentSection,
          questions: []
        });
      }

      // Create new section
      currentSection = {
        title: { en: line, sq: line, sr: line },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      currentQuestions = [];
      processedLines.add(i);
      continue;
    }

    // DETECT QUESTIONS
    if (structure.isQuestion) {
      console.log(`[DEBUG] Found question at line ${i}: ${line.substring(0, 60)}`);
      const questionData = extractQuestion(lines, i, processedLines, strongTexts, structureMap);
      if (questionData) {
        console.log(`[DEBUG] Extracted question ${questionData.question.question_number}: ${questionData.question.question_type}`);
        currentQuestions.push(questionData.question);
        // DON'T modify i here - let the loop continue naturally
        // The processedLines Set will prevent re-processing
      } else {
        console.log(`[DEBUG] Failed to extract question data`);
      }
    }
  }

  // Save final section (currentSection always exists now)
  console.log(`[DEBUG] Final save - currentQuestions.length: ${currentQuestions.length}`);
  if (currentQuestions.length > 0) {
    console.log(`[DEBUG] Saving final section with ${currentQuestions.length} questions`);
    sections.push({
      ...currentSection,
      questions: currentQuestions
    });
  }

  console.log(`[DEBUG] Total sections created: ${sections.length}`);
  sections.forEach((s, idx) => {
    console.log(`[DEBUG] Section ${idx + 1}: ${s.title.en} - ${s.questions?.length || 0} questions`);
  });

  // If still no sections (shouldn't happen with default section, but just in case)
  if (sections.length === 0 && currentQuestions.length > 0) {
    sections.push({
      title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
      description: { en: '', sq: '', sr: '' },
      order_index: 0,
      questions: currentQuestions
    });
  }

  return sections;
}

// ============================================
// HELPER FUNCTIONS for Structure Detection
// ============================================

function shouldSkipLine(line) {
  const lower = line.toLowerCase();
  return (
    lower.match(/^(introduction|thank\s+you|questionnaire|survey|the\s+ultimate)/i) &&
    !line.match(/^\d+\./)
  );
}

function isSectionHeader(line, strongTexts) {
  // Enhanced section detection
  const isSectionPattern = line.match(/^Section\s+[A-Z0-9]+:/i) ||
                          line.match(/^Part\s+[A-Z0-9]+:/i) ||
                          line.match(/^Chapter\s+[A-Z0-9]+:/i) ||
                          line.match(/^[IVX]+\.\s+[A-Z]/) || // Roman numerals
                          line.match(/^[A-Z]\.\s+[A-Z]/); // A. Section

  const isStrongSection = strongTexts.has(line) &&
                         (line.match(/^Section|^Part|^Chapter/i) || line.length < 60);

  const notQuestion = !line.match(/^\d+\./);
  const notScaleIndicator = !line.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/);

  return (isSectionPattern || isStrongSection) && notQuestion && notScaleIndicator;
}

function isQuestionLine(line) {
  return line.match(/^\d+\.\s+.+/);
}

function isOptionLine(line) {
  return line.match(/^[\(\[\*\-•]\s*[\)\]]?\s*.+/);
}

function isBlankLine(line) {
  return line.match(/^_{3,}|^\[.*\]$|^\.\.\./);
}

function extractQuestion(lines, startIndex, processedLines, strongTexts, structureMap) {
  const line = lines[startIndex];
  const questionMatch = line.match(/^(\d+)\.\s+(.+)/);

  if (!questionMatch) return null;

  const questionNumber = questionMatch[1];
  let questionText = questionMatch[2].trim();
  let currentIndex = startIndex;

  // Multi-line question continuation (smarter detection)
  let j = startIndex + 1;
  while (j < lines.length && j < startIndex + 4) {
    const nextLine = lines[j];
    const nextStruct = structureMap[j];

    // Stop if we hit another question, section, or option
    if (nextStruct.isQuestion || nextStruct.isSection || nextStruct.isOption) break;
    if (nextStruct.isBlank) break;
    if (nextLine.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/)) break; // Scale indicator

    // Continue if it looks like part of the question
    if (nextLine.length > 0 && !processedLines.has(j)) {
      questionText += ' ' + nextLine.trim();
      processedLines.add(j);
      j++;
    } else {
      break;
    }
  }

  currentIndex = j;

  // Advanced question type detection
  const nextLines = lines.slice(currentIndex, currentIndex + 20);
  const classification = classifyQuestionType(questionText, nextLines, strongTexts);

  // Extract options if applicable
  let options = [];
  if (['radio', 'checkbox', 'select', 'rating'].includes(classification.type)) {
    const result = extractOptions(lines, currentIndex, processedLines, classification.type);
    options = result.options;
    currentIndex = result.endIndex;
  }

  // Detect if required
  const isRequired = questionText.includes('*') ||
                    questionText.match(/\(required\)/i) ||
                    questionText.match(/\(mandatory\)/i);

  // Create question with metadata
  const question = {
    question_number: parseInt(questionNumber),
    question_text: {
      en: questionText.replace(/\*$/, '').trim(),
      sq: questionText.replace(/\*$/, '').trim(),
      sr: questionText.replace(/\*$/, '').trim()
    },
    question_type: classification.type,
    options: options.length > 0 ? options : null,
    required: isRequired,
    order_index: parseInt(questionNumber) - 1,
    validation_rules: buildValidationRules(classification.type, questionText),
    help_text: { en: '', sq: '', sr: '' },
    metadata: {
      confidence: classification.confidence,
      features: extractLinguisticFeatures(questionText)
    }
  };

  return {
    question,
    endIndex: currentIndex
  };
}

function buildValidationRules(questionType, questionText) {
  const rules = {};

  switch (questionType) {
    case 'number':
      rules.min = 0;
      // Extract range if specified
      const rangeMatch = questionText.match(/(\d+)\s*(?:to|-)\s*(\d+)/);
      if (rangeMatch) {
        rules.min = parseInt(rangeMatch[1]);
        rules.max = parseInt(rangeMatch[2]);
      }
      break;

    case 'text':
      rules.maxLength = 500;
      if (/email/i.test(questionText)) {
        rules.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      }
      break;

    case 'textarea':
      rules.maxLength = 5000;
      const wordMatch = questionText.match(/(\d+)\s*words/i);
      if (wordMatch) {
        rules.maxWords = parseInt(wordMatch[1]);
      }
      break;

    case 'email':
      rules.pattern = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
      break;

    case 'url':
      rules.pattern = '^https?://';
      break;

    case 'phone':
      rules.pattern = '^[\\d\\s\\-\\+\\(\\)]+$';
      break;
  }

  return Object.keys(rules).length > 0 ? rules : null;
}

function extractOptions(lines, startIndex, processedLines, questionType) {
  const options = [];
  let i = startIndex;

  while (i < lines.length) {
    if (processedLines.has(i)) {
      i++;
      continue;
    }

    const line = lines[i].trim();

    // Stop conditions
    if (!line) break;
    if (line.match(/^\d+\./)) break; // Next question
    if (line.match(/^Section\s+[A-Z]|^Part\s+[A-Z]/i)) break; // Next section
    if (line.match(/^_{3,}/)) { i++; continue; } // Skip blank fields

    // Advanced option pattern matching
    const patterns = [
      { regex: /^\(\s*\)\s+(.+)/, type: 'parentheses' },
      { regex: /^\[\s*\]\s+(.+)/, type: 'brackets' },
      { regex: /^\*\s+(.+)/, type: 'bullet' },
      { regex: /^•\s+(.+)/, type: 'bullet' },
      { regex: /^-\s+(.+)/, type: 'dash' },
      { regex: /^\d+\)\s+(.+)/, type: 'numbered' }
    ];

    // Skip scale indicator lines (e.g., "( ) 1 ( ) 2 ( ) 3")
    if (line.match(/[\(\[]\s*[\)\]]\s*\d+\s+[\(\[]\s*[\)\]]\s*\d+/)) {
      i++;
      continue;
    }

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        const optionText = match[1].trim();
        options.push({
          value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
          label: { en: optionText, sq: optionText, sr: optionText },
          metadata: { pattern: pattern.type }
        });
        processedLines.add(i);
        matched = true;
        break;
      }
    }

    if (matched) {
      i++;
      continue;
    }

    // If we have options and this doesn't match, stop
    if (options.length > 0) break;

    i++;
  }

  // Generate scale options if it's a rating and we have few/no options
  if (questionType === 'rating' && options.length < 3) {
    const scaleMatch = lines.slice(Math.max(0, startIndex - 5), startIndex + 5)
      .join(' ')
      .match(/(\d+)\s*(?:to|-|through)\s*(\d+)/);

    if (scaleMatch) {
      const min = parseInt(scaleMatch[1]);
      const max = parseInt(scaleMatch[2]);
      options.length = 0; // Clear any partial options

      for (let val = min; val <= max; val++) {
        options.push({
          value: String(val),
          label: { en: String(val), sq: String(val), sr: String(val) },
          metadata: { generated: true, scale: true }
        });
      }
    }
  }

  return { options, endIndex: i };
}

// ============================================
// UPLOAD ENDPOINT
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

    // Extract text with metadata
    let extractedData;
    if (req.file.mimetype === 'application/pdf') {
      extractedData = await extractTextFromPDF(req.file.buffer);
    } else {
      extractedData = await extractTextFromWord(req.file.buffer);
    }

    if (!extractedData.text || extractedData.text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the file' });
    }

    // Advanced parsing
    const sections = parseTextToQuestionnaire(extractedData);

    if (sections.length === 0) {
      return res.status(400).json({
        error: 'Could not detect any questions in the document',
        hint: 'Please ensure questions are numbered (e.g., "1. Question text")',
        extractedText: extractedData.text.substring(0, 500)
      });
    }

    // Calculate confidence score
    const allQuestions = sections.flatMap(s => s.questions);
    const avgConfidence = allQuestions.reduce((sum, q) => sum + (q.metadata?.confidence || 0), 0) / allQuestions.length;

    // Create questionnaire
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
        const questionsData = section.questions.map(q => {
          // Remove metadata and question_number before saving to DB
          // question_number is not a DB field - order_index serves this purpose
          const { metadata, question_number, ...questionWithoutMeta } = q;
          return {
            section_id: createdSection.id,
            questionnaire_id: questionnaire.id,
            ...questionWithoutMeta
          };
        });

        console.log(`[DEBUG] Inserting ${questionsData.length} questions for section ${createdSection.id}`);
        const { data: insertedQuestions, error: qsError } = await supabase
          .from('questions')
          .insert(questionsData)
          .select();

        if (qsError) {
          console.error('Create questions error:', qsError);
          console.error('Failed question data sample:', JSON.stringify(questionsData[0], null, 2));
        } else {
          console.log(`[DEBUG] Successfully inserted ${insertedQuestions?.length || 0} questions`);
        }
      }
    }

    // Record upload with advanced analytics
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
          total_questions: allQuestions.length,
          average_confidence: avgConfidence.toFixed(3),
          question_types: allQuestions.reduce((acc, q) => {
            acc[q.question_type] = (acc[q.question_type] || 0) + 1;
            return acc;
          }, {}),
          parsing_metadata: extractedData.metadata
        }
      }]);

    res.status(201).json({
      success: true,
      message: 'File converted to questionnaire successfully',
      questionnaire: {
        id: questionnaire.id,
        title: questionnaire.title,
        sections_count: sections.length,
        questions_count: allQuestions.length,
        average_confidence: avgConfidence.toFixed(3)
      },
      preview: sections.map(s => ({
        title: s.title.en,
        questions_count: s.questions?.length || 0,
        sample_questions: s.questions?.slice(0, 3).map(q => ({
          text: q.question_text.en,
          type: q.question_type,
          confidence: q.metadata?.confidence?.toFixed(2)
        }))
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
