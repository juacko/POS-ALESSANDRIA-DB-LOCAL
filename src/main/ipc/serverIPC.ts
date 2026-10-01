import { ipcMain } from 'electron'
import { getAvailableNetworkInterfaces } from '../server/localServer'

export function registerServerIPC() {
  ipcMain.handle('server:getNetworkInfo', () => {
    const interfaces = getAvailableNetworkInterfaces()
    const ip = interfaces[0]?.ip || '127.0.0.1'
    const port = 3000
    return {
      ip,
      port,
      url: `http://${ip}:${port}`,
      interfaces
    }
  })
}
