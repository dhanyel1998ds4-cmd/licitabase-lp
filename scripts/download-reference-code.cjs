const fs = require('fs');
const path = require('path');

const input = path.resolve(process.argv[2] || 'motion-analysis/live-summary.json');
const output = path.resolve(process.argv[3] || 'motion-analysis/public-code');
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
fs.mkdirSync(output, { recursive: true });

const urls = [...new Set(data.resources
  .filter((item) => item.type === 'script' && item.url.includes('framerusercontent.com/sites/'))
  .map((item) => item.url))];

(async () => {
  const manifest = [];
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    const body = await response.text();
    const parsed = new URL(url);
    const basename = path.basename(parsed.pathname).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${String(index + 1).padStart(2, '0')}-${basename}`;
    fs.writeFileSync(path.join(output, filename), body);
    manifest.push({ index: index + 1, filename, url, bytes: Buffer.byteLength(body) });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ output, files: manifest.length, bytes: manifest.reduce((sum, item) => sum + item.bytes, 0) }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
