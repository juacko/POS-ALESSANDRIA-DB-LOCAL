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

  // Productos
  getCategories: async () => {
    if (window.api) return window.api.getCategories()
    const res = await fetch('/api/categories')
    return res.json()
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
  getOrdersHistory: async (limit = 50) => {
    if (window.api) return window.api.getOrdersHistory(limit)
    const res = await fetch(`/api/orders/history?limit=${limit}`)
    return res.json()
  },

  // Red
  getNetworkInfo: async () => {
    if (window.api) return window.api.getNetworkInfo()
    const res = await fetch('/api/network-info')
    return res.json()
  }
}
