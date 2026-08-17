import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.resolve('contents');
const OUT_DIR = path.resolve('scripts');

function extractDocxText(filePath) {
  const zip = new AdmZip(filePath);
  const entry = zip.getEntry('word/document.xml');
  if (!entry) return '';
  const xml = entry.getData().toString('utf8');

  const paragraphs = [];
  const regex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const paraXml = m[0];
    const texts = [];
    const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
    let t;
    while ((t = tRegex.exec(paraXml)) !== null) {
      texts.push(t[1]);
    }
    const text = texts.join('').replace(/\s+/g, ' ').trim();
    paragraphs.push(text);
  }
  return paragraphs.filter((p) => p.length > 0);
}

function isHeading(text) {
  if (text.length > 60) return false;
  if (/^[A-Z][A-Z0-9\s.,&'()-]+$/.test(text) && text.split(' ').length > 1) return true;
  if (/^(step|steps involved|classification|introduction|conclusion|definition)/i.test(text)) return true;
  return false;
}

function classifyParagraphs(paras) {
  const blocks = [];
  for (const p of paras) {
    if (isHeading(p)) {
      blocks.push({ type: 'heading', data: { text: p } });
    } else {
      blocks.push({ type: 'paragraph', data: { text: p } });
    }
  }
  return blocks;
}

function parseQA(paras) {
  const questions = [];
  let current = null;
  let currentAnswer = null;

  for (const p of paras) {
    if (/^Q\d+/.test(p)) {
      if (current) questions.push({ question: current, answer: currentAnswer });
      current = p;
      currentAnswer = null;
    } else if (/^Answer:/i.test(p)) {
      currentAnswer = p.replace(/^Answer:\s*/i, '');
    } else if (current && /^(\(i+|\(ii+|\(iii+|\(iv+|\(v+)/.test(p)) {
      questions.push({ question: current, answer: currentAnswer });
      current = p;
      currentAnswer = null;
    }
  }
  if (current) questions.push({ question: current, answer: currentAnswer });
  return questions.filter((q) => q.question);
}

const course = {
  id: 'ece301',
  code: 'ECE 301',
  title: 'Electrical Engineering Materials',
  departments: ['ece'],
  levels: ['300'],
  lecturers: ['Dr. A. Adeyemi'],
  tutors: [],
};

const opticalDocx = path.join(CONTENT_DIR, 'ECE 301 - Electrical Engineering Materials', 'ECE 301.docx');
const semiDocx = path.join(CONTENT_DIR, 'ECE 301 - Electrical Engineering Materials', 'Semiconductor Manufacturing Process.docx');
const qaDocx = path.join(CONTENT_DIR, 'ECE 301 - Electrical Engineering Materials', 'QUESTIONS AND ANSWER FOR ECE 301-1.docx');

const opticalParas = extractDocxText(opticalDocx);
const semiParas = extractDocxText(semiDocx);
const qaParas = extractDocxText(qaDocx);

const opticalBlocks = classifyParagraphs(opticalParas);
const semiBlocks = classifyParagraphs(semiParas);
const qa = parseQA(qaParas);

const weeks = [
  {
    id: 'w1',
    weekNumber: 1,
    title: 'Introduction to Electrical Engineering Materials',
    isPublished: true,
    contentBlocks: [
      ...opticalBlocks,
    ],
  },
  {
    id: 'w2',
    weekNumber: 2,
    title: 'Semiconductor Manufacturing Process',
    isPublished: true,
    contentBlocks: [
      ...semiBlocks,
    ],
  },
];

const output = {
  course,
  weeks,
  questions: qa,
};

const outFile = path.join(OUT_DIR, 'seed-data.json');
fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf8');
console.log('Written', outFile);
console.log('Optical blocks:', opticalBlocks.length);
console.log('Semi blocks:', semiBlocks.length);
console.log('QA questions:', qa.length);
console.log('First 5 questions:', qa.slice(0, 5).map((q) => q.question).join(' | '));