import { app, BrowserWindow } from 'electron'
import path from 'path'
import { getDatabase } from './database/connection'
import { registerAllIPCHandlers } from './ipc'
import { startLocalServer } from './server/localServer'

// Silenciar mensajes inofensivos de drivers GPU de Chromium
app.commandLine.appendSwitch('log-level', '3')
if (process.platform === 'darwin') {
  app.commandLine.appendSwitch('use-angle', 'metal')
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Alessandria POS - Min Min',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // En desarrollo cargamos el dev server de Vite, en producción cargamos el index.html empaquetado
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Inicializar base de datos SQLite y migraciones
  getDatabase()

  // Iniciar servidor local para celulares y tablets en Wi-Fi
  startLocalServer()

  // Registrar todos los controladores IPC
  registerAllIPCHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
