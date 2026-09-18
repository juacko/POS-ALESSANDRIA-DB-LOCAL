import { ipcMain } from 'electron'
import { getLocalIPAddress } from '../server/localServer'

export function registerServerIPC() {
  ipcMain.handle('server:getNetworkInfo', () => {
    const ip = getLocalIPAddress()
    const port = 3000
    return {
      ip,
      port,
      url: `http://${ip}:${port}`
    }
  })
}
