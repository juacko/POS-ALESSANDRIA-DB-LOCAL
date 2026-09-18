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
}

export interface Order {
  id: string
  order_number?: number
  table_id?: string | null
  table_number: string // "RAPIDO" o número de mesa
  cashier_session_id?: string
  user_id?: string
  status: OrderStatus
  total_amount: number
  created_at?: string
  closed_at?: string | null
  items?: OrderItem[]
  payments?: Payment[]
}
