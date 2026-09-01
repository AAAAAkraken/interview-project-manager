const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const APP_URL = `${URL}/resumes/import`;
const ROOT = path.join(__dirname, '..');

let nextProcess = null;
let electronProcess = null;

function requestUrl(targetUrl, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(targetUrl, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function isPortOpen(port, host = '127.0.0.1', timeout = 500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host }, () => {
      socket.end();
      resolve(true);
    });

    socket.setTimeout(timeout);
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

function startNextServer() {
  console.log('Starting Next.js server...');
  nextProcess = spawn('npx', ['next', 'dev', '-p', String(PORT)], {
    cwd: ROOT,
    shell: true,
    stdio: 'inherit',
  });
}

function waitForServer() {
  const startTime = Date.now();
  const maxWait = 120000;

  return new Promise((resolve, reject) => {
    function poll() {
      if (Date.now() - startTime > maxWait) {
        reject(new Error('Next.js server did not start within 120 seconds'));
        return;
      }

      requestUrl(URL).then((ready) => {
        if (ready) {
          resolve();
          return;
        }
        setTimeout(poll, 1000);
      });
    }

    setTimeout(poll, 1000);
  });
}

function launchElectron() {
  electronProcess = spawn('npx', ['electron', '.'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NEXT_EXTERNAL: 'true' },
  });

  electronProcess.on('exit', (code) => {
    if (nextProcess) nextProcess.kill();
    process.exit(code || 0);
  });
}

function cleanup() {
  if (electronProcess) electronProcess.kill();
  if (nextProcess) nextProcess.kill();
}

async function boot() {
  console.log('=== Niuma Quick Pass desktop app ===\n');

  const alreadyRunning = await isPortOpen(PORT) || await requestUrl(URL);
  if (alreadyRunning) {
    console.log(`Port ${PORT} already has a server. Reusing it.`);
  } else {
    startNextServer();
  }

  await waitForServer();
  await requestUrl(APP_URL, 3000);
  launchElectron();
}

boot().catch((error) => {
  console.error(error);
  cleanup();
  process.exit(1);
});

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
