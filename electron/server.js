/**
 * Next.js server launcher — runs inside Electron process
 * Started as a child with ELECTRON_RUN_AS_NODE=1
 */
const { createServer } = require('http');
const { parse } = require('url');
const path = require('path');

const PORT = process.env.PORT || 3000;
// In packaged app, resources are in process.cwd() (set by main.js)
// In dev mode, they're in the project root
const DIR = process.env.NEXT_DIR || path.join(__dirname, '..');

async function start() {
  console.log('[Server] Starting Next.js server...');
  console.log('[Server] Dir:', DIR);

  // Dynamically require next — it's in the top-level node_modules
  const nextPath = path.join(DIR, 'node_modules', 'next');
  const Next = require(nextPath);
  const nextApp = Next({
    dev: false,
    dir: DIR,
    hostname: 'localhost',
    port: PORT,
  });

  await nextApp.prepare();
  console.log('[Server] Next.js prepared');

  const handle = nextApp.getRequestHandler();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[Server] Ready on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[Server] Error:', err.message);
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('[Server] Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
