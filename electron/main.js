const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('in-process-gpu');

const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;
const APP_URL = `${SERVER_URL}/resumes/import`;

let mainWindow = null;
let serverProcess = null;
let loadRetryCount = 0;
const MAX_RETRIES = 30;
const RETRY_DELAY = 2000;

function requestUrl(targetUrl, timeout = 1000) {
  return new Promise((resolve) => {
    const req = http.get(targetUrl, (res) => {
      res.resume();
      resolve(res.statusCode === 200 || res.statusCode === 304);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startServer() {
  return new Promise(async (resolve, reject) => {
    if (await requestUrl(SERVER_URL, 1000)) {
      console.log('[App] Existing Next.js server detected, reusing it.');
      resolve();
      return;
    }

    if (process.env.NEXT_EXTERNAL) {
      console.log('[App] Waiting for external Next.js server...');
      const t0 = Date.now();
      const poll = () => {
        if (Date.now() - t0 > 30000) {
          reject(new Error('External server start timed out (30s)'));
          return;
        }
        requestUrl(SERVER_URL).then((ready) => {
          if (ready) resolve();
          else setTimeout(poll, 500);
        });
      };
      setTimeout(poll, 1000);
      return;
    }

    let stderrOutput = '';
    const isPackaged = app.isPackaged;
    const serverScript = path.join(__dirname, 'server.js');
    const cwd = isPackaged ? process.resourcesPath : path.join(__dirname, '..');

    console.log(`[App] Starting server (packaged=${isPackaged})`);
    console.log(`[App] Script: ${serverScript}`);
    console.log(`[App] CWD: ${cwd}`);

    serverProcess = spawn(process.execPath, [serverScript], {
      cwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...(isPackaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        PORT: String(PORT),
        NEXT_DIR: cwd,
        DB_PATH: isPackaged
          ? path.join(app.getPath('userData'), 'interview-projects.db')
          : undefined,
      },
    });
    const activeServerProcess = serverProcess;

    serverProcess.stdout?.on('data', (d) => {
      console.log(`[Server] ${d.toString().trim()}`);
    });

    serverProcess.stderr?.on('data', (d) => {
      const msg = d.toString().trim();
      stderrOutput += msg + '\n';
      console.log(`[Server] ${msg}`);
    });

    serverProcess.on('error', (err) => {
      const e = new Error('Server process failed to start: ' + err.message);
      e.stderr = stderrOutput;
      reject(e);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        const e = new Error('Server exited (code=' + code + ')');
        e.stderr = stderrOutput;
        reject(e);
      }
    });

    const t0 = Date.now();
    const poll = () => {
      if (Date.now() - t0 > 30000) {
        const e = new Error('Server start timed out (30s)');
        e.stderr = stderrOutput;
        reject(e);
        return;
      }
      if (activeServerProcess && activeServerProcess.exitCode !== null && activeServerProcess.exitCode !== 0) {
        const e = new Error('Server exited (code=' + activeServerProcess.exitCode + ')');
        e.stderr = stderrOutput;
        reject(e);
        return;
      }
      requestUrl(SERVER_URL).then((ready) => {
        if (ready) resolve();
        else setTimeout(poll, 500);
      });
    };
    setTimeout(poll, 2000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '牛马速通器',
    backgroundColor: '#f3f4f6',
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(`data:text/html,
    <html><head><meta charset="utf-8"></head>
    <body style="background:#f3f4f6;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;font-family:sans-serif;color:#6b7280;">
        <div style="width:40px;height:40px;border:4px solid #e5e7eb;border-top-color:#3b82f6;border-radius:50%;animation:s 0.8s linear infinite;margin:0 auto 16px;"></div>
        <p style="font-size:16px;margin:0;">正在加载...</p>
        <style>@keyframes s{to{transform:rotate(360deg)}}</style>
      </div></body></html>`);

  loadApp();
  mainWindow.on('closed', () => { mainWindow = null; });
}

function loadApp() {
  http.get(SERVER_URL, (res) => {
    if (res.statusCode === 200 || res.statusCode === 304) {
      mainWindow?.loadURL(APP_URL);
      mainWindow?.once('ready-to-show', () => mainWindow?.show());
    } else {
      retryLoad();
    }
  }).on('error', () => retryLoad());
}

function retryLoad() {
  loadRetryCount++;
  if (loadRetryCount > MAX_RETRIES) {
    mainWindow?.loadURL(`data:text/html,
      <html><head><meta charset="utf-8"></head>
      <body style="background:#fef2f2;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;font-family:sans-serif;">
          <p style="font-size:18px;font-weight:bold;color:#991b1b;margin:0;">连接超时</p>
          <p style="font-size:14px;color:#7f1d1d;margin:8px 0;">Next.js 服务未响应</p>
        </div></body></html>`);
    mainWindow?.show();
    return;
  }
  setTimeout(loadApp, RETRY_DELAY);
}

app.whenReady().then(async () => {
  try {
    await startServer();
    console.log('[App] Server ready');
    createWindow();
  } catch (err) {
    console.error('[App] Failed:', err.message);
    const errMsg = (err.stderr || err.message || '未知错误')
      .replace(/`/g, "'")
      .replace(/</g, '&lt;');
    const win = new BrowserWindow({
      width: 700,
      height: 500,
      title: '启动失败',
      webPreferences: { nodeIntegration: false },
    });
    win.loadURL(`data:text/html,
      <html><head><meta charset="utf-8"></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#fef2f2;">
        <div style="max-width:600px;text-align:center;padding:20px;font-family:sans-serif;">
          <p style="font-size:24px;margin:0 0 16px;">启动失败</p>
          <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:16px;text-align:left;">
            <pre style="font-size:12px;color:#991b1b;margin:0;white-space:pre-wrap;word-break:break-all;max-height:250px;overflow-y:auto;">${errMsg}</pre>
          </div>
        </div></body></html>`);
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
