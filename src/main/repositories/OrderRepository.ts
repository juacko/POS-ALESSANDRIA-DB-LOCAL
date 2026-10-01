import { getDatabase } from '../database/connection'
import { Order, OrderItem } from '@shared/types/order'
import { Payment } from '@shared/types/cashier'
import { TableRepository } from './TableRepository'

export class OrderRepository {
  static getOrderById(id: string): Order | null {
    const db = getDatabase()
    const order = db.prepare(`
      SELECT o.*, u.full_name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id) as Order | undefined
    if (!order) return null

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id) as OrderItem[]
    const parsedItems = items.map(item => ({
      ...item,
      selected_modifiers: item.modifiers_detail ? JSON.parse(item.modifiers_detail) : []
    }))

    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(id) as Payment[]

    return {
      ...order,
      items: parsedItems,
      payments
    }
  }

  static getActiveOrderByTable(tableId: string): Order | null {
    const db = getDatabase()
    const order = db.prepare(`
      SELECT id FROM orders 
      WHERE table_id = ? AND status = 'Abierta' 
      ORDER BY created_at DESC LIMIT 1
    `).get(tableId) as { id: string } | undefined

    if (!order) return null
    return this.getOrderById(order.id)
  }

  static getActiveOrders(): Order[] {
    const db = getDatabase()
    const orders = db.prepare(`
      SELECT id FROM orders 
      WHERE status = 'Abierta' 
      ORDER BY created_at ASC
    `).all() as { id: string }[]

    return orders.map(o => this.getOrderById(o.id)!).filter(Boolean)
  }

  static createOrder(
    tableId: string | null,
    tableNumber: string,
    userId: string,
    sessionId: string,
    items: Partial<OrderItem>[]
  ): Order {
    const db = getDatabase()

    // Obtener siguiente correlativo de orden
    const lastOrder = db.prepare('SELECT MAX(order_number) as last_num FROM orders').get() as { last_num: number | null }
    const orderNumber = (lastOrder?.last_num || 0) + 1

    const orderId = `ord-${Date.now()}`

    // Insertar orden principal
    db.prepare(`
      INSERT INTO orders (id, order_number, table_id, table_number, cashier_session_id, user_id, status, total_amount)
      VALUES (?, ?, ?, ?, ?, ?, 'Abierta', 0)
    `).run(orderId, orderNumber, tableId, tableNumber, sessionId, userId)

    // Si es una mesa física, marcar como ocupada
    if (tableId) {
      TableRepository.updateTableStatus(tableId, 'Ocupada')
    }

    // Agregar ítems
    this.saveOrderItems(orderId, items)

    return this.getOrderById(orderId)!
  }

  static saveOrderItems(orderId: string, items: Partial<OrderItem>[]): void {
    const db = getDatabase()

    // Eliminar ítems existentes de la orden para reemplazo atómico
    db.prepare('DELETE FROM order_items WHERE order_id = ?').run(orderId)

    let totalAmount = 0
    const insertItem = db.prepare(`
      INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, final_price, modifiers_detail, is_served)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const item of items) {
      const itemId = item.id || `item-${Math.random().toString(36).substr(2, 9)}`
      const modifiersDetail = item.selected_modifiers ? JSON.stringify(item.selected_modifiers) : (item.modifiers_detail || '')
      const finalPrice = item.final_price ?? (item.unit_price! * item.quantity!)
      const isServed = item.is_served ? 1 : 0
      
      insertItem.run(
        itemId,
        orderId,
        item.product_id,
        item.product_name,
        item.quantity,
        item.unit_price,
        finalPrice,
        modifiersDetail,
        isServed
      )

      totalAmount += finalPrice
    }

    // Actualizar total_amount de la orden
    db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId)
  }

  static toggleItemServed(itemId: string): boolean {
    const db = getDatabase()
    const item = db.prepare('SELECT is_served FROM order_items WHERE id = ?').get(itemId) as { is_served: number } | undefined
    if (!item) return false
    const nextVal = item.is_served === 1 ? 0 : 1
    const res = db.prepare('UPDATE order_items SET is_served = ? WHERE id = ?').run(nextVal, itemId)
    return res.changes > 0
  }

  static markAllOrderItemsServed(orderId: string): boolean {
    const db = getDatabase()
    const res = db.prepare('UPDATE order_items SET is_served = 1 WHERE order_id = ?').run(orderId)
    return res.changes > 0
  }

  static registerPaymentsAndClose(
    orderId: string,
    sessionId: string,
    payments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[]
  ): Order {
    const db = getDatabase()
    const order = this.getOrderById(orderId)
    if (!order) throw new Error('Orden no encontrada')

    const insertPayment = db.prepare(`
      INSERT INTO payments (id, order_id, session_id, payment_method, amount)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const p of payments) {
      const pId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      insertPayment.run(pId, orderId, sessionId, p.method, p.amount)
    }

    // Marcar orden como Pagada
    db.prepare(`
      UPDATE orders SET status = 'Pagada', closed_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(orderId)

    // Si la orden pertenecía a una mesa, liberar la mesa si no hay más órdenes abiertas
    if (order.table_id) {
      const otherActive = db.prepare(`
        SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status = 'Abierta' AND id != ?
      `).get(order.table_id, orderId) as { count: number }

      if (otherActive.count === 0) {
        TableRepository.updateTableStatus(order.table_id, 'Disponible')
      }
    }

    return this.getOrderById(orderId)!
  }

  static getOrdersHistory(limit = 100): Order[] {
    const db = getDatabase()
    const orders = db.prepare(`
      SELECT id FROM orders ORDER BY created_at DESC LIMIT ?
    `).all(limit) as { id: string }[]

    return orders.map(o => this.getOrderById(o.id)!).filter(Boolean)
  }
}
