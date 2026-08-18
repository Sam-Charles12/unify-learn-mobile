import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

async function run() {
  const pdfPath = path.resolve('Engineering-CCMAS.pdf');
  console.log('Reading PDF:', pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  
  console.log('Total pages:', data.numpages);
  console.log('Text length:', data.text.length);
  
  fs.writeFileSync(path.resolve('scripts/ccmas-text.txt'), data.text, 'utf8');
  console.log('Saved text to scripts/ccmas-text.txt');
}

run().catch(console.error);
