import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('WebinarMagusDesktop', {
  retryRuntime: () => ipcRenderer.invoke('webinar-magus:retry-runtime'),
  installRuntime: () => ipcRenderer.invoke('webinar-magus:install-runtime'),
  openHomebrew: () => ipcRenderer.invoke('webinar-magus:open-homebrew'),
  installWsl: () => ipcRenderer.invoke('webinar-magus:install-wsl'),
  onInstallLog: (callback) => {
    const handler = (_event, payload) => callback(payload)
    ipcRenderer.on('webinar-magus:install-log', handler)
    return () => ipcRenderer.removeListener('webinar-magus:install-log', handler)
  },
  openRuntimeHelp: () => ipcRenderer.invoke('webinar-magus:open-runtime-help'),
})
