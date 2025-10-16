import fs from 'fs';
import mammoth from 'mammoth';

// Import the parsing functions (copied from file-upload.js)
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

function parseTextToQuestionnaire(extractedData) {
  const { text, html } = extractedData;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

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
  let currentSection = null;
  let currentQuestions = [];
  let processedLines = new Set();

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Skip introduction, titles, thank you messages
    if (lowerLine.match(/^(introduction|thank\s+you|questionnaire|survey|the\s+ultimate)/i) &&
        !line.match(/^\d+\./)) {
      continue;
    }

    // DETECT SECTIONS
    // Use HTML strong tags OR text patterns
    const isSectionFromHTML = strongTexts.has(line) && line.match(/^Section [A-Z0-9]+:/i);
    const isSectionFromPattern = line.match(/^Section [A-Z0-9]+:/i) &&
                                  !line.match(/^\d+\./);

    if (isSectionFromHTML || isSectionFromPattern) {
      // Save previous section
      if (currentSection && currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: currentQuestions
        });
      }

      // Create new section
      currentSection = {
        title: { en: line, sq: line, sr: line },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      currentQuestions = [];
      continue;
    }

    // DETECT QUESTIONS
    // Pattern: "N. Question text"
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);

    if (questionMatch) {
      const questionNumber = questionMatch[1];
      let questionText = questionMatch[2].trim();

      // Look ahead to see if question continues on next lines (before options)
      let j = i + 1;
      while (j < lines.length &&
             !lines[j].match(/^\d+\./) && // Not next question
             !lines[j].match(/^\(\s*\)|^\[\s*\]/) && // Not an option
             !lines[j].match(/^Section [A-Z]/i) && // Not a section
             !lines[j].match(/^_{3,}/) && // Not blank fields
             lines[j].length > 0 &&
             j < i + 3) { // Max 2 continuation lines

        // Only add if it's clearly continuation (doesn't look like a scale indicator)
        if (!lines[j].match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/)) {
          questionText += ' ' + lines[j].trim();
          processedLines.add(j);
          j++;
        } else {
          break;
        }
      }

      // Detect question type
      const questionType = detectQuestionType(questionText, lines.slice(i + 1, i + 20), strongTexts);

      // Extract options if needed
      let options = [];
      let endIndex = i + 1;

      if (['radio', 'checkbox', 'select'].includes(questionType)) {
        const result = extractOptions(lines, i + 1, processedLines);
        options = result.options;
        endIndex = result.endIndex;

        // Mark option lines as processed
        for (let k = i + 1; k < endIndex; k++) {
          processedLines.add(k);
        }
      }

      // Check if required
      const isRequired = questionText.includes('*') ||
                        questionText.match(/\(required\)/i) ||
                        questionText.match(/\(mandatory\)/i);

      // Create question
      const question = {
        question_number: parseInt(questionNumber),
        question_text: {
          en: questionText.replace(/\*$/, '').trim(),
          sq: questionText.replace(/\*$/, '').trim(),
          sr: questionText.replace(/\*$/, '').trim()
        },
        question_type: questionType,
        options: options.length > 0 ? options : null,
        required: isRequired,
        order_index: currentQuestions.length
      };

      currentQuestions.push(question);

      // Skip to end of processed lines
      i = Math.max(i, endIndex - 1);
    }
  }

  // Save final section
  if (currentSection && currentQuestions.length > 0) {
    sections.push({
      ...currentSection,
      questions: currentQuestions
    });
  }

  // If no sections, create default
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

function detectQuestionType(questionText, nextLines, strongTexts) {
  const lower = questionText.toLowerCase();

  // Scale/rating questions
  if (lower.match(/scale\s+of\s+\d+\s+to\s+\d+/) ||
      lower.match(/\(\d+\).*\(\d+\).*\(\d+\)/) ||
      lower.match(/rate|rating/) ||
      nextLines.some(l => l.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/))) {
    return 'radio';
  }

  // Ranking questions
  if (lower.match(/rank|order\s+of\s+importance|prioritize/)) {
    return 'textarea';
  }

  // Yes/No binary
  if (lower.match(/yes\s*\/\s*no/) ||
      (nextLines.filter(l => l.match(/^\(\s*\)\s+(yes|no)$/i)).length === 2)) {
    return 'radio';
  }

  // Checkbox indicators
  if (lower.match(/select\s+all|check\s+all|choose\s+all|check\s+up\s+to|select\s+up\s+to/i)) {
    return 'checkbox';
  }

  // Date
  if (lower.match(/\bdate\b|when|year|month|day/) && !lower.match(/update|to\s+date/)) {
    return 'date';
  }

  // Email
  if (lower.match(/email|e-mail/) && !lower.match(/send|forward/)) {
    return 'email';
  }

  // URL
  if (lower.match(/website|url|link|http/)) {
    return 'url';
  }

  // Number
  if (lower.match(/how\s+many|number\s+of|quantity|amount|count|age|how\s+old/)) {
    return 'number';
  }

  // Long text (comment box, describe, explain)
  if (lower.match(/describe|explain|comment\s+box|feedback|thoughts|opinion|elaborate|additional\s+comments/)) {
    return 'textarea';
  }

  // Check next lines for option patterns
  const hasParentheses = nextLines.some(l => l.match(/^\(\s*\)\s+[A-Z]/));
  const hasBrackets = nextLines.some(l => l.match(/^\[\s*\]\s+[A-Z]/));
  const hasShortAnswer = nextLines.some(l => l.match(/\[short\s+answer/i));

  if (hasParentheses) return 'radio';
  if (hasBrackets) return 'checkbox';
  if (hasShortAnswer) return 'text';

  // Default based on length and context
  if (questionText.length < 150 && !lower.match(/please|describe|explain/)) {
    return 'text';
  }

  return 'textarea';
}

function extractOptions(lines, startIndex, processedLines) {
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
    if (line.match(/^Section [A-Z]/i)) break; // Next section
    if (line.match(/^_{3,}/)) { i++; continue; } // Skip blank fields

    // Match patterns
    const parenthesesMatch = line.match(/^\(\s*\)\s+(.+)/);
    const bracketsMatch = line.match(/^\[\s*\]\s+(.+)/);
    const scaleMatch = line.match(/^\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/); // Scale indicators

    // Skip scale indicator lines
    if (scaleMatch) {
      i++;
      continue;
    }

    if (parenthesesMatch) {
      const optionText = parenthesesMatch[1].trim();
      options.push({
        value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label: { en: optionText, sq: optionText, sr: optionText }
      });
      i++;
      continue;
    }

    if (bracketsMatch) {
      const optionText = bracketsMatch[1].trim();
      options.push({
        value: optionText.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label: { en: optionText, sq: optionText, sr: optionText }
      });
      i++;
      continue;
    }

    // If we have options and this doesn't match, stop
    if (options.length > 0) break;

    i++;
  }

  return { options, endIndex: i };
}

// VERIFICATION TEST
async function verifyPerfectParse() {
  console.log('=====================================');
  console.log('PERFECT PARSE VERIFICATION TEST');
  console.log('=====================================\n');

  const buffer = fs.readFileSync('../../Toy Questionnaire.docx');
  const extractedData = await extractTextFromWord(buffer);
  const sections = parseTextToQuestionnaire(extractedData);

  // Expected structure
  const EXPECTED_SECTIONS = 4;
  const EXPECTED_QUESTIONS = 20;
  const EXPECTED_STRUCTURE = {
    'Section A': [1, 2, 3, 4, 5],
    'Section B': [6, 7, 8, 9, 10, 11],
    'Section C': [12, 13, 14, 15, 16],
    'Section D': [17, 18, 19, 20]
  };

  // Count totals
  const totalSections = sections.length;
  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);

  console.log(`✓ Sections found: ${totalSections} (Expected: ${EXPECTED_SECTIONS})`);
  console.log(`✓ Questions found: ${totalQuestions} (Expected: ${EXPECTED_QUESTIONS})\n`);

  // Detailed section breakdown
  console.log('SECTION BREAKDOWN:\n');
  sections.forEach((section, idx) => {
    console.log(`Section ${idx + 1}: ${section.title.en}`);
    console.log(`  Questions: ${section.questions.length}`);
    console.log(`  Question numbers: ${section.questions.map(q => q.question_number).join(', ')}\n`);

    section.questions.forEach((q, qIdx) => {
      const optionCount = q.options ? q.options.length : 0;
      const optionInfo = optionCount > 0 ? ` [${optionCount} options]` : '';
      console.log(`    ${q.question_number}. ${q.question_text.en.substring(0, 60)}...`);
      console.log(`       Type: ${q.question_type}${optionInfo}`);
      if (q.options && q.options.length > 0) {
        console.log(`       Options: ${q.options.slice(0, 3).map(o => o.label.en).join(', ')}${q.options.length > 3 ? '...' : ''}`);
      }
      console.log('');
    });
  });

  // Verification results
  console.log('\n=====================================');
  console.log('VERIFICATION RESULTS:');
  console.log('=====================================\n');

  const sectionsMatch = totalSections === EXPECTED_SECTIONS;
  const questionsMatch = totalQuestions === EXPECTED_QUESTIONS;

  // Check for missing questions
  const allQuestionNumbers = sections.flatMap(s => s.questions.map(q => q.question_number)).sort((a, b) => a - b);
  const missingQuestions = [];
  for (let i = 1; i <= EXPECTED_QUESTIONS; i++) {
    if (!allQuestionNumbers.includes(i)) {
      missingQuestions.push(i);
    }
  }

  // Check for duplicates
  const duplicates = allQuestionNumbers.filter((num, idx) => allQuestionNumbers.indexOf(num) !== idx);

  console.log(`${sectionsMatch ? '✅' : '❌'} Sections: ${totalSections}/${EXPECTED_SECTIONS}`);
  console.log(`${questionsMatch ? '✅' : '❌'} Questions: ${totalQuestions}/${EXPECTED_QUESTIONS}`);
  console.log(`${missingQuestions.length === 0 ? '✅' : '❌'} No missing questions${missingQuestions.length > 0 ? ` (Missing: ${missingQuestions.join(', ')})` : ''}`);
  console.log(`${duplicates.length === 0 ? '✅' : '❌'} No duplicate questions${duplicates.length > 0 ? ` (Duplicates: ${duplicates.join(', ')})` : ''}`);

  // Question type distribution
  console.log('\nQUESTION TYPE DISTRIBUTION:');
  const typeCount = {};
  sections.forEach(s => {
    s.questions.forEach(q => {
      typeCount[q.question_type] = (typeCount[q.question_type] || 0) + 1;
    });
  });
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Final verdict
  console.log('\n=====================================');
  if (sectionsMatch && questionsMatch && missingQuestions.length === 0 && duplicates.length === 0) {
    console.log('🎉 PERFECT PARSE ACHIEVED! 100% ACCURACY');
  } else {
    console.log('⚠️  PARSING NEEDS ADJUSTMENT');
    if (!sectionsMatch) console.log('   - Section count mismatch');
    if (!questionsMatch) console.log('   - Question count mismatch');
    if (missingQuestions.length > 0) console.log(`   - Missing questions: ${missingQuestions.join(', ')}`);
    if (duplicates.length > 0) console.log(`   - Duplicate questions: ${duplicates.join(', ')}`);
  }
  console.log('=====================================\n');
}

verifyPerfectParse().catch(console.error);
