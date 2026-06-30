// Browser test: opens pages and verifies Mermaid SVG rendering
// Usage: node scripts/test-mermaid-browser.mjs
import { launch } from 'puppeteer';
import { readdirSync } from 'fs';
import { join } from 'path';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';

const PORT = 9876;
const distDir = join(process.cwd(), '.vitepress', 'dist');
const challengesDir = join(distDir, 'challenges');

const files = readdirSync(challengesDir).filter(f => f.endsWith('.html')).sort();

// Simple static server
const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  let filePath = join(distDir, url.pathname);
  if (!existsSync(filePath) || filePath.endsWith('/')) {
    filePath = join(distDir, url.pathname, 'index.html');
  }
  if (!existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = '.' + (filePath.split('.').pop() || 'html');
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
  res.end(readFileSync(filePath));
});

server.listen(PORT);
console.log(`Server on http://localhost:${PORT}\n`);

const browser = await launch({ headless: true, args: ['--no-sandbox'] });
const results = [];

for (const file of files) {
  const page = await browser.newPage();
  const url = `http://localhost:${PORT}/challenges/${file}`;

  try {
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for Mermaid SVGs to appear (or timeout)
    await page.waitForFunction(() => {
      const divs = document.querySelectorAll('.mermaid');
      if (divs.length === 0) return false;
      return Array.from(divs).every(d => d.querySelector('svg') || d.querySelector('pre'));
    }, { timeout: 10000 });

    // Check results
    const result = await page.evaluate(() => {
      const divs = document.querySelectorAll('.mermaid');
      const report = [];
      for (const div of divs) {
        const svg = div.querySelector('svg');
        if (svg) {
          report.push({ status: 'ok', width: svg.getAttribute('width') });
        } else {
          const err = div.querySelector('pre');
          report.push({ status: 'error', message: err?.textContent?.slice(0, 100) || 'No SVG found' });
        }
      }
      return report;
    });

    const ok = result.filter(r => r.status === 'ok').length;
    const err = result.filter(r => r.status === 'error').length;
    console.log(`${file}: ${ok}/${result.length} rendered${err > 0 ? `, ${err} errors` : ' ✓'}`);

    if (err > 0) {
      for (const r of result) {
        if (r.status === 'error') console.log(`  ERROR: ${r.message}`);
      }
    }

    results.push({ file, total: result.length, ok, errors: err });
  } catch (e) {
    console.log(`${file}: FAILED - ${e.message?.slice(0, 80)}`);
    results.push({ file, total: 0, ok: 0, errors: 0, failed: true });
  } finally {
    await page.close();
  }
}

await browser.close();
server.close();

const total = results.reduce((s, r) => s + r.total, 0);
const totalOk = results.reduce((s, r) => s + r.ok, 0);
const totalErrors = results.reduce((s, r) => s + r.errors, 0);
const failedPages = results.filter(r => r.failed).length;

console.log(`\n=== SUMMARY ===`);
console.log(`Files tested: ${files.length}`);
console.log(`Diagrams: ${totalOk}/${total} rendered successfully`);
console.log(`Errors: ${totalErrors}`);
console.log(`Failed pages: ${failedPages}`);

process.exit(totalErrors > 0 ? 1 : 0);
