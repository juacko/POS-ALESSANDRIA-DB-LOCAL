import { ModifierOption } from './product'
import { Payment } from './cashier'

export type OrderStatus = 'Abierta' | 'Pagada' | 'Cancelada'

export interface SelectedModifier {
  group_id: string
  group_name: string
  modifier_id: string
  name: string
  price_adjustment: number
}

export interface OrderItem {
  id: string
  order_id?: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  final_price: number
  modifiers_detail: string // JSON stringified array of SelectedModifier or comments
  selected_modifiers?: SelectedModifier[]
  is_served?: number // 0 = pendiente, 1 = servido
}

export interface OrderAuditLog {
  id: string
  order_id: string
  action: 'CANCEL_ACTIVE_ORDER' | 'REVERT_PAYMENT' | 'CANCEL_PAID_ORDER' | 'CHANGE_PAYMENT_METHOD'
  reason: string
  user_id?: string
  user_name?: string
  details?: string
  timestamp: string
}

export interface Order {
  id: string
  order_number?: number
  table_id?: string | null
  table_number: string // "RAPIDO" o número de mesa
  cashier_session_id?: string
  user_id?: string
  user_name?: string
  status: OrderStatus
  total_amount: number
  cancellation_reason?: string | null
  cancelled_at?: string | null
  cancelled_by?: string | null
  created_at?: string
  closed_at?: string | null
  items?: OrderItem[]
  payments?: Payment[]
  audit_logs?: OrderAuditLog[]
}
