import { getDatabase } from '../database/connection'
import { Table } from '@shared/types/table'

export class TableRepository {
  static getTables(): Table[] {
    const db = getDatabase()
    const tables = db.prepare('SELECT * FROM tables ORDER BY zone ASC, name ASC').all() as Table[]

    return tables.map(table => {
      // Buscar orden activa para la mesa
      const activeOrder = db.prepare(`
        SELECT id, total_amount 
        FROM orders 
        WHERE table_id = ? AND status = 'Abierta'
        ORDER BY created_at DESC LIMIT 1
      `).get(table.id) as { id: string; total_amount: number } | undefined

      if (activeOrder) {
        // Contar ítems activos
        const itemStats = db.prepare(`
          SELECT SUM(quantity) as items_count 
          FROM order_items 
          WHERE order_id = ?
        `).get(activeOrder.id) as { items_count: number | null }

        return {
          ...table,
          status: 'Ocupada',
          active_order_id: activeOrder.id,
          total_amount: activeOrder.total_amount || 0,
          items_count: itemStats?.items_count || 0
        }
      }

      return {
        ...table,
        status: 'Disponible',
        total_amount: 0,
        items_count: 0
      }
    })
  }

  static updateTableStatus(tableId: string, status: 'Disponible' | 'Ocupada'): boolean {
    const db = getDatabase()
    const res = db.prepare('UPDATE tables SET status = ? WHERE id = ?').run(status, tableId)
    return res.changes > 0
  }
}
