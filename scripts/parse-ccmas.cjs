const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
  const pdfPath = path.resolve('Engineering-CCMAS.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse(buffer);
  const data = await parser.getText();
  
  console.log('Text length:', data.text ? data.text.length : typeof data);
  const textContent = typeof data === 'string' ? data : data.text || JSON.stringify(data);
  fs.writeFileSync(path.resolve('scripts/ccmas-text.txt'), textContent, 'utf8');
  console.log('Saved to scripts/ccmas-text.txt');
}

run().catch(async (e) => {
  console.log('Error:', e.message);
  // fallback to inspect PDFParse methods
  console.log('PDFParse prototype:', Object.getOwnPropertyNames(PDFParse.prototype));
});
