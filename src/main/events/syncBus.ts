import http from 'http'
import { BrowserWindow } from 'electron'

const sseClients = new Set<http.ServerResponse>()

export function registerSSEClient(req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })

  // Mensaje inicial de bienvenida
  res.write('data: {"type":"init"}\n\n')

  sseClients.add(res)

  // Keep-alive heartbeat cada 20 segundos para evitar que proxies o routers corten la conexión
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
      sseClients.delete(res)
    }
  }, 20000)

  req.on('close', () => {
    clearInterval(heartbeat)
    sseClients.delete(res)
  })
}

export function notifySync(type: 'tables' | 'orders' | 'cashier' | 'products') {
  // 1. Notificar a las ventanas nativas de Electron Desktop
  try {
    const windows = BrowserWindow.getAllWindows()
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send('sync:change', type)
      }
    }
  } catch (err) {
    console.error('[SyncBus] Error enviando IPC sync:', err)
  }

  // 2. Notificar a todos los dispositivos móviles conectados por SSE
  if (sseClients.size > 0) {
    const payload = `data: ${JSON.stringify({ type, timestamp: Date.now() })}\n\n`
    for (const client of sseClients) {
      try {
        client.write(payload)
      } catch {
        sseClients.delete(client)
      }
    }
  }
}
