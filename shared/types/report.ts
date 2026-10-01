export interface SalesSummary {
  totalSales: number
  orderCount: number
  averageTicket: number
  cashPayments: number
  cardPayments: number
  yapePayments: number
  dineInSales: number
  takeoutSales: number
  dineInOrders: number
  takeoutOrders: number
}

export interface SalesTrendPoint {
  label: string
  total: number
  orders: number
}

export interface TopProductItem {
  productId: string
  productName: string
  categoryName: string
  quantity: number
  totalSales: number
  percentageOfTotal: number
}

export interface CategorySaleItem {
  categoryId: string
  categoryName: string
  totalSales: number
  itemCount: number
  percentageOfTotal: number
}

export interface CashierSessionAudit {
  id: string
  userId: string
  userName: string
  openingTime: string
  closingTime: string | null
  initialCash: number
  expectedCash: number
  actualCash: number
  difference: number
  notes: string | null
  status: 'Abierta' | 'Cerrada'
  cashPayments: number
  cardPayments: number
  yapePayments: number
  manualIncomes: number
  manualExpenses: number
  totalSales: number
  movements?: { type: string; amount: number; description: string; timestamp: string }[]
}

export interface StaffSaleItem {
  userId: string
  userName: string
  userRole: string
  orderCount: number
  totalSales: number
  averageTicket: number
}

export interface DetailedOrderExportItem {
  orderNumber: number
  tableNumber: string
  createdAt: string
  closedAt: string | null
  status: string
  cashierName: string
  totalAmount: number
  paymentMethods: string
  itemCount: number
  itemsSummary: string
}
