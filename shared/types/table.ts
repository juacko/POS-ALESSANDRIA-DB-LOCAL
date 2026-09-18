export type TableStatus = 'Disponible' | 'Ocupada'

export interface Table {
  id: string
  name: string
  zone: string
  status: TableStatus
  // Propiedades calculadas en tiempo real para el Grid
  active_order_id?: string
  total_amount?: number
  items_count?: number
}
