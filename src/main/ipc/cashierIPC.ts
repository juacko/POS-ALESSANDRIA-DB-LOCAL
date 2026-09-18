import { ipcMain } from 'electron'
import { CashierRepository } from '../repositories/CashierRepository'

export function registerCashierIPC() {
  ipcMain.handle('cashier:getActiveSession', () => {
    return CashierRepository.getActiveSession()
  })

  ipcMain.handle('cashier:openSession', (_, data: { userId: string; initialCash: number }) => {
    return CashierRepository.openSession(data.userId, data.initialCash)
  })

  ipcMain.handle('cashier:closeSession', (_, data: { sessionId: string; actualCash: number; notes?: string }) => {
    return CashierRepository.closeSession(data.sessionId, data.actualCash, data.notes)
  })

  ipcMain.handle('cashier:addMovement', (_, data: { sessionId: string; type: 'Ingreso' | 'Egreso'; amount: number; description: string }) => {
    return CashierRepository.addMovement(data.sessionId, data.type, data.amount, data.description)
  })

  ipcMain.handle('cashier:getMovements', (_, sessionId: string) => {
    return CashierRepository.getMovements(sessionId)
  })

  ipcMain.handle('cashier:getSessionTotals', (_, data: { sessionId: string; initialCash: number }) => {
    return CashierRepository.calculateSessionTotals(data.sessionId, data.initialCash)
  })
}
