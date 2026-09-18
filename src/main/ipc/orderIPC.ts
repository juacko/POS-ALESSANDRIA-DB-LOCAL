import { ipcMain } from 'electron'
import { OrderRepository } from '../repositories/OrderRepository'
import { OrderItem } from '@shared/types/order'
import { notifySync } from '../events/syncBus'

export function registerOrderIPC() {
  ipcMain.handle('orders:getOrderById', (_, id: string) => {
    return OrderRepository.getOrderById(id)
  })

  ipcMain.handle('orders:getActiveOrderByTable', (_, tableId: string) => {
    return OrderRepository.getActiveOrderByTable(tableId)
  })

  ipcMain.handle('orders:createOrder', (_, data: {
    tableId: string | null
    tableNumber: string
    userId: string
    sessionId: string
    items: Partial<OrderItem>[]
  }) => {
    const order = OrderRepository.createOrder(data.tableId, data.tableNumber, data.userId, data.sessionId, data.items)
    notifySync('tables')
    notifySync('orders')
    return order
  })

  ipcMain.handle('orders:saveItems', (_, data: { orderId: string; items: Partial<OrderItem>[] }) => {
    OrderRepository.saveOrderItems(data.orderId, data.items)
    notifySync('tables')
    notifySync('orders')
    return OrderRepository.getOrderById(data.orderId)
  })

  ipcMain.handle('orders:registerPaymentsAndClose', (_, data: {
    orderId: string
    sessionId: string
    payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]
  }) => {
    const order = OrderRepository.registerPaymentsAndClose(data.orderId, data.sessionId, data.payments)
    notifySync('tables')
    notifySync('orders')
    notifySync('cashier')
    return order
  })

  ipcMain.handle('orders:getOrdersHistory', (_, limit = 50) => {
    return OrderRepository.getOrdersHistory(limit)
  })
}
