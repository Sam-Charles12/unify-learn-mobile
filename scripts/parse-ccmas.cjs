const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

async function run() {
  const pdfPath = path.resolve('Engineering-CCMAS.pdf');
  console.log('Reading PDF:', pdfPath);
  const buffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse(new Uint8Array(buffer));
  const data = await parser.getText();
  
  console.log('Got text result!');
  const textContent = typeof data === 'string' ? data : (data.text || JSON.stringify(data));
  console.log('Text length:', textContent.length);
  fs.writeFileSync(path.resolve('scripts/ccmas-text.txt'), textContent, 'utf8');
  console.log('Saved to scripts/ccmas-text.txt');
}

run().catch((e) => {
  console.error('Error running parser:', e);
});
