/**
 * Diagnostic tool for file upload issues
 * Run this with: node test/diagnose-upload.js [path-to-file]
 */

import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import path from 'path';

async function diagnoseFile(filePath) {
  console.log('==========================================');
  console.log('FILE UPLOAD DIAGNOSTIC TOOL');
  console.log('==========================================\n');

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  console.log(`📄 File: ${path.basename(filePath)}`);
  console.log(`📏 Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📅 Modified: ${stats.mtime.toLocaleString()}`);
  console.log(`🔤 Extension: ${ext}\n`);

  let extractedText = '';
  let htmlContent = '';

  try {
    if (ext === '.pdf') {
      console.log('📖 Extracting text from PDF...\n');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      extractedText = data.text;
      console.log(`✅ Extracted ${data.numpages} pages`);
      console.log(`✅ ${extractedText.length} characters\n`);
    } else if (ext === '.docx' || ext === '.doc') {
      console.log('📖 Extracting text from Word document...\n');
      const buffer = fs.readFileSync(filePath);
      const rawResult = await mammoth.extractRawText({ buffer });
      const htmlResult = await mammoth.convertToHtml({ buffer });
      extractedText = rawResult.value;
      htmlContent = htmlResult.value;
      console.log(`✅ Extracted ${extractedText.length} characters\n`);
    } else {
      console.error(`❌ Unsupported file type: ${ext}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Extraction failed:`, error.message);
    process.exit(1);
  }

  // Analyze structure
  console.log('==========================================');
  console.log('STRUCTURE ANALYSIS');
  console.log('==========================================\n');

  const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log(`📊 Total lines: ${lines.length}\n`);

  // Find questions
  const questions = [];
  const sections = [];
  const otherLines = [];

  lines.forEach((line, idx) => {
    const questionMatch = line.match(/^(\d+)\.\s+(.+)/);
    const sectionMatch = line.match(/^(Section|Part|Chapter)\s+[A-Z0-9]+/i);

    if (questionMatch) {
      questions.push({
        number: questionMatch[1],
        text: questionMatch[2],
        lineIndex: idx
      });
    } else if (sectionMatch) {
      sections.push({
        text: line,
        lineIndex: idx
      });
    } else {
      otherLines.push({ text: line, lineIndex: idx });
    }
  });

  console.log(`❓ Questions found: ${questions.length}`);
  console.log(`📑 Sections found: ${sections.length}`);
  console.log(`📄 Other lines: ${otherLines.length}\n`);

  if (sections.length > 0) {
    console.log('🔹 Sections:');
    sections.forEach(s => {
      console.log(`   Line ${s.lineIndex + 1}: ${s.text.substring(0, 60)}${s.text.length > 60 ? '...' : ''}`);
    });
    console.log('');
  }

  if (questions.length === 0) {
    console.log('⚠️  NO QUESTIONS DETECTED!');
    console.log('');
    console.log('💡 Common issues:');
    console.log('   1. Questions not numbered (e.g., "1. Question text")');
    console.log('   2. File might be image-based PDF (not text)');
    console.log('   3. Unusual formatting or encoding');
    console.log('');
    console.log('First 500 characters of extracted text:');
    console.log('---');
    console.log(extractedText.substring(0, 500));
    console.log('---\n');
    return;
  }

  // Analyze questions
  console.log('==========================================');
  console.log('QUESTION ANALYSIS');
  console.log('==========================================\n');

  questions.slice(0, 10).forEach(q => {
    console.log(`Q${q.number}: ${q.text}`);

    // Get next 5 lines for context
    const nextLines = lines.slice(q.lineIndex + 1, q.lineIndex + 6);
    const hasOptions = nextLines.some(l => l.match(/^[\(\[\*\-•]/));
    const hasBlank = nextLines.some(l => l.match(/^_{3,}|^\[.*\]$/));

    if (hasOptions) {
      console.log(`   ↳ Has options (likely radio/checkbox/select)`);
      const optionCount = nextLines.filter(l => l.match(/^[\(\[\*\-•]/)).length;
      console.log(`   ↳ Option count: ${optionCount}`);
    } else if (hasBlank) {
      console.log(`   ↳ Has blank line (likely text/textarea)`);
    } else {
      console.log(`   ↳ No clear pattern detected`);
    }

    // Simple type detection
    const lowerText = q.text.toLowerCase();
    let suggestedType = 'text';

    if (/email|e-mail/.test(lowerText)) suggestedType = 'email';
    else if (/phone|mobile|cell/.test(lowerText)) suggestedType = 'phone';
    else if (/website|url/.test(lowerText)) suggestedType = 'url';
    else if (/date|birth|dob/.test(lowerText) && !hasOptions) suggestedType = 'date';
    else if (/how many|number of/.test(lowerText) && !hasOptions) suggestedType = 'number';
    else if (/describe|explain|elaborate/.test(lowerText)) suggestedType = 'textarea';
    else if (hasOptions) {
      if (/select all|check all|multiple|all that apply/.test(lowerText)) suggestedType = 'checkbox';
      else suggestedType = 'radio';
    }

    console.log(`   ↳ Suggested type: ${suggestedType}`);
    console.log('');
  });

  if (questions.length > 10) {
    console.log(`... and ${questions.length - 10} more questions\n`);
  }

  // Type distribution
  console.log('==========================================');
  console.log('RECOMMENDATIONS');
  console.log('==========================================\n');

  const issues = [];

  if (questions.length < 5) {
    issues.push('⚠️  Very few questions detected. Check if numbering is correct.');
  }

  if (sections.length === 0 && questions.length > 10) {
    issues.push('💡 No sections detected. Consider adding "Section A:", "Part 1:", etc.');
  }

  const questionsWithOptions = questions.filter((q, idx) => {
    const nextLines = lines.slice(q.lineIndex + 1, q.lineIndex + 6);
    return nextLines.some(l => l.match(/^[\(\[\*\-•]/));
  }).length;

  if (questionsWithOptions === 0 && questions.length > 5) {
    issues.push('⚠️  No option patterns detected. Add ( ) or [ ] for choices.');
  }

  if (issues.length === 0) {
    console.log('✅ Document structure looks good!');
    console.log('✅ Should convert properly.\n');
  } else {
    console.log('Found potential issues:\n');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
  }

  console.log('==========================================');
  console.log('SUMMARY');
  console.log('==========================================\n');
  console.log(`📊 Questions: ${questions.length}`);
  console.log(`📑 Sections: ${sections.length}`);
  console.log(`📝 Questions with options: ${questionsWithOptions}`);
  console.log(`📄 Total lines: ${lines.length}\n`);

  console.log('Ready to upload? The conversion should work.\n');
}

// Run diagnostic
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node diagnose-upload.js <path-to-file>');
  console.error('Example: node diagnose-upload.js "../../My Questionnaire.docx"');
  process.exit(1);
}

diagnoseFile(filePath).catch(console.error);
