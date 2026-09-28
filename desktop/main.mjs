import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const DASHBOARD_URL = process.env.WEBINAR_MAGUS_URL || 'http://127.0.0.1:3420'
const DEFAULT_RUNTIME_DIR = join(homedir(), 'webinar-magus')

let mainWindow = null
let runtimeStartedByApp = false
let runtimeInstallChild = null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function dashboardReady() {
  try {
    const res = await fetch(DASHBOARD_URL, { signal: AbortSignal.timeout(1200), redirect: 'manual' })
    return res.status > 0
  } catch {
    return false
  }
}

function spawnDetached(file, args, options = {}) {
  const child = spawn(file, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    ...options,
  })
  child.unref()
  return child
}

function startRuntime() {
  if (process.platform === 'win32') {
    // Runtime remains in WSL for v0.1. The desktop shell is native Windows.
    spawnDetached('wsl.exe', ['bash', '-lc', 'cd ~/webinar-magus && bash scripts/start.sh'])
    runtimeStartedByApp = true
    return { ok: true, mode: 'wsl' }
  }

  const runtimeDir = process.env.WEBINAR_MAGUS_RUNTIME || DEFAULT_RUNTIME_DIR
  const startScript = join(runtimeDir, 'scripts', 'start.sh')
  if (!existsSync(startScript)) return { ok: false, reason: 'runtime-missing', runtimeDir }

  spawnDetached('/bin/bash', [startScript], { cwd: runtimeDir })
  runtimeStartedByApp = true
  return { ok: true, mode: 'native', runtimeDir }
}

async function waitForDashboard(timeoutMs = 90000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await dashboardReady()) return true
    await sleep(1000)
  }
  return false
}

async function ensureRuntimeAndLoad() {
  if (await dashboardReady()) {
    await mainWindow.loadURL(DASHBOARD_URL)
    return
  }

  const result = startRuntime()
  if (!result.ok) {
    await mainWindow.loadFile(join(import.meta.dirname, 'renderer', 'runtime-missing.html'))
    return
  }

  await mainWindow.loadFile(join(import.meta.dirname, 'renderer', 'starting.html'))
  const ready = await waitForDashboard()
  if (ready) await mainWindow.loadURL(DASHBOARD_URL)
  else await mainWindow.loadFile(join(import.meta.dirname, 'renderer', 'runtime-error.html'))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    title: 'Webinár Mágus',
    backgroundColor: '#F7F9FC',
    icon: join(import.meta.dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url)
      if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
        return { action: 'allow' }
      }
    } catch { /* invalid URL -> deny */ }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const parsed = new URL(url)
      const allowed = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost'
      if (!allowed && !url.startsWith('file://')) {
        event.preventDefault()
        shell.openExternal(url)
      }
    } catch {
      event.preventDefault()
    }
  })

  ensureRuntimeAndLoad()
}

ipcMain.handle('webinar-magus:retry-runtime', async () => {
  await ensureRuntimeAndLoad()
  return true
})

ipcMain.handle('webinar-magus:install-runtime', async () => {
  if (runtimeInstallChild) return { ok: false, reason: 'already-running' }
  if (process.platform !== 'darwin') {
    return { ok: false, reason: 'unsupported-platform' }
  }

  const script = join(import.meta.dirname, 'bootstrap', 'macos.sh')
  if (!existsSync(script)) return { ok: false, reason: 'bootstrap-missing' }

  return await new Promise((resolve) => {
    const child = spawn('/bin/bash', [script], {
      cwd: import.meta.dirname,
      env: { ...process.env, WEBINAR_MAGUS_RUNTIME: DEFAULT_RUNTIME_DIR },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    runtimeInstallChild = child

    const send = (type, chunk) => {
      const line = String(chunk)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('webinar-magus:install-log', { type, line })
      }
    }

    child.stdout?.on('data', (chunk) => send('stdout', chunk))
    child.stderr?.on('data', (chunk) => send('stderr', chunk))
    child.on('error', (err) => {
      runtimeInstallChild = null
      resolve({ ok: false, reason: 'spawn-error', message: err.message })
    })
    child.on('exit', async (code) => {
      runtimeInstallChild = null
      if (code === 0) {
        await ensureRuntimeAndLoad()
        resolve({ ok: true })
      } else if (code === 20) {
        resolve({ ok: false, reason: 'homebrew-required' })
      } else {
        resolve({ ok: false, reason: 'install-failed', code })
      }
    })
  })
})

ipcMain.handle('webinar-magus:open-runtime-help', async () => {
  await shell.openExternal('https://github.com/tmisi76/webinar-magus')
  return true
})

ipcMain.handle('webinar-magus:open-homebrew', async () => {
  await shell.openExternal('https://brew.sh')
  return true
})

app.whenReady().then(createWindow)

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// The desktop shell does not kill the runtime on exit. Background agents,
// schedules and automations are product features and must keep running.
app.on('before-quit', () => {
  void runtimeStartedByApp
})
