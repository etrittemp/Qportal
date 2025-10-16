/**
 * Test the FULL parser with Toy Questionnaire
 */

import fs from 'fs';
import mammoth from 'mammoth';

// Import the parser functions (we'll copy the logic here since we can't import from routes)

function extractLinguisticFeatures(text) {
  const lower = text.toLowerCase();

  return {
    hasWho: /\b(who|whom|whose)\b/i.test(text),
    hasWhat: /\b(what|what's)\b/i.test(text),
    hasWhen: /\b(when|what time)\b/i.test(text),
    hasWhere: /\b(where)\b/i.test(text),
    hasWhy: /\b(why)\b/i.test(text),
    hasHow: /\b(how|how many|how much|how often|how long)\b/i.test(text),
    hasWhich: /\b(which)\b/i.test(text),
    hasWould: /\b(would|could|should|might)\b/i.test(text),
    hasPrefer: /\b(prefer|preference|like|love|enjoy|favorite)\b/i.test(text),
    hasTemporal: /\b(date|time|year|month|day|week|yesterday|today|tomorrow|when|schedule|deadline)\b/i.test(text),
    hasFrequency: /\b(often|frequency|daily|weekly|monthly|yearly|always|never|sometimes|regularly)\b/i.test(text),
    hasQuantity: /\b(how many|number of|count|quantity|amount|total|sum)\b/i.test(text),
    hasNumeric: /\b(age|years old|score|rating|percentage|rate)\b/i.test(text),
    hasScale: /\b(scale|rate|rating|rank|grade|level|from \d+ to \d+|out of \d+|\d+-point)\b/i.test(text),
    hasDescribe: /\b(describe|explain|elaborate|tell us|share|detail|discuss)\b/i.test(text),
    hasOpinion: /\b(opinion|think|believe|feel|thoughts|view|perspective)\b/i.test(text),
    hasFeedback: /\b(feedback|comment|suggestion|input|remarks|notes)\b/i.test(text),
    hasSelect: /\b(select|choose|pick|mark)\b/i.test(text),
    hasAll: /\b(all that apply|all applicable|multiple|up to \d+)\b/i.test(text),
    hasOne: /\b(one|single|only one)\b/i.test(text),
    hasBinary: /\b(yes\/no|true\/false|agree\/disagree)\b/i.test(text),
    hasEmail: /\b(email|e-mail|email address)\b/i.test(text),
    hasPhone: /\b(phone|telephone|mobile|cell|contact number)\b/i.test(text),
    hasName: /\b(name|first name|last name|full name)\b/i.test(text),
    hasAddress: /\b(address|street|city|zip|postal code|location)\b/i.test(text),
    hasUrl: /\b(website|url|link|web address|homepage|http)\b/i.test(text),
    hasRank: /\b(rank|order|priority|prioritize|arrange|sequence)\b/i.test(text),
    hasImportance: /\b(importance|important|most|least|priority)\b/i.test(text),
    wordCount: text.split(/\s+/).length,
    hasLongAnswer: /\b(maximum|up to \d+ words|brief|short|long)\b/i.test(text),
    hasAgreement: /\b(strongly agree|agree|neutral|disagree|strongly disagree|satisfaction|satisfied)\b/i.test(text),
    hasLikert: /\b(strongly|somewhat|neither|not at all)\b/i.test(text),
    hasUpload: /\b(upload|attach|file|document|image|photo|resume|cv)\b/i.test(text),
    hasRequired: text.includes('*') || /\b(required|mandatory|must|necessary)\b/i.test(text),
    hasOptional: /\b(optional|if applicable|if any)\b/i.test(text)
  };
}

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

function classifyQuestionType(questionText, nextLines, strongTexts, htmlContext = null) {
  const features = extractLinguisticFeatures(questionText);
  const context = analyzeContext([questionText, ...nextLines], 0, 10);

  const scores = {
    email: 0, phone: 0, url: 0, date: 0, time: 0, number: 0,
    radio: 0, checkbox: 0, select: 0, textarea: 0, text: 0,
    rating: 0, slider: 0, file: 0
  };

  if (features.hasUpload) {
    scores.file += 100;
    return { type: 'file', confidence: 0.95 };
  }

  if (features.hasEmail) scores.email += 80;
  if (features.hasPhone) scores.phone += 80;
  if (features.hasUrl) scores.url += 80;

  if (features.hasTemporal && !features.hasSelect) scores.date += 60;
  if (/\btime\b|hour|minute|am|pm/i.test(questionText) && !context.hasOptionsAfter) scores.time += 60;

  if (features.hasQuantity) scores.number += 70;
  if (features.hasNumeric && !features.hasScale) scores.number += 50;

  if (features.hasScale) {
    scores.rating += 80;
    scores.radio += 40;
  }

  if (features.hasAll) scores.checkbox += 90;
  const hasBrackets = nextLines.some(l => l.match(/^\[\s*\]/));
  if (hasBrackets) scores.checkbox += 100;

  if (features.hasOne && features.hasSelect) scores.radio += 70;
  const hasParentheses = nextLines.some(l => l.match(/^\(\s*\)\s+[A-Za-z]/));
  if (hasParentheses) scores.radio += 100;

  if (features.hasBinary) scores.radio += 90;

  if (context.optionCount > 10 && !features.hasAll) {
    scores.select += 60;
    scores.radio -= 20;
  }

  if (features.hasDescribe) scores.textarea += 70;
  if (features.hasOpinion || features.hasFeedback) scores.textarea += 60;
  if (features.hasWhy) scores.textarea += 50;

  if (features.hasName && !context.hasOptionsAfter) scores.text += 80;

  if (context.hasOptionsAfter) {
    scores.text = Math.max(0, scores.text - 50);
    scores.textarea = Math.max(0, scores.textarea - 50);
    scores.number = Math.max(0, scores.number - 30);
    scores.date = Math.max(0, scores.date - 30);
  }

  if (!context.hasOptionsAfter && !context.hasScaleAfter) {
    scores.radio = Math.max(0, scores.radio - 40);
    scores.checkbox = Math.max(0, scores.checkbox - 40);
    scores.select = Math.max(0, scores.select - 40);
  }

  const maxScore = Math.max(...Object.values(scores));
  const bestType = Object.keys(scores).find(key => scores[key] === maxScore);
  const confidence = Math.min(maxScore / 100, 0.99);

  if (maxScore < 30) {
    if (features.wordCount > 15) return { type: 'textarea', confidence: 0.4 };
    if (context.hasBlankAfter) return { type: 'text', confidence: 0.4 };
    return { type: 'text', confidence: 0.3 };
  }

  return { type: bestType, confidence };
}

function shouldSkipLine(line) {
  const lower = line.toLowerCase();
  return (
    lower.match(/^(introduction|thank\s+you|questionnaire|survey|the\s+ultimate)/i) &&
    !line.match(/^\d+\./)
  );
}

function isSectionHeader(line, strongTexts) {
  const isSectionPattern = line.match(/^Section\s+[A-Z0-9]+:/i) ||
                          line.match(/^Part\s+[A-Z0-9]+:/i) ||
                          line.match(/^Chapter\s+[A-Z0-9]+:/i);

  const notQuestion = !line.match(/^\d+\./);
  const notScaleIndicator = !line.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/);

  return isSectionPattern && notQuestion && notScaleIndicator;
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

function extractOptions(lines, startIndex, processedLines, questionType) {
  const options = [];
  let i = startIndex;

  while (i < lines.length) {
    if (processedLines.has(i)) {
      i++;
      continue;
    }

    const line = lines[i].trim();

    if (!line) break;
    if (line.match(/^\d+\./)) break;
    if (line.match(/^Section\s+[A-Z]|^Part\s+[A-Z]/i)) break;
    if (line.match(/^_{3,}/)) { i++; continue; }

    const patterns = [
      { regex: /^\(\s*\)\s+(.+)/, type: 'parentheses' },
      { regex: /^\[\s*\]\s+(.+)/, type: 'brackets' },
      { regex: /^\*\s+(.+)/, type: 'bullet' },
      { regex: /^•\s+(.+)/, type: 'bullet' },
      { regex: /^-\s+(.+)/, type: 'dash' },
      { regex: /^\d+\)\s+(.+)/, type: 'numbered' }
    ];

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

    if (options.length > 0) break;
    i++;
  }

  return { options, endIndex: i };
}

function extractQuestion(lines, startIndex, processedLines, strongTexts, structureMap) {
  const line = lines[startIndex];
  const questionMatch = line.match(/^(\d+)\.\s+(.+)/);

  if (!questionMatch) return null;

  const questionNumber = questionMatch[1];
  let questionText = questionMatch[2].trim();
  let currentIndex = startIndex;

  let j = startIndex + 1;
  while (j < lines.length && j < startIndex + 4) {
    const nextLine = lines[j];
    const nextStruct = structureMap[j];

    if (nextStruct.isQuestion || nextStruct.isSection || nextStruct.isOption) break;
    if (nextStruct.isBlank) break;
    if (nextLine.match(/\(\s*\)\s+\d+\s+\(\s*\)\s+\d+/)) break;

    if (nextLine.length > 0 && !processedLines.has(j)) {
      questionText += ' ' + nextLine.trim();
      processedLines.add(j);
      j++;
    } else {
      break;
    }
  }

  currentIndex = j;

  const nextLines = lines.slice(currentIndex, currentIndex + 20);
  const classification = classifyQuestionType(questionText, nextLines, strongTexts);

  let options = [];
  if (['radio', 'checkbox', 'select', 'rating'].includes(classification.type)) {
    const result = extractOptions(lines, currentIndex, processedLines, classification.type);
    options = result.options;
    currentIndex = result.endIndex;
  }

  const isRequired = questionText.includes('*') ||
                    questionText.match(/\(required\)/i) ||
                    questionText.match(/\(mandatory\)/i);

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
    metadata: {
      confidence: classification.confidence
    }
  };

  return {
    question,
    endIndex: currentIndex
  };
}

function parseTextToQuestionnaire(extractedData) {
  const { text } = extractedData;
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  console.log('========================================');
  console.log('PARSING DEBUG - Total lines:', lines.length);
  console.log('========================================');

  const strongTexts = new Set();
  const sections = [];
  let currentSection = {
    title: { en: 'General Questions', sq: 'Pyetje të Përgjithshme', sr: 'Општа питања' },
    description: { en: '', sq: '', sr: '' },
    order_index: 0
  };
  let currentQuestions = [];
  let processedLines = new Set();

  const structureMap = lines.map((line, idx) => ({
    index: idx,
    line,
    isSection: isSectionHeader(line, strongTexts),
    isQuestion: isQuestionLine(line),
    isOption: isOptionLine(line),
    isBlank: isBlankLine(line)
  }));

  console.log(`Structure map created. Questions detected: ${structureMap.filter(s => s.isQuestion).length}`);
  console.log(`Sections detected: ${structureMap.filter(s => s.isSection).length}`);

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = lines[i];
    const structure = structureMap[i];

    if (shouldSkipLine(line)) continue;

    // DETECT SECTIONS
    if (structure.isSection) {
      if (currentQuestions.length > 0) {
        sections.push({
          ...currentSection,
          questions: currentQuestions
        });
      } else if (sections.length > 0) {
        sections.push({
          ...currentSection,
          questions: []
        });
      }

      currentSection = {
        title: { en: line, sq: line, sr: line },
        description: { en: '', sq: '', sr: '' },
        order_index: sections.length
      };
      currentQuestions = [];
      processedLines.add(i);
      console.log(`[DEBUG] Found section at line ${i}: ${line}`);
      continue;
    }

    // DETECT QUESTIONS
    if (structure.isQuestion) {
      console.log(`[DEBUG] Found question at line ${i}: ${line.substring(0, 60)}`);
      const questionData = extractQuestion(lines, i, processedLines, strongTexts, structureMap);
      if (questionData) {
        console.log(`[DEBUG] Extracted question ${questionData.question.question_number}: ${questionData.question.question_type}`);
        console.log(`[DEBUG] Options: ${questionData.question.options?.length || 0}`);
        currentQuestions.push(questionData.question);
        // DON'T modify i here - let the loop continue naturally
        // The processedLines Set will prevent re-processing
      } else {
        console.log(`[DEBUG] Failed to extract question data`);
      }
    }
  }

  // Save final section
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

async function test() {
  console.log('Testing FULL PARSER on Toy Questionnaire.docx...\n');

  const buffer = fs.readFileSync('/home/etritneziri/projects/Qportal/Toy Questionnaire.docx');
  const rawResult = await mammoth.extractRawText({ buffer });

  const extractedData = {
    text: rawResult.value,
    html: null,
    metadata: {}
  };

  const sections = parseTextToQuestionnaire(extractedData);

  console.log('\n========================================');
  console.log('FINAL RESULT');
  console.log('========================================\n');

  console.log(`Total sections: ${sections.length}`);
  let totalQuestions = 0;

  sections.forEach((section, idx) => {
    console.log(`\nSection ${idx + 1}: ${section.title.en}`);
    console.log(`  Questions: ${section.questions?.length || 0}`);
    totalQuestions += section.questions?.length || 0;

    if (section.questions) {
      section.questions.slice(0, 3).forEach(q => {
        console.log(`    ${q.question_number}. ${q.question_text.en.substring(0, 60)}...`);
        console.log(`       Type: ${q.question_type}, Options: ${q.options?.length || 0}`);
      });
      if (section.questions.length > 3) {
        console.log(`    ... and ${section.questions.length - 3} more questions`);
      }
    }
  });

  console.log(`\nTotal questions across all sections: ${totalQuestions}`);

  if (totalQuestions === 0) {
    console.log('\n❌ ERROR: NO QUESTIONS EXTRACTED!');
  } else if (totalQuestions === 20) {
    console.log('\n✅ SUCCESS: All 20 questions extracted!');
  } else {
    console.log(`\n⚠️  WARNING: Expected 20 questions, got ${totalQuestions}`);
  }
}

test().catch(console.error);
