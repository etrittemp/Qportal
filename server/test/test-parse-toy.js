import fs from 'fs';
import mammoth from 'mammoth';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function extractAndPrint() {
  const docxPath = path.join(__dirname, '../../Toy Questionnaire.docx');

  if (!fs.existsSync(docxPath)) {
    console.error('File not found:', docxPath);
    return;
  }

  const buffer = fs.readFileSync(docxPath);

  // Extract raw text
  const result = await mammoth.extractRawText({ buffer });
  console.log('=== RAW TEXT EXTRACTION ===\n');
  console.log(result.value);
  console.log('\n=== END RAW TEXT ===');

  // Also try to get HTML with structure
  const htmlResult = await mammoth.convertToHtml({ buffer });
  console.log('\n=== HTML EXTRACTION ===\n');
  console.log(htmlResult.value);
  console.log('\n=== END HTML ===');
}

extractAndPrint().catch(console.error);
