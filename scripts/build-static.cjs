const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const files = [
  'index.html',
  'styles.css',
  'pricing.css',
  'accessibility-typography.css',
  'theme-light.css',
  'responsive-lp.css',
  'script.js',
  'pricing-data.js',
  'pricing.js',
  'motion-spec.json',
  'planos/comparar/index.html',
];

fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const relativePath of files) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), {
  recursive: true,
});

console.log(`Static production bundle created at ${output}`);
