import { Product, Category, ModifierGroup } from '@shared/types/product'
import { Table } from '@shared/types/table'
import { CashierSession, CashMovement } from '@shared/types/cashier'
import { Order, OrderItem } from '@shared/types/order'
import { User, UserRole } from '@shared/types/user'

export interface POSAPI {
  // Autenticación y Gestión de Usuarios
  getUsers: () => Promise<User[]>
  getAllUsers: () => Promise<User[]>
  login: (data: { username: string; pin: string }) => Promise<User>
  createUser: (data: { username: string; fullName: string; role: UserRole; pin: string }) => Promise<User>
  updateUser: (data: { id: string; fullName: string; role: UserRole; pin?: string }) => Promise<User>
  toggleUserActive: (data: { id: string; active: number }) => Promise<boolean>

  // Productos
  getCategories: () => Promise<Category[]>
  getProducts: (activeOnly?: boolean) => Promise<Product[]>
  getModifierGroups: () => Promise<ModifierGroup[]>
  createProduct: (data: { product: Partial<Product>; modifierGroupIds: string[] }) => Promise<Product>
  updateProduct: (data: { id: string; product: Partial<Product>; modifierGroupIds?: string[] }) => Promise<Product>
  toggleProductActive: (data: { id: string; active: number }) => Promise<boolean>

  // Mesas
  getTables: () => Promise<Table[]>

  // Caja
  getActiveCashierSession: () => Promise<CashierSession | null>
  openCashierSession: (data: { userId: string; initialCash: number }) => Promise<CashierSession>
  closeCashierSession: (data: { sessionId: string; actualCash: number; notes?: string }) => Promise<CashierSession>
  addCashMovement: (data: { sessionId: string; type: 'Ingreso' | 'Egreso'; amount: number; description: string }) => Promise<CashMovement>
  getCashMovements: (sessionId: string) => Promise<CashMovement[]>
  getCashierSessionTotals: (data: { sessionId: string; initialCash: number }) => Promise<any>

  // Órdenes y Venta
  getOrderById: (id: string) => Promise<Order | null>
  getActiveOrderByTable: (tableId: string) => Promise<Order | null>
  createOrder: (data: {
    tableId: string | null
    tableNumber: string
    userId: string
    sessionId: string
    items: Partial<OrderItem>[]
  }) => Promise<Order>
  saveOrderItems: (data: { orderId: string; items: Partial<OrderItem>[] }) => Promise<Order>
  registerPaymentsAndClose: (data: {
    orderId: string
    sessionId: string
    payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]
  }) => Promise<Order>
  getOrdersHistory: (limit?: number) => Promise<Order[]>

  // Red y Servidor Móvil
  getNetworkInfo: () => Promise<{ ip: string; port: number; url: string }>

  // Eventos de Sincronización en Tiempo Real
  onSync?: (callback: (type: string) => void) => () => void
}

declare global {
  interface Window {
    api: POSAPI
  }
}
