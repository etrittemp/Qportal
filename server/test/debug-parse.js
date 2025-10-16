import fs from 'fs';
import mammoth from 'mammoth';

async function debugParse() {
  const buffer = fs.readFileSync('Toy Questionnaire.docx');
  const raw = await mammoth.extractRawText({ buffer });
  const html = await mammoth.convertToHtml({ buffer });

  const lines = raw.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log('=== LINE BY LINE ANALYSIS ===\n');
  console.log(`Total lines: ${lines.length}\n`);

  // Extract all strong tags from HTML
  const strongTags = html.value.match(/<strong>([^<]+)<\/strong>/g) || [];
  const strongTexts = strongTags.map(tag => tag.replace(/<\/?strong>/g, ''));

  console.log('Strong tags (sections/special questions):');
  strongTexts.forEach((text, idx) => {
    console.log(`  ${idx + 1}. ${text}`);
  });

  console.log('\n=== EXPECTED STRUCTURE ===');
  console.log('Section A: Questions 1-5');
  console.log('Section B: Questions 6-11');
  console.log('Section C: Questions 12-16');
  console.log('Section D: Questions 17-20');

  console.log('\n=== NUMBERED LINES (Potential Questions) ===\n');
  lines.forEach((line, idx) => {
    if (line.match(/^\d+\./)) {
      console.log(`Line ${idx}: ${line.substring(0, 100)}`);
    }
  });

  console.log('\n=== LINES WITH ? (Potential Questions) ===\n');
  lines.forEach((line, idx) => {
    if (line.endsWith('?')) {
      console.log(`Line ${idx}: ${line.substring(0, 100)}`);
    }
  });

  console.log('\n=== SECTION MARKERS ===\n');
  lines.forEach((line, idx) => {
    if (line.match(/^Section [A-Z]/i)) {
      console.log(`Line ${idx}: ${line}`);
    }
  });
}

debugParse();
