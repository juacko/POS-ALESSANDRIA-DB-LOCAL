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

  // Modificadores y Variantes
  createModifierGroup: (data) => ipcRenderer.invoke('products:createModifierGroup', toPlain(data)),
  updateModifierGroup: (data) => ipcRenderer.invoke('products:updateModifierGroup', toPlain(data)),
  deleteModifierGroup: (data) => ipcRenderer.invoke('products:deleteModifierGroup', toPlain(data)),
  duplicateModifierGroup: (data) => ipcRenderer.invoke('products:duplicateModifierGroup', toPlain(data)),
  createModifierOption: (data) => ipcRenderer.invoke('products:createModifierOption', toPlain(data)),
  updateModifierOption: (data) => ipcRenderer.invoke('products:updateModifierOption', toPlain(data)),
  setDefaultModifierOption: (data) => ipcRenderer.invoke('products:setDefaultModifierOption', toPlain(data)),
  deleteModifierOption: (data) => ipcRenderer.invoke('products:deleteModifierOption', toPlain(data)),

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
  getActiveOrders: () => ipcRenderer.invoke('orders:getActiveOrders'),
  toggleItemServed: (data) => ipcRenderer.invoke('orders:toggleItemServed', toPlain(data)),
  markAllOrderItemsServed: (data) => ipcRenderer.invoke('orders:markAllServed', toPlain(data)),

  // Red y Servidor Móvil
  getNetworkInfo: () => ipcRenderer.invoke('server:getNetworkInfo'),

  // Reportes y Analítica
  getReportsSalesSummary: (data) => ipcRenderer.invoke('reports:getSalesSummary', toPlain(data)),
  getReportsSalesTrend: (data) => ipcRenderer.invoke('reports:getSalesTrend', toPlain(data)),
  getReportsTopProducts: (data) => ipcRenderer.invoke('reports:getTopProducts', toPlain(data)),
  getReportsCategorySales: (data) => ipcRenderer.invoke('reports:getCategorySales', toPlain(data)),
  getReportsCashierSessions: (data) => ipcRenderer.invoke('reports:getCashierSessions', toPlain(data)),
  getReportsStaffSales: (data) => ipcRenderer.invoke('reports:getStaffSales', toPlain(data)),
  getReportsExportData: (data) => ipcRenderer.invoke('reports:getExportData', toPlain(data)),

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
