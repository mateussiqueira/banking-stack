// Test script: validates Mermaid diagram rendering in built pages
// Usage: node scripts/test-mermaid.mjs
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = join(process.cwd(), '.vitepress', 'dist', 'challenges');
const files = readdirSync(distDir).filter(f => f.endsWith('.html')).sort();

console.log(`Testing ${files.length} challenge pages for Mermaid rendering...\n`);

let totalDiagrams = 0;
let renderable = 0;
let errors = 0;
const errorDetails = [];

for (const file of files) {
  const html = readFileSync(join(distDir, file), 'utf8');

  // Count Shiki mermaid blocks (pre-rendered code)
  const mermaidBlocks = html.match(/<div class="language-mermaid[^"]*">([\s\S]*?)<\/div>\s*(?:<button[^>]*>[\s\S]*?<\/button>)?/g) || [];
  
  for (const block of mermaidBlocks) {
    totalDiagrams++;
    // Extract raw code from Shiki HTML
    const codeHtml = block.match(/<div class="language-mermaid[^"]*">([\s\S]*?)<\/div>/)?.[1] || '';
    const code = codeHtml.replace(/<[^>]+>/g, '').trim();
    
    if (!code) {
      errors++;
      errorDetails.push({ file, error: 'Empty code block' });
      continue;
    }

    // Check for common Mermaid syntax issues
    const firstLine = code.split('\n')[0].trim();
    const issues = [];

    if (firstLine.startsWith('graph ')) {
      issues.push('Uses deprecated "graph" keyword — should be "flowchart"');
    }

    // Check for unbalanced brackets/parens in sequence diagrams
    if (firstLine === 'sequenceDiagram') {
      const messages = code.split('\n').filter(l => l.includes('>>') && l.includes(':'));
      for (const msg of messages) {
        const text = msg.split(':').slice(1).join(':');
        const opens = (text.match(/\(/g) || []).length;
        const closes = (text.match(/\)/g) || []).length;
        if (opens !== closes) {
          issues.push(`Unbalanced parentheses in: ${msg.trim().slice(0, 60)}`);
        }
      }
    }

    // Check for classDef in flowchart (valid in 11.x but verify)
    if (code.includes('classDef') && firstLine.startsWith('flowchart')) {
      // classDef is valid in flowchart — no issue
    }

    if (issues.length > 0) {
      errors++;
      errorDetails.push({ file, firstLine, issues });
    } else {
      renderable++;
    }
  }
}

// Report
console.log(`Total diagrams: ${totalDiagrams}`);
console.log(`Renderable: ${renderable}`);
console.log(`Errors: ${errors}\n`);

if (errorDetails.length > 0) {
  console.log('ERROR DETAILS:');
  for (const err of errorDetails) {
    console.log(`  ${err.file}: ${err.firstLine || err.error}`);
    if (err.issues) {
      for (const issue of err.issues) {
        console.log(`    -> ${issue}`);
      }
    }
  }
  process.exit(1);
} else {
  console.log('All diagrams pass static validation!');
  process.exit(0);
}
