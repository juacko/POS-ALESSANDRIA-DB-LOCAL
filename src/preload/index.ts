import { contextBridge, ipcRenderer } from 'electron'
import { POSAPI } from './api'

function toPlain<T>(data: T): T {
  if (data === undefined || data === null) return data
  try {
    return JSON.parse(JSON.stringify(data))
  } catch {
    return data
  }
}

const api: POSAPI = {
  // Autenticación y Gestión de Usuarios
  getUsers: () => ipcRenderer.invoke('users:getUsers'),
  getAllUsers: () => ipcRenderer.invoke('users:getAll'),
  login: (data) => ipcRenderer.invoke('users:login', toPlain(data)),
  createUser: (data) => ipcRenderer.invoke('users:create', toPlain(data)),
  updateUser: (data) => ipcRenderer.invoke('users:update', toPlain(data)),
  toggleUserActive: (data) => ipcRenderer.invoke('users:toggleActive', toPlain(data)),

  // Productos
  getCategories: () => ipcRenderer.invoke('products:getCategories'),
  getProducts: (activeOnly) => ipcRenderer.invoke('products:getProducts', activeOnly),
  getModifierGroups: () => ipcRenderer.invoke('products:getModifierGroups'),
  createProduct: (data) => ipcRenderer.invoke('products:createProduct', toPlain(data)),
  updateProduct: (data) => ipcRenderer.invoke('products:updateProduct', toPlain(data)),
  toggleProductActive: (data) => ipcRenderer.invoke('products:toggleActive', toPlain(data)),

  // Mesas
  getTables: () => ipcRenderer.invoke('tables:getTables'),

  // Caja
  getActiveCashierSession: () => ipcRenderer.invoke('cashier:getActiveSession'),
  openCashierSession: (data) => ipcRenderer.invoke('cashier:openSession', toPlain(data)),
  closeCashierSession: (data) => ipcRenderer.invoke('cashier:closeSession', toPlain(data)),
  addCashMovement: (data) => ipcRenderer.invoke('cashier:addMovement', toPlain(data)),
  getCashMovements: (sessionId) => ipcRenderer.invoke('cashier:getMovements', sessionId),
  getCashierSessionTotals: (data) => ipcRenderer.invoke('cashier:getSessionTotals', toPlain(data)),

  // Órdenes y Venta
  getOrderById: (id) => ipcRenderer.invoke('orders:getOrderById', id),
  getActiveOrderByTable: (tableId) => ipcRenderer.invoke('orders:getActiveOrderByTable', tableId),
  createOrder: (data) => ipcRenderer.invoke('orders:createOrder', toPlain(data)),
  saveOrderItems: (data) => ipcRenderer.invoke('orders:saveItems', toPlain(data)),
  registerPaymentsAndClose: (data) => ipcRenderer.invoke('orders:registerPaymentsAndClose', toPlain(data)),
  getOrdersHistory: (limit) => ipcRenderer.invoke('orders:getOrdersHistory', limit),

  // Red y Servidor Móvil
  getNetworkInfo: () => ipcRenderer.invoke('server:getNetworkInfo'),

  // Sincronización en tiempo real
  onSync: (callback: (type: string) => void) => {
    const listener = (_: any, type: string) => callback(type)
    ipcRenderer.on('sync:change', listener)
    return () => {
      ipcRenderer.removeListener('sync:change', listener)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
