import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import mermaid from 'mermaid';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.DOMPurify = { sanitize: (d) => d };

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

function walkDir(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

const distDir = join(process.cwd(), '.vitepress', 'dist');
if (!existsSync(distDir)) {
  console.log('No dist directory');
  process.exit(0);
}

const htmlFiles = walkDir(distDir);
let totalRendered = 0;
let totalErrors = 0;

async function processFile(filePath) {
  let html = readFileSync(filePath, 'utf8');
  const regex = /<div class="language-mermaid[^"]*">([\s\S]*?)<\/div>\s*(?:<button[^>]*>[\s\S]*?<\/button>)?/g;
  const matches = [];

  let match;
  while ((match = regex.exec(html)) !== null) {
    const codeHtml = match[1];
    const codeText = codeHtml.replace(/<[^>]+>/g, '').trim();
    if (codeText) {
      matches.push({ full: match[0], code: codeText });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const { full, code } = matches[i];
    try {
      const id = 'mermaid-' + Date.now() + '-' + i;
      const { svg } = await mermaid.render(id, code);
      html = html.replace(full, `<div class="mermaid">${svg}</div>`);
      totalRendered++;
    } catch (e) {
      console.error(`  ERROR in ${filePath}: ${code.slice(0, 80)} -> ${e.message?.slice(0, 100)}`);
      totalErrors++;
    }
  }

  writeFileSync(filePath, html);
}

console.log(`Processing ${htmlFiles.length} HTML files...`);

for (const file of htmlFiles) {
  await processFile(file);
}

console.log(`\nDone: ${totalRendered} diagrams rendered, ${totalErrors} errors`);
if (totalErrors > 0) process.exit(1);
