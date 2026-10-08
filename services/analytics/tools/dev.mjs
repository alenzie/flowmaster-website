import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

for (const path of ['.env.roles.local','.env.runtime.local']) { try { process.loadEnvFile(path); } catch {} }
const handlers = new Map();
for (const name of ['events','app-events','app-history','retention','config','stats']) handlers.set(`/api/${name}`, (await import(`../api/${name}.js`)).default);
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css' };
const server = createServer(async (req,res) => {
  const url = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(url.searchParams);
  try {
    const handler = handlers.get(url.pathname);
    if (handler) return await handler(req,res);
    const file = url.pathname === '/' ? '/index.html' : url.pathname;
    if (!['/index.html','/dashboard.js','/tracker.js','/styles.css'].includes(file)) { res.writeHead(404); return res.end(); }
    const content = await readFile(resolve('public'+file));
    res.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(content);
  } catch { res.writeHead(500); res.end('Unavailable'); }
});
server.listen(Number(process.env.PORT || 8787), '127.0.0.1', () => console.log(`Analytics preview: http://127.0.0.1:${server.address().port}`));
