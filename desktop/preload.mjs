import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('WebinarMagusDesktop', {
  retryRuntime: () => ipcRenderer.invoke('webinar-magus:retry-runtime'),
  openRuntimeHelp: () => ipcRenderer.invoke('webinar-magus:open-runtime-help'),
})
