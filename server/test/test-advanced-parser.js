import fs from 'fs';
import mammoth from 'mammoth';

// Copy all the advanced parsing functions here for testing
// (This is a standalone test file)

// Import all helper functions from file-upload-advanced.js
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

  // FILE UPLOAD
  if (features.hasUpload) {
    scores.file += 100;
    return { type: 'file', confidence: 0.95 };
  }

  // EMAIL
  if (features.hasEmail) scores.email += 80;
  if (/email/i.test(questionText) && !features.hasSelect) scores.email += 50;

  // PHONE
  if (features.hasPhone) scores.phone += 80;

  // URL
  if (features.hasUrl) scores.url += 80;
  if (/website|url|link/i.test(questionText)) scores.url += 40;

  // DATE/TIME
  if (features.hasTemporal && !features.hasSelect) scores.date += 60;
  if (/\bdate\b|birth|dob|when did|when will/i.test(questionText) && !context.hasOptionsAfter) scores.date += 50;
  if (/\btime\b|hour|minute|am|pm/i.test(questionText) && !context.hasOptionsAfter) scores.time += 60;

  // NUMBER
  if (features.hasQuantity) scores.number += 70;
  if (features.hasNumeric && !features.hasScale) scores.number += 50;
  if (/\bhow many\b|\bnumber of\b/i.test(questionText) && !context.hasOptionsAfter) scores.number += 60;
  if (/\bage\b|years old/i.test(questionText) && !context.hasOptionsAfter) scores.number += 70;

  // SCALE/RATING
  if (features.hasScale) { scores.rating += 80; scores.radio += 40; }
  if (features.hasAgreement) { scores.rating += 70; scores.radio += 50; }
  if (features.hasLikert) { scores.rating += 60; scores.radio += 40; }
  if (context.hasScaleAfter) { scores.rating += 50; scores.radio += 60; }
  if (/\b(\d+)\s*(to|-|through)\s*(\d+)\b/.test(questionText)) { scores.rating += 70; scores.radio += 50; }
  if (/slider|continuous|spectrum/i.test(questionText)) scores.slider += 80;

  // RANKING
  if (features.hasRank && features.hasImportance) { scores.textarea += 40; scores.checkbox += 30; }
  if (/rank.*order|order.*importance|top \d+|first.*second.*third/i.test(questionText)) scores.textarea += 50;

  // CHECKBOX
  if (features.hasAll) scores.checkbox += 90;
  if (/select all|check all|mark all|choose all|multiple|up to \d+/i.test(questionText)) scores.checkbox += 80;
  const hasBrackets = nextLines.some(l => l.match(/^\[\s*\]/));
  if (hasBrackets) scores.checkbox += 100;

  // RADIO
  if (features.hasOne && features.hasSelect) scores.radio += 70;
  if (/select one|choose one|pick one|single choice/i.test(questionText)) scores.radio += 80;
  const hasParentheses = nextLines.some(l => l.match(/^\(\s*\)\s+[A-Za-z]/));
  if (hasParentheses) scores.radio += 100;

  // BINARY
  if (features.hasBinary) scores.radio += 90;
  const yesNoCount = nextLines.filter(l => /^[\(\[]?\s*[\)\]]?\s*(yes|no)$/i.test(l.trim())).length;
  if (yesNoCount === 2) scores.radio += 100;

  // SELECT DROPDOWN
  if (context.optionCount > 10 && !features.hasAll) { scores.select += 60; scores.radio -= 20; }

  // TEXTAREA
  if (features.hasDescribe) scores.textarea += 70;
  if (features.hasOpinion || features.hasFeedback) scores.textarea += 60;
  if (features.hasWhy) scores.textarea += 50;
  if (/explain|elaborate|detail|discuss|comment|feedback|thoughts/i.test(questionText)) scores.textarea += 70;
  if (features.hasLongAnswer) scores.textarea += 60;
  if (context.hasBlankAfter && !context.hasOptionsAfter) scores.textarea += 40;
  if (features.wordCount > 20) scores.textarea += 30;

  // TEXT
  if (features.hasName && !context.hasOptionsAfter) scores.text += 80;
  if ((features.hasWhat || features.hasWho || features.hasWhere) && !context.hasOptionsAfter && !features.hasDescribe && features.wordCount < 15) scores.text += 50;
  if (context.hasBlankAfter && features.wordCount < 12) scores.text += 40;

  // CONTEXT ADJUSTMENTS
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

// Test runner
async function testAdvancedParser() {
  console.log('==========================================');
  console.log('ADVANCED PARSER TEST - Question Type Detection');
  console.log('==========================================\n');

  // Test cases with expected types
  const testCases = [
    { text: "What is your email address?", expected: "email", nextLines: [] },
    { text: "How many employees work at your company?", expected: "number", nextLines: [] },
    { text: "On a scale of 1 to 5, how satisfied are you?", expected: "rating", nextLines: [] },
    { text: "Please describe your experience in detail.", expected: "textarea", nextLines: [] },
    { text: "Which age group do you fall into?", expected: "number", nextLines: [] },
    { text: "What are your top FIVE favorite LEGO® themes? (Please check up to 5)", expected: "checkbox", nextLines: ["[ ] Option 1", "[ ] Option 2"] },
    { text: "Have you ever designed your own LEGO® creation?", expected: "radio", nextLines: ["( ) Yes", "( ) No"] },
    { text: "When is your date of birth?", expected: "date", nextLines: [] },
    { text: "What is your company website?", expected: "url", nextLines: [] },
    { text: "Please provide your phone number.", expected: "phone", nextLines: [] },
    { text: "How would you describe your primary relationship with LEGO®? (Select all that apply)", expected: "checkbox", nextLines: ["[ ] Builder", "[ ] Collector"] },
    { text: "Please rank the following in order of importance", expected: "textarea", nextLines: [] },
    { text: "What is your first name?", expected: "text", nextLines: [] },
    { text: "How often do you actively spend time building?", expected: "radio", nextLines: ["( ) Daily", "( ) Weekly", "( ) Monthly"] },
  ];

  console.log('Testing individual question classification:\n');

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, idx) => {
    const result = classifyQuestionType(testCase.text, testCase.nextLines, new Set());
    const isCorrect = result.type === testCase.expected;

    if (isCorrect) {
      console.log(`✅ Test ${idx + 1}: PASS`);
      passed++;
    } else {
      console.log(`❌ Test ${idx + 1}: FAIL`);
      console.log(`   Question: "${testCase.text.substring(0, 60)}..."`);
      console.log(`   Expected: ${testCase.expected}`);
      console.log(`   Got: ${result.type} (confidence: ${result.confidence.toFixed(2)})`);
      failed++;
    }
  });

  console.log(`\n==========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`Success Rate: ${(passed / testCases.length * 100).toFixed(1)}%`);
  console.log(`==========================================\n`);

  // Now test on actual Toy Questionnaire
  console.log('Testing on Toy Questionnaire.docx...\n');

  const buffer = fs.readFileSync('../../Toy Questionnaire.docx');
  const rawResult = await mammoth.extractRawText({ buffer });
  const lines = rawResult.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Find all questions
  const questions = [];
  lines.forEach((line, idx) => {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      const questionNum = match[1];
      const questionText = match[2];
      const nextLines = lines.slice(idx + 1, idx + 11);
      const classification = classifyQuestionType(questionText, nextLines, new Set());

      questions.push({
        number: questionNum,
        text: questionText,
        type: classification.type,
        confidence: classification.confidence
      });
    }
  });

  console.log(`Found ${questions.length} questions\n`);

  // Display results
  questions.forEach(q => {
    const confidenceBar = '█'.repeat(Math.floor(q.confidence * 10));
    console.log(`Q${q.number}: ${q.type.toUpperCase().padEnd(10)} [${confidenceBar}${' '.repeat(10 - Math.floor(q.confidence * 10))}] ${(q.confidence * 100).toFixed(0)}%`);
    console.log(`     ${q.text.substring(0, 70)}${q.text.length > 70 ? '...' : ''}\n`);
  });

  // Type distribution
  const typeCount = questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  console.log('==========================================');
  console.log('Question Type Distribution:');
  console.log('==========================================');
  Object.entries(typeCount).forEach(([type, count]) => {
    console.log(`${type.padEnd(12)}: ${count}`);
  });

  const avgConfidence = questions.reduce((sum, q) => sum + q.confidence, 0) / questions.length;
  console.log(`\nAverage Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log('==========================================\n');
}

testAdvancedParser().catch(console.error);
