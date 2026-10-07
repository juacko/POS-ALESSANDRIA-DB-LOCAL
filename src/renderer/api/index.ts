import { POSAPI } from '../../preload/api'

// Deserializa y remueve proxies reactivos de Vue 3 para garantizar compatibilidad total con structuredClone de Electron IPC
function toPlain<T>(val: T): T {
  if (val === undefined || val === null) return val
  try {
    return JSON.parse(JSON.stringify(val))
  } catch {
    return val
  }
}

// Si window.api existe (estamos en la ventana Electron Desktop), usamos IPC nativo
// Si no existe (estamos en el navegador del celular o tablet conectado por Wi-Fi), usamos fetch HTTP
export const api: POSAPI = {
  // Autenticación y Gestión de Usuarios
  getUsers: async () => {
    if (window.api) return window.api.getUsers()
    const res = await fetch('/api/users')
    return res.json()
  },
  getAllUsers: async () => {
    if (window.api) return window.api.getAllUsers()
    return []
  },
  login: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.login(plainData)
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Credenciales incorrectas')
    }
    return res.json()
  },
  verifyAdminPin: async (data: { pin: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.verifyAdminPin(plainData)
    const res = await fetch('/api/users/verify-admin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'PIN incorrecto o sin privilegios de Administrador')
    }
    return res.json()
  },
  createUser: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createUser(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },
  updateUser: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateUser(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },
  toggleUserActive: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.toggleUserActive(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },

  // Productos y Categorías
  getCategories: async () => {
    if (window.api) return window.api.getCategories()
    const res = await fetch('/api/categories')
    return res.json()
  },
  createCategory: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createCategory(plainData)
    const res = await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al crear categoría')
    }
    return res.json()
  },
  updateCategory: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateCategory(plainData)
    const res = await fetch('/api/categories/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar categoría')
    }
    return res.json()
  },
  deleteCategory: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.deleteCategory(plainData)
    const res = await fetch('/api/categories/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar categoría')
    }
    const json = await res.json()
    return json.success
  },
  getProducts: async (activeOnly) => {
    if (window.api) return window.api.getProducts(activeOnly)
    const res = await fetch('/api/products')
    return res.json()
  },
  getModifierGroups: async () => {
    if (window.api) return window.api.getModifierGroups()
    const res = await fetch('/api/modifier-groups')
    return res.json()
  },
  createProduct: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createProduct(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },
  updateProduct: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateProduct(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },
  toggleProductActive: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.toggleProductActive(plainData)
    throw new Error('Solo permitido desde la aplicación principal')
  },

  // Modificadores y Variantes
  createModifierGroup: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createModifierGroup(plainData)
    const res = await fetch('/api/modifier-groups/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  updateModifierGroup: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateModifierGroup(plainData)
    const res = await fetch('/api/modifier-groups/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  deleteModifierGroup: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.deleteModifierGroup(plainData)
    const res = await fetch('/api/modifier-groups/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    const json = await res.json()
    return json.success
  },
  duplicateModifierGroup: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.duplicateModifierGroup(plainData)
    const res = await fetch('/api/modifier-groups/duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  createModifierOption: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createModifierOption(plainData)
    const res = await fetch('/api/modifiers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  updateModifierOption: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateModifierOption(plainData)
    const res = await fetch('/api/modifiers/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  setDefaultModifierOption: async (data: { groupId: string; optionId: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.setDefaultModifierOption(plainData)
    const res = await fetch('/api/modifiers/set-default', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    const json = await res.json()
    return json.success
  },
  deleteModifierOption: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.deleteModifierOption(plainData)
    const res = await fetch('/api/modifiers/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    const json = await res.json()
    return json.success
  },

  // Mesas
  getTables: async () => {
    if (window.api) return window.api.getTables()
    const res = await fetch('/api/tables')
    return res.json()
  },

  // Caja
  getActiveCashierSession: async () => {
    if (window.api) return window.api.getActiveCashierSession()
    const res = await fetch('/api/cashier/active-session')
    return res.json()
  },
  openCashierSession: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.openCashierSession(plainData)
    const res = await fetch('/api/cashier/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al abrir caja')
    }
    return res.json()
  },
  closeCashierSession: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.closeCashierSession(plainData)
    const res = await fetch('/api/cashier/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al cerrar caja')
    }
    return res.json()
  },
  addCashMovement: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.addCashMovement(plainData)
    const res = await fetch('/api/cashier/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al registrar movimiento')
    }
    return res.json()
  },
  getCashMovements: async (sessionId) => {
    if (window.api) return window.api.getCashMovements(sessionId)
    const res = await fetch(`/api/cashier/movements?sessionId=${sessionId}`)
    return res.json()
  },
  getCashierSessionTotals: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getCashierSessionTotals(plainData)
    const res = await fetch(`/api/cashier/session-totals?sessionId=${plainData.sessionId}&initialCash=${plainData.initialCash}`)
    return res.json()
  },

  // Órdenes y Venta
  getOrderById: async (id) => {
    if (window.api) return window.api.getOrderById(id)
    return null
  },
  getActiveOrderByTable: async (tableId) => {
    if (window.api) return window.api.getActiveOrderByTable(tableId)
    const res = await fetch(`/api/orders/table/${tableId}`)
    return res.json()
  },
  createOrder: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.createOrder(plainData)
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  saveOrderItems: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.saveOrderItems(plainData)
    const res = await fetch('/api/orders/save-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    return res.json()
  },
  registerPaymentsAndClose: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.registerPaymentsAndClose(plainData)
    const res = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al procesar pago')
    }
    return res.json()
  },
  getOrdersHistory: async (limit = 100) => {
    if (window.api) return window.api.getOrdersHistory(limit)
    const res = await fetch(`/api/orders/history?limit=${limit}`)
    return res.json()
  },
  getActiveOrders: async () => {
    if (window.api) return window.api.getActiveOrders()
    const res = await fetch('/api/orders/active')
    return res.json()
  },
  toggleItemServed: async (data: { itemId: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.toggleItemServed(plainData)
    const res = await fetch('/api/orders/toggle-item-served', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    const json = await res.json()
    return json.success
  },
  markAllOrderItemsServed: async (data: { orderId: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.markAllOrderItemsServed(plainData)
    const res = await fetch('/api/orders/mark-all-served', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    const json = await res.json()
    return json.success
  },
  cancelActiveOrder: async (data: { orderId: string; reason: string; userId?: string; userName?: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.cancelActiveOrder(plainData)
    const res = await fetch('/api/orders/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al anular el pedido')
    }
    return res.json()
  },
  deleteOrderItem: async (data: { orderId: string; itemId: string; reason: string; userId?: string; userName?: string; authorizedBy?: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.deleteOrderItem(plainData)
    const res = await fetch('/api/orders/delete-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar el producto')
    }
    return res.json()
  },
  updateOrderItemPrice: async (data: { orderId: string; itemId: string; newUnitPrice: number; reason: string; userId?: string; userName?: string; authorizedBy?: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateOrderItemPrice(plainData)
    const res = await fetch('/api/orders/update-item-price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar el precio')
    }
    return res.json()
  },
  updateOrderItemModifiers: async (data: { orderId: string; itemId: string; selectedModifiers: any[]; newUnitPrice?: number }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.updateOrderItemModifiers(plainData)
    const res = await fetch('/api/orders/update-item-modifiers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al actualizar los modificadores')
    }
    return res.json()
  },
  deleteOrderPayments: async (data: { orderId: string; reason: string; destinationStatus: 'Abierta' | 'Cancelada'; userId?: string; userName?: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.deleteOrderPayments(plainData)
    const res = await fetch('/api/orders/delete-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al eliminar pagos del pedido')
    }
    return res.json()
  },
  changeOrderPaymentMethod: async (data: { orderId: string; newPayments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]; reason: string; userId?: string; userName?: string }) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.changeOrderPaymentMethod(plainData)
    const res = await fetch('/api/orders/change-payment-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plainData)
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al cambiar método de pago')
    }
    return res.json()
  },

  // Red
  getNetworkInfo: async () => {
    if (window.api) return window.api.getNetworkInfo()
    const res = await fetch('/api/network-info')
    return res.json()
  },

  // Reportes y Analítica
  getReportsSalesSummary: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsSalesSummary(plainData)
    const res = await fetch(`/api/reports/sales-summary?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}`)
    return res.json()
  },
  getReportsSalesTrend: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsSalesTrend(plainData)
    const res = await fetch(`/api/reports/sales-trend?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}&groupBy=${data.groupBy || 'hour'}`)
    return res.json()
  },
  getReportsTopProducts: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsTopProducts(plainData)
    const url = `/api/reports/top-products?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}&limit=${data.limit || 15}${data.categoryId ? `&categoryId=${encodeURIComponent(data.categoryId)}` : ''}`
    const res = await fetch(url)
    return res.json()
  },
  getReportsCategorySales: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsCategorySales(plainData)
    const res = await fetch(`/api/reports/category-sales?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}`)
    return res.json()
  },
  getReportsCashierSessions: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsCashierSessions(plainData)
    const res = await fetch(`/api/reports/cashier-sessions?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}`)
    return res.json()
  },
  getReportsStaffSales: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsStaffSales(plainData)
    const res = await fetch(`/api/reports/staff-sales?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}`)
    return res.json()
  },
  getReportsExportData: async (data) => {
    const plainData = toPlain(data)
    if (window.api) return window.api.getReportsExportData(plainData)
    const res = await fetch(`/api/reports/export-data?startDate=${encodeURIComponent(data.startDate)}&endDate=${encodeURIComponent(data.endDate)}`)
    return res.json()
  }
}
