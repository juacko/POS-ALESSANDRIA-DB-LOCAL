import { ipcMain } from 'electron'
import { TableRepository } from '../repositories/TableRepository'

export function registerTableIPC() {
  ipcMain.handle('tables:getTables', () => {
    return TableRepository.getTables()
  })
}
