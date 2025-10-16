import fs from 'fs';
import mammoth from 'mammoth';

async function testToyQuestionnaire() {
  console.log('Testing Toy Questionnaire.docx...\n');

  const buffer = fs.readFileSync('/home/etritneziri/projects/Qportal/Toy Questionnaire.docx');
  const rawResult = await mammoth.extractRawText({ buffer });

  const text = rawResult.value;
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`Total lines: ${lines.length}\n`);
  console.log('First 30 lines:\n');

  lines.slice(0, 30).forEach((line, idx) => {
    const isQuestion = line.match(/^\d+\.\s+/);
    const isSection = line.match(/^Section [A-Z]:/i);
    const marker = isQuestion ? '❓' : isSection ? '📑' : '  ';
    console.log(`${marker} ${idx + 1}: ${line}`);
  });

  console.log('\n========================================');
  console.log('QUESTION DETECTION TEST');
  console.log('========================================\n');

  const questions = lines.filter(l => l.match(/^\d+\.\s+/));
  console.log(`Questions detected: ${questions.length}\n`);

  if (questions.length === 0) {
    console.log('❌ NO QUESTIONS DETECTED!\n');
    console.log('This means the regex /^\\d+\\.\\s+/ is not matching any lines.');
    console.log('Possible reasons:');
    console.log('  1. Questions are not numbered with "1. ", "2. ", etc.');
    console.log('  2. There are hidden characters before the numbers');
    console.log('  3. The format is different (e.g., "1)", "Q1.", etc.)\n');
  } else {
    questions.slice(0, 10).forEach(q => {
      console.log(`✓ ${q.substring(0, 80)}`);
    });
  }

  console.log('\n========================================');
  console.log('SECTION DETECTION TEST');
  console.log('========================================\n');

  const sections = lines.filter(l => l.match(/^Section [A-Z]:/i));
  console.log(`Sections detected: ${sections.length}\n`);

  sections.forEach(s => {
    console.log(`✓ ${s}`);
  });
}

testToyQuestionnaire().catch(console.error);
