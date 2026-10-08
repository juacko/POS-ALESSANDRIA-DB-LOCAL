export type CashierSessionStatus = 'Abierta' | 'Cerrada'
export type CashMovementType = 'Ingreso' | 'Egreso'
export type PaymentMethod = 'Efectivo' | 'Tarjeta' | 'Yape/Plin'

export interface CashierSession {
  id: string
  user_id: string
  user_name?: string
  opening_time: string
  closing_time?: string | null
  initial_cash: number
  expected_cash: number
  actual_cash: number
  notes?: string | null
  status: CashierSessionStatus
}

export interface CashMovement {
  id: string
  session_id: string
  type: CashMovementType
  amount: number
  description: string
  timestamp: string
}

export interface Payment {
  id: string
  order_id: string
  session_id: string
  payment_method: PaymentMethod
  amount: number
  timestamp: string
}

export interface CashierSessionTotals {
  initialCash: number
  cashPayments: number
  cardPayments: number
  yapePayments: number
  cashPaymentsCount: number
  cardPaymentsCount: number
  yapePaymentsCount: number
  manualIncomes: number
  manualExpenses: number
  expected_cash: number
  totalSales: number
  orderCount: number
  averageTicket: number
  dineInSales: number
  takeoutSales: number
  dineInOrders: number
  takeoutOrders: number
  openOrdersCount: number
  openOrdersTotal: number
}

