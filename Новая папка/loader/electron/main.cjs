const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const os = require('node:os');
const https = require('node:https');
const http = require('node:http');
const { spawn, spawnSync } = require('node:child_process');
const { Client, Authenticator } = require('minecraft-launcher-core');

let mainWindow;
let launchInProgress = false;
let logFilePath = '';

const FABRIC_MC_VERSION = process.env.MAVEN_MC_VERSION || '1.21.11';
const FABRIC_LOADER_VERSION = process.env.MAVEN_FABRIC_LOADER || '0.18.4';
const FABRIC_INSTALLER_VERSION = process.env.MAVEN_FABRIC_INSTALLER || '1.0.1';
const FABRIC_API_FILE = process.env.MAVEN_FABRIC_API_FILE || 'fabric-api-0.141.3-1.21.11.jar';

function formatNow() {
  const date = new Date();
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function shortDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function initLogger() {
  const logsDir = path.join(os.homedir(), '.maven-loader', 'logs');
  await fsp.mkdir(logsDir, { recursive: true });
  logFilePath = path.join(logsDir, `launcher-${shortDateKey()}.log`);
}

function writeLog(scope, message) {
  const line = `[${formatNow()}] [${scope}] ${message}\n`;
  process.stdout.write(line);
  if (logFilePath) {
    fs.appendFile(logFilePath, line, () => {});
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 430,
    height: 520,
    minWidth: 390,
    minHeight: 450,
    maxWidth: 430,
    maxHeight: 520,
    resizable: false,
    maximizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    autoHideMenuBar: true,
    title: 'Maven Loader',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function emitLaunchStatus(stage, details = '') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('launch:status', { stage, details, at: Date.now() });
  writeLog('launch-status', `${stage}${details ? ` | ${details}` : ''}`);
}

function requestModule(url) {
  return url.startsWith('https:') ? https : http;
}

function parseJavaMajor(versionOutput) {
  const match = String(versionOutput || '').match(/version\s+"(\d+)(?:\.(\d+))?/i);
  if (!match) return 0;
  const major = Number(match[1]);
  return Number.isFinite(major) ? major : 0;
}

function downloadToFile(url, filePath, headers = {}) {
  return new Promise((resolve, reject) => {
    writeLog('download', `start ${url} -> ${filePath}`);
    const client = requestModule(url);
    const req = client.get(url, { headers }, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        writeLog('download', `failed ${url} status=${res.statusCode}`);
        reject(new Error(`Download failed ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);
      file.on('finish', () => {
        writeLog('download', `done ${url}`);
        file.close(resolve);
      });
      file.on('error', reject);
    });

    req.on('error', reject);
  });
}

async function ensureFabricInstalled(javaPath, gameDir) {
  const versionsDir = path.join(gameDir, 'versions');
  const mcCandidates = [FABRIC_MC_VERSION];

  const installerUrl = `https://maven.fabricmc.net/net/fabricmc/fabric-installer/${FABRIC_INSTALLER_VERSION}/fabric-installer-${FABRIC_INSTALLER_VERSION}.jar`;
  const cacheDir = path.join(gameDir, '.maven-cache');
  const installerPath = path.join(cacheDir, `fabric-installer-${FABRIC_INSTALLER_VERSION}.jar`);

  await fsp.mkdir(cacheDir, { recursive: true });
  emitLaunchStatus('installing-fabric', 'Downloading Fabric installer...');
  await downloadToFile(installerUrl, installerPath);

  // If you want to move to another Minecraft/Fabric version later:
  // 1) change FABRIC_MC_VERSION
  // 2) change FABRIC_LOADER_VERSION
  // 3) optionally pin another installer version in FABRIC_INSTALLER_VERSION
  // 4) delete the matching folder in .minecraft/versions if you need clean reinstall
  let installedMcVersion = null;
  let lastErr = null;

  for (const mcVersion of mcCandidates) {
    const fabricVersionId = `fabric-loader-${FABRIC_LOADER_VERSION}-${mcVersion}`;
    const fabricJson = path.join(versionsDir, fabricVersionId, `${fabricVersionId}.json`);
    if (fs.existsSync(fabricJson)) {
      installedMcVersion = mcVersion;
      break;
    }

    const args = [
      '-jar',
      installerPath,
      'client',
      '-dir',
      gameDir,
      '-mcversion',
      mcVersion,
      '-loader',
      FABRIC_LOADER_VERSION,
      '-noprofile'
    ];

    emitLaunchStatus('installing-fabric', `Installing Fabric ${FABRIC_LOADER_VERSION} for ${mcVersion}...`);

    try {
      await new Promise((resolve, reject) => {
        let out = '';
        let err = '';
        const child = spawn(javaPath || 'java', args, { stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout.on('data', (chunk) => {
          out += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
          err += chunk.toString();
        });
        child.on('error', reject);
        child.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Fabric installer exited with code ${code}. stdout=${out.slice(-300)} stderr=${err.slice(-300)}`));
        });
      });

      installedMcVersion = mcVersion;
      break;
    } catch (error) {
      lastErr = error;
      writeLog('fabric', `install attempt failed for mc=${mcVersion}: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  if (!installedMcVersion) {
    throw new Error(
      `Fabric installation failed for versions: ${mcCandidates.join(', ')}. Last error: ${
        lastErr instanceof Error ? lastErr.message : 'unknown'
      }`
    );
  }

  writeLog('fabric', `installed fabric-loader=${FABRIC_LOADER_VERSION} mc=${installedMcVersion}`);
  return installedMcVersion;
}

async function ensureClientJarMod({ apiUrl, token, gameDir }) {
  const modsDir = path.join(gameDir, 'mods');
  await fsp.mkdir(modsDir, { recursive: true });

  const modPath = path.join(modsDir, 'client.jar');
  const base = String(apiUrl || '').replace(/\/$/, '');
  const manual = process.env.MAVEN_CLIENT_JAR_URL;
  const candidates = manual
    ? [manual]
    : [
        `${base}/client.jar`,
        `${base}/api/client.jar`,
        `${base}/api/files/client.jar`,
        `${base}/api/download/client.jar`
      ];

  emitLaunchStatus('downloading-mod', 'Downloading client.jar...');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let lastError = null;
  for (const url of candidates) {
    try {
      await downloadToFile(url, modPath, headers);
      writeLog('mod', `client.jar downloaded from ${url}`);
      return;
    } catch (error) {
      writeLog('mod', `failed from ${url}: ${error instanceof Error ? error.message : 'unknown error'}`);
      lastError = error;
    }
  }

  throw new Error(
    `Cannot download client.jar. Tried: ${candidates.join(', ')}. Last error: ${
      lastError instanceof Error ? lastError.message : 'unknown'
    }`
  );
}

async function ensureFabricApiMod({ apiUrl, gameDir }) {
  const modsDir = path.join(gameDir, 'mods');
  await fsp.mkdir(modsDir, { recursive: true });
  const fileName = FABRIC_API_FILE;
  const modPath = path.join(modsDir, fileName);
  if (fs.existsSync(modPath)) return;

  const base = String(apiUrl || '').replace(/\/$/, '');
  const url = `${base}/${fileName}`;

  emitLaunchStatus('downloading-mod', `Downloading ${fileName}...`);
  await downloadToFile(url, modPath);
  writeLog('mod', `fabric-api downloaded ${fileName} from ${url}`);
}

async function launchMinecraft({ username, ramGb, javaPath, gameDir, mcVersion }) {
  const launcher = new Client();
  let lastDebug = '';

  const javaExec = javaPath || process.env.JAVA_BIN || 'java';
  const javaCheck = spawnSync(javaExec, ['-version'], { encoding: 'utf8' });
  if (javaCheck.error) {
    throw new Error(`Java not found or not executable (${javaExec}): ${javaCheck.error.message}`);
  }
  const javaOutput = `${javaCheck.stdout || ''}\n${javaCheck.stderr || ''}`.trim();
  const javaMajor = parseJavaMajor(javaOutput);
  writeLog('java', `using ${javaExec} | detected major=${javaMajor}`);
  if (javaMajor < 21) {
    throw new Error(
      `Java 21+ is required by current client mod. Detected Java ${javaMajor || 'unknown'}. Please install JDK 21 and set JAVA_BIN.`
    );
  }

  launcher.on('debug', (message) => {
    const text = String(message || '').trim();
    if (!text) return;
    lastDebug = text;
    writeLog('mclc-debug', text);
  });

  launcher.on('progress', (progress) => {
    if (typeof progress === 'number') {
      emitLaunchStatus('downloading-assets', `Downloading assets... ${Math.round(progress)}%`);
      writeLog('mclc-progress', `value=${progress}`);
      return;
    }

    if (progress && typeof progress === 'object') {
      const type = progress.type || 'unknown';
      const task = Number(progress.task || 0);
      const total = Number(progress.total || 0);
      const pct = total > 0 ? Math.round((task / total) * 100) : 0;
      emitLaunchStatus('downloading-assets', `${type}: ${task}/${total} (${pct}%)`);
      writeLog('mclc-progress', `${type} ${task}/${total} (${pct}%)`);
    }
  });

  launcher.on('download-status', (state) => {
    if (!state || typeof state !== 'object') return;
    const name = state.name || state.type || 'file';
    const current = Number(state.current || 0);
    const total = Number(state.total || 0);
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    emitLaunchStatus('downloading-assets', `${name}: ${pct}%`);
    writeLog('mclc-download-status', `${name} ${current}/${total} (${pct}%)`);
  });

  launcher.on('download', (entry) => {
    writeLog('mclc-download', String(entry || 'downloaded file'));
  });

  launcher.on('data', (line) => {
    if (typeof line === 'string' && line.trim()) {
      emitLaunchStatus('runtime', line.slice(0, 120));
      writeLog('minecraft', line.trim());
    }
  });

  launcher.on('close', (code) => {
    writeLog('minecraft', `process closed with code=${code}`);
  });

  launcher.on('error', (error) => {
    writeLog('minecraft', `process error: ${error instanceof Error ? error.message : String(error)}`);
  });

  const versionId = `fabric-loader-${FABRIC_LOADER_VERSION}-${mcVersion}`;
  const options = {
    authorization: Authenticator.getAuth(username || 'MavenUser'),
    root: gameDir,
    version: {
      number: mcVersion,
      type: 'release',
      custom: versionId
    },
    memory: {
      max: `${Math.max(2, Number(ramGb || 4))}G`,
      min: '2G'
    },
    javaPath: javaPath || undefined,
    timeout: 30000
  };

  emitLaunchStatus('launching', 'Starting Minecraft...');
  writeLog(
    'launch',
    `launch request user=${username || 'MavenUser'} ram=${Math.max(2, Number(ramGb || 4))}G root=${gameDir} version=${versionId}`
  );
  const child = await launcher.launch(options);
  if (!child) {
    throw new Error(
      `Minecraft process was not created.${lastDebug ? ` MCLC: ${lastDebug}` : ''}`
    );
  }
  writeLog('launch', `minecraft process started pid=${child.pid || 'unknown'}`);
  return child;
}

app.whenReady().then(() => {
  initLogger().then(() => writeLog('app', 'logger initialized')).catch(() => {});
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:toggle-pin', () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next);
  return next;
});

ipcMain.handle('window:open-external', (_event, url) => {
  if (typeof url === 'string' && url.trim()) shell.openExternal(url);
});

ipcMain.handle('launch:start', async (_event, payload) => {
  if (launchInProgress) throw new Error('Launch is already running.');

  launchInProgress = true;
  try {
    writeLog('launch', `start payload version=${payload?.version || 'unknown'} user=${payload?.username || 'unknown'}`);
    const gameDir = path.join(os.homedir(), '.maven-loader', 'minecraft');
    await fsp.mkdir(gameDir, { recursive: true });

    emitLaunchStatus('preparing', 'Preparing launcher files...');
    const installedMcVersion = await ensureFabricInstalled(payload?.javaPath, gameDir);
    await ensureFabricApiMod({ apiUrl: payload?.apiUrl, gameDir });
    await ensureClientJarMod({ apiUrl: payload?.apiUrl, token: payload?.token, gameDir });
    const child = await launchMinecraft({
      username: payload?.username,
      ramGb: payload?.ramGb,
      javaPath: payload?.javaPath,
      gameDir,
      mcVersion: installedMcVersion
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.hide();
      writeLog('window', 'loader hidden while minecraft is running');
    }

    child.once('close', (code) => {
      writeLog('minecraft', `close event received code=${code}`);
      emitLaunchStatus('game-closed', `Minecraft closed with code ${code}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        writeLog('window', 'loader shown after minecraft close');
      }
      launchInProgress = false;
    });

    child.once('error', (error) => {
      writeLog('minecraft', `child error event: ${error instanceof Error ? error.message : String(error)}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
      launchInProgress = false;
    });

    emitLaunchStatus('done', 'Launcher started.');
    writeLog('launch', 'done');
    return { ok: true };
  } catch (error) {
    writeLog('launch', `failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    launchInProgress = false;
    throw error;
  }
});
