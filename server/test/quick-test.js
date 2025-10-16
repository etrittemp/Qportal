import fs from 'fs';
import mammoth from 'mammoth';

async function quickTest() {
  const buffer = fs.readFileSync('Toy Questionnaire.docx');
  const raw = await mammoth.extractRawText({ buffer });
  const html = await mammoth.convertToHtml({ buffer });

  console.log('Raw text first 2000 chars:');
  console.log(raw.value.substring(0, 2000));
  console.log('\n\nHTML tags analysis:');
  const strongTags = (html.value.match(/<strong>([^<]+)<\/strong>/g) || []);
  console.log('Strong tags found:', strongTags.slice(0, 10));
}

quickTest();
