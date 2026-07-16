/**
 * Startup orchestrator
 * 1. Starts Next.js dev server
 * 2. Waits for it to be ready (including first page compile)
 * 3. Launches Electron window pointing to the ready server
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const ROOT = path.join(__dirname, '..');

console.log('=== 牛马速通器 桌面版 ===\n');
console.log('正在启动 Next.js 服务...');

// Step 1: Start Next.js
const nextProcess = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
  cwd: ROOT,
  shell: true,
  stdio: 'inherit',
});

// Step 2: Wait for server to respond with 200
function waitForServer(callback) {
  const startTime = Date.now();
  const maxWait = 120000;

  function poll() {
    if (Date.now() - startTime > maxWait) {
      console.error('\n❌ 超时：Next.js 服务未能在 120 秒内启动');
      nextProcess.kill();
      process.exit(1);
    }

    http.get(URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Next.js 就绪\n');
        callback();
      } else {
        setTimeout(poll, 1000);
      }
    }).on('error', () => {
      setTimeout(poll, 1000);
    });
  }

  // Give Next.js a few seconds before first check
  setTimeout(poll, 3000);
}

// Step 3: Once server is ready, also pre-warm the first page, then launch Electron
waitForServer(() => {
  // Make a request to trigger first-page compilation
  http.get(URL, () => {
    // Now actually launch Electron
    spawn('npx', ['electron', '.'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NEXT_EXTERNAL: 'true' },
    }).on('exit', (code) => {
      nextProcess.kill();
      process.exit(code || 0);
    });
  });
});

// Cleanup
process.on('SIGINT', () => { nextProcess.kill(); process.exit(0); });
process.on('SIGTERM', () => { nextProcess.kill(); process.exit(0); });
