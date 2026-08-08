const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = http.createServer((request, response) => {
  const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const routeAliases = new Map([
    ['/', 'index.html'],
    ['/light', 'index.html'],
    ['/light/', 'index.html'],
    ['/planos/comparar', 'planos/comparar/index.html'],
    ['/planos/comparar/', 'planos/comparar/index.html'],
    ['/light/planos/comparar', 'planos/comparar/index.html'],
    ['/light/planos/comparar/', 'planos/comparar/index.html'],
  ]);
  const lightStaticPath = requestPath.startsWith('/light/')
    ? requestPath.slice('/light'.length)
    : requestPath;
  const relativePath = routeAliases.get(requestPath)
    || lightStaticPath.replace(/^\/+/, '');
  let filePath = path.resolve(root, relativePath);

  if (filePath.startsWith(root) && fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`SaaPilot is running at http://127.0.0.1:${port}`);
});
