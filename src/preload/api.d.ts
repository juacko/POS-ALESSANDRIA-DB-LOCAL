import { Product, Category, ModifierGroup, ModifierOption, ProductModifierGroupConfig } from '@shared/types/product'
import { Table } from '@shared/types/table'
import { CashierSession, CashMovement } from '@shared/types/cashier'
import { Order, OrderItem } from '@shared/types/order'
import { User, UserRole } from '@shared/types/user'
import {
  SalesSummary,
  SalesTrendPoint,
  TopProductItem,
  CategorySaleItem,
  CashierSessionAudit,
  StaffSaleItem,
  DetailedOrderExportItem
} from '@shared/types/report'

export interface NetworkInterfaceItem {
  name: string
  ip: string
  isDefault: boolean
}

export interface NetworkInfoResponse {
  ip: string
  port: number
  url: string
  interfaces: NetworkInterfaceItem[]
}

export interface POSAPI {
  // Autenticación y Gestión de Usuarios
  getUsers: () => Promise<User[]>
  getAllUsers: () => Promise<User[]>
  login: (data: { username: string; pin: string }) => Promise<User>
  verifyAdminPin: (data: { pin: string }) => Promise<User>
  createUser: (data: { username: string; fullName: string; role: UserRole; pin: string }) => Promise<User>
  updateUser: (data: { id: string; fullName: string; role: UserRole; pin?: string }) => Promise<User>
  toggleUserActive: (data: { id: string; active: number }) => Promise<boolean>

  // Categorías y Productos
  getCategories: () => Promise<Category[]>
  createCategory: (data: { name: string; display_order?: number }) => Promise<Category>
  updateCategory: (data: { id: string; name: string; display_order?: number }) => Promise<Category>
  deleteCategory: (data: { id: string }) => Promise<boolean>
  getProducts: (activeOnly?: boolean) => Promise<Product[]>
  getModifierGroups: () => Promise<ModifierGroup[]>
  createProduct: (data: { product: Partial<Product>; modifierGroups: (string | ProductModifierGroupConfig)[] }) => Promise<Product>
  updateProduct: (data: { id: string; product: Partial<Product>; modifierGroups?: (string | ProductModifierGroupConfig)[] }) => Promise<Product>
  toggleProductActive: (data: { id: string; active: number }) => Promise<boolean>

  // Modificadores y Variantes
  createModifierGroup: (data: { name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) => Promise<ModifierGroup>
  updateModifierGroup: (data: { id: string; name: string; selection_mode: 'single' | 'multiple_unlimited' | 'multiple_limited'; selection_limit?: number }) => Promise<ModifierGroup>
  deleteModifierGroup: (data: { id: string }) => Promise<boolean>
  duplicateModifierGroup: (data: { id: string; name?: string }) => Promise<ModifierGroup>
  createModifierOption: (data: { group_id: string; name: string; price_adjustment: number; is_default?: number }) => Promise<ModifierOption>
  updateModifierOption: (data: { id: string; name: string; price_adjustment: number; is_default?: number }) => Promise<ModifierOption>
  setDefaultModifierOption: (data: { groupId: string; optionId: string }) => Promise<boolean>
  deleteModifierOption: (data: { id: string }) => Promise<boolean>

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
  getActiveOrders: () => Promise<Order[]>
  toggleItemServed: (data: { itemId: string }) => Promise<boolean>
  markAllOrderItemsServed: (data: { orderId: string }) => Promise<boolean>
  cancelActiveOrder: (data: { orderId: string; reason: string; userId?: string; userName?: string }) => Promise<Order>
  deleteOrderItem: (data: { orderId: string; itemId: string; reason: string; userId?: string; userName?: string; authorizedBy?: string }) => Promise<Order>
  updateOrderItemPrice: (data: { orderId: string; itemId: string; newUnitPrice: number; reason: string; userId?: string; userName?: string; authorizedBy?: string }) => Promise<Order>
  updateOrderItemModifiers: (data: { orderId: string; itemId: string; selectedModifiers: any[]; newUnitPrice?: number }) => Promise<Order>
  deleteOrderPayments: (data: { orderId: string; reason: string; destinationStatus: 'Abierta' | 'Cancelada'; userId?: string; userName?: string }) => Promise<Order>
  changeOrderPaymentMethod: (data: { orderId: string; newPayments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]; reason: string; userId?: string; userName?: string }) => Promise<Order>

  // Red y Servidor Móvil
  getNetworkInfo: () => Promise<NetworkInfoResponse>

  // Reportes y Analítica
  getReportsSalesSummary: (data: { startDate: string; endDate: string }) => Promise<SalesSummary>
  getReportsSalesTrend: (data: { startDate: string; endDate: string; groupBy?: 'hour' | 'day' }) => Promise<SalesTrendPoint[]>
  getReportsTopProducts: (data: { startDate: string; endDate: string; limit?: number; categoryId?: string }) => Promise<TopProductItem[]>
  getReportsCategorySales: (data: { startDate: string; endDate: string }) => Promise<CategorySaleItem[]>
  getReportsCashierSessions: (data: { startDate: string; endDate: string }) => Promise<CashierSessionAudit[]>
  getReportsStaffSales: (data: { startDate: string; endDate: string }) => Promise<StaffSaleItem[]>
  getReportsExportData: (data: { startDate: string; endDate: string }) => Promise<DetailedOrderExportItem[]>

  // Eventos de Sincronización en Tiempo Real
  onSync?: (callback: (type: string) => void) => () => void
}

declare global {
  interface Window {
    api: POSAPI
  }
}
