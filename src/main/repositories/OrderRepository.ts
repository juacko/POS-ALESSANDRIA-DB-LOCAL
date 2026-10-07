import { getDatabase } from '../database/connection'
import { Order, OrderItem, OrderAuditLog } from '@shared/types/order'
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

    let auditLogs: OrderAuditLog[] = []
    try {
      auditLogs = db.prepare('SELECT * FROM order_audit_logs WHERE order_id = ? ORDER BY timestamp DESC').all(id) as OrderAuditLog[]
    } catch {
      // Si la tabla aún no fue creada
    }

    return {
      ...order,
      items: parsedItems,
      payments,
      audit_logs: auditLogs
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

    // Marcar orden como Pagada y vincular a la sesión de caja
    db.prepare(`
      UPDATE orders 
      SET status = 'Pagada', 
          closed_at = CURRENT_TIMESTAMP,
          cashier_session_id = COALESCE(cashier_session_id, ?) 
      WHERE id = ?
    `).run(sessionId, orderId)

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

  /**
   * Anula un pedido activo (Abierta) registrando el motivo obligatorio
   */
  static cancelActiveOrder(orderId: string, reason: string, userId?: string, userName?: string): Order {
    const db = getDatabase()
    const order = this.getOrderById(orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Abierta') throw new Error('Solo se pueden anular pedidos que se encuentren activos (Abiertos)')

    const trimmedReason = reason?.trim()
    if (!trimmedReason) throw new Error('El motivo de anulación es obligatorio')

    // Actualizar estado de la orden
    db.prepare(`
      UPDATE orders 
      SET status = 'Cancelada', 
          cancellation_reason = ?, 
          cancelled_at = CURRENT_TIMESTAMP, 
          cancelled_by = ? 
      WHERE id = ?
    `).run(trimmedReason, userName || userId || 'Personal', orderId)

    // Si pertenecía a una mesa, liberar la mesa si no hay otras órdenes abiertas
    if (order.table_id) {
      const otherActive = db.prepare(`
        SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status = 'Abierta' AND id != ?
      `).get(order.table_id, orderId) as { count: number }

      if (otherActive.count === 0) {
        TableRepository.updateTableStatus(order.table_id, 'Disponible')
      }
    }

    // Registrar en auditoría
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    try {
      db.prepare(`
        INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
        VALUES (?, ?, 'CANCEL_ACTIVE_ORDER', ?, ?, ?, ?)
      `).run(
        logId,
        orderId,
        trimmedReason,
        userId || null,
        userName || 'Personal',
        JSON.stringify({ total_amount: order.total_amount, table: order.table_number, itemsCount: order.items?.length || 0 })
      )
    } catch (e) {
      console.error('[OrderRepository] Error al registrar log de auditoría:', e)
    }

    return this.getOrderById(orderId)!
  }

  /**
   * Elimina/revierte los pagos de una orden pagada registrando el motivo obligatorio
   * Permite reabrir la orden a 'Abierta' o cancelarla definitivamente a 'Cancelada'
   */
  static deleteOrderPayments(
    orderId: string,
    reason: string,
    destinationStatus: 'Abierta' | 'Cancelada',
    userId?: string,
    userName?: string
  ): Order {
    const db = getDatabase()
    const order = this.getOrderById(orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Pagada') throw new Error('Solo se pueden eliminar o revertir pagos de órdenes pagadas')

    const trimmedReason = reason?.trim()
    if (!trimmedReason) throw new Error('El motivo de eliminación de pago es obligatorio')

    const currentPayments = order.payments || []

    // Eliminar pagos registrados en la tabla payments
    db.prepare('DELETE FROM payments WHERE order_id = ?').run(orderId)

    if (destinationStatus === 'Abierta') {
      // Reabrir orden: vuelve a estar activa
      db.prepare(`
        UPDATE orders 
        SET status = 'Abierta', 
            closed_at = NULL,
            cancellation_reason = NULL,
            cancelled_at = NULL,
            cancelled_by = NULL
        WHERE id = ?
      `).run(orderId)

      // Si tiene mesa asignada, volver a marcar mesa como Ocupada
      if (order.table_id) {
        TableRepository.updateTableStatus(order.table_id, 'Ocupada')
      }

      // Registrar en auditoría
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      try {
        db.prepare(`
          INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
          VALUES (?, ?, 'REVERT_PAYMENT', ?, ?, ?, ?)
        `).run(
          logId,
          orderId,
          trimmedReason,
          userId || null,
          userName || 'Personal',
          JSON.stringify({ removedPayments: currentPayments, destination: 'Abierta' })
        )
      } catch (e) {
        console.error('[OrderRepository] Error al registrar log de auditoría:', e)
      }
    } else {
      // Cancelar orden definitivamente
      db.prepare(`
        UPDATE orders 
        SET status = 'Cancelada', 
            cancellation_reason = ?, 
            cancelled_at = CURRENT_TIMESTAMP, 
            cancelled_by = ? 
        WHERE id = ?
      `).run(trimmedReason, userName || userId || 'Personal', orderId)

      // Si la mesa estaba ocupada, verificar y liberar
      if (order.table_id) {
        const otherActive = db.prepare(`
          SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status = 'Abierta' AND id != ?
        `).get(order.table_id, orderId) as { count: number }

        if (otherActive.count === 0) {
          TableRepository.updateTableStatus(order.table_id, 'Disponible')
        }
      }

      // Registrar en auditoría
      const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      try {
        db.prepare(`
          INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
          VALUES (?, ?, 'CANCEL_PAID_ORDER', ?, ?, ?, ?)
        `).run(
          logId,
          orderId,
          trimmedReason,
          userId || null,
          userName || 'Personal',
          JSON.stringify({ removedPayments: currentPayments, destination: 'Cancelada' })
        )
      } catch (e) {
        console.error('[OrderRepository] Error al registrar log de auditoría:', e)
      }
    }

    return this.getOrderById(orderId)!
  }

  /**
   * Cambia los métodos de pago de una orden pagada registrando el motivo obligatorio
   */
  static changeOrderPaymentMethod(
    orderId: string,
    newPayments: { method: 'Efectivo' | 'Tarjeta' | 'Yape/Plin'; amount: number }[],
    reason: string,
    userId?: string,
    userName?: string
  ): Order {
    const db = getDatabase()
    const order = this.getOrderById(orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Pagada') throw new Error('Solo se puede modificar el método de pago de órdenes pagadas')

    const trimmedReason = reason?.trim()
    if (!trimmedReason) throw new Error('El motivo de modificación de pago es obligatorio')

    if (!newPayments || newPayments.length === 0) {
      throw new Error('Debe especificar al menos un método de pago')
    }

    const newTotal = newPayments.reduce((sum, p) => sum + p.amount, 0)
    if (Math.abs(newTotal - order.total_amount) > 0.05) {
      throw new Error(`La suma de los pagos (S/. ${newTotal.toFixed(2)}) no coincide con el total de la orden (S/. ${order.total_amount.toFixed(2)})`)
    }

    const oldPayments = order.payments || []
    const existingSessionId = oldPayments[0]?.session_id || order.cashier_session_id

    // Eliminar pagos anteriores
    db.prepare('DELETE FROM payments WHERE order_id = ?').run(orderId)

    // Insertar nuevos pagos
    const insertPayment = db.prepare(`
      INSERT INTO payments (id, order_id, session_id, payment_method, amount)
      VALUES (?, ?, ?, ?, ?)
    `)

    for (const p of newPayments) {
      const pId = `pay-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      insertPayment.run(pId, orderId, existingSessionId, p.method, p.amount)
    }

    // Registrar en auditoría
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    try {
      db.prepare(`
        INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
        VALUES (?, ?, 'CHANGE_PAYMENT_METHOD', ?, ?, ?, ?)
      `).run(
        logId,
        orderId,
        trimmedReason,
        userId || null,
        userName || 'Personal',
        JSON.stringify({ previousPayments: oldPayments, newPayments })
      )
    } catch (e) {
      console.error('[OrderRepository] Error al registrar log de auditoría:', e)
    }

    return this.getOrderById(orderId)!
  }

  /**
   * Elimina un producto específico de un pedido activo (Abierta) registrando motivo y auditoría
   */
  static deleteOrderItem(data: {
    orderId: string
    itemId: string
    reason: string
    userId?: string
    userName?: string
    authorizedBy?: string
  }): Order {
    const db = getDatabase()
    const order = this.getOrderById(data.orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Abierta') throw new Error('Solo se pueden eliminar ítems de pedidos activos (Abiertos)')

    const trimmedReason = data.reason?.trim()
    if (!trimmedReason) throw new Error('El motivo de eliminación del producto es obligatorio')

    const itemToDelete = order.items?.find(i => i.id === data.itemId)
    if (!itemToDelete) throw new Error('El producto no existe en esta comanda')

    // Eliminar el ítem
    db.prepare('DELETE FROM order_items WHERE id = ? AND order_id = ?').run(data.itemId, data.orderId)

    // Recalcular ítems restantes y total
    const remainingItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(data.orderId) as OrderItem[]
    const newTotal = remainingItems.reduce((sum, it) => sum + it.final_price, 0)

    if (remainingItems.length === 0) {
      // Si ya no quedan productos, anular la comanda y liberar mesa
      db.prepare(`
        UPDATE orders 
        SET status = 'Cancelada', 
            total_amount = 0,
            cancellation_reason = ?, 
            cancelled_at = CURRENT_TIMESTAMP, 
            cancelled_by = ? 
        WHERE id = ?
      `).run(`Todos los ítems fueron eliminados: ${trimmedReason}`, data.userName || data.userId || 'Personal', data.orderId)

      if (order.table_id) {
        const otherActive = db.prepare(`
          SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND status = 'Abierta' AND id != ?
        `).get(order.table_id, data.orderId) as { count: number }

        if (otherActive.count === 0) {
          TableRepository.updateTableStatus(order.table_id, 'Disponible')
        }
      }
    } else {
      // Actualizar monto total de la orden
      db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(newTotal, data.orderId)
    }

    // Registrar en auditoría
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    try {
      db.prepare(`
        INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
        VALUES (?, ?, 'DELETE_ORDER_ITEM', ?, ?, ?, ?)
      `).run(
        logId,
        data.orderId,
        trimmedReason,
        data.userId || null,
        data.userName || 'Personal',
        JSON.stringify({
          deletedItem: {
            id: itemToDelete.id,
            name: itemToDelete.product_name,
            quantity: itemToDelete.quantity,
            unit_price: itemToDelete.unit_price,
            final_price: itemToDelete.final_price,
            modifiers: itemToDelete.selected_modifiers || []
          },
          authorizedBy: data.authorizedBy || data.userName || 'Administrador',
          previousTotal: order.total_amount,
          newTotal
        })
      )
    } catch (e) {
      console.error('[OrderRepository] Error al registrar log de auditoría:', e)
    }

    return this.getOrderById(data.orderId)!
  }

  /**
   * Modifica el precio de un ítem en una orden activa (descuento / cortesía / precio libre)
   */
  static updateOrderItemPrice(data: {
    orderId: string
    itemId: string
    newUnitPrice: number
    reason: string
    userId?: string
    userName?: string
    authorizedBy?: string
  }): Order {
    const db = getDatabase()
    const order = this.getOrderById(data.orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Abierta') throw new Error('Solo se puede modificar el precio de pedidos activos (Abiertos)')

    const trimmedReason = data.reason?.trim()
    if (!trimmedReason) throw new Error('El motivo de modificación de precio es obligatorio')

    if (data.newUnitPrice < 0) {
      throw new Error('El precio unitario no puede ser negativo')
    }

    const itemToUpdate = order.items?.find(i => i.id === data.itemId)
    if (!itemToUpdate) throw new Error('El producto no existe en esta comanda')

    const newFinalPrice = data.newUnitPrice * itemToUpdate.quantity

    // Actualizar precio en order_items
    db.prepare(`
      UPDATE order_items
      SET unit_price = ?, final_price = ?
      WHERE id = ? AND order_id = ?
    `).run(data.newUnitPrice, newFinalPrice, data.itemId, data.orderId)

    // Recalcular total de la orden
    const remainingItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(data.orderId) as OrderItem[]
    const newTotal = remainingItems.reduce((sum, it) => sum + it.final_price, 0)
    db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(newTotal, data.orderId)

    // Registrar en auditoría
    const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    try {
      db.prepare(`
        INSERT INTO order_audit_logs (id, order_id, action, reason, user_id, user_name, details)
        VALUES (?, ?, 'CHANGE_ITEM_PRICE', ?, ?, ?, ?)
      `).run(
        logId,
        data.orderId,
        trimmedReason,
        data.userId || null,
        data.userName || 'Personal',
        JSON.stringify({
          itemId: itemToUpdate.id,
          productName: itemToUpdate.product_name,
          quantity: itemToUpdate.quantity,
          oldUnitPrice: itemToUpdate.unit_price,
          newUnitPrice: data.newUnitPrice,
          oldFinalPrice: itemToUpdate.final_price,
          newFinalPrice,
          priceDifference: newFinalPrice - itemToUpdate.final_price,
          authorizedBy: data.authorizedBy || data.userName || 'Administrador',
          previousTotal: order.total_amount,
          newTotal
        })
      )
    } catch (e) {
      console.error('[OrderRepository] Error al registrar log de auditoría:', e)
    }

    return this.getOrderById(data.orderId)!
  }

  /**
   * Actualiza modificadores / sabores de un ítem en una orden activa
   */
  static updateOrderItemModifiers(data: {
    orderId: string
    itemId: string
    selectedModifiers: any[]
    newUnitPrice?: number
  }): Order {
    const db = getDatabase()
    const order = this.getOrderById(data.orderId)
    if (!order) throw new Error('Orden no encontrada')
    if (order.status !== 'Abierta') throw new Error('Solo se pueden editar variantes de pedidos activos')

    const item = order.items?.find(i => i.id === data.itemId)
    if (!item) throw new Error('Ítem no encontrado')

    const modifiersDetail = JSON.stringify(data.selectedModifiers || [])
    const unitPrice = data.newUnitPrice !== undefined ? data.newUnitPrice : item.unit_price
    const finalPrice = unitPrice * item.quantity

    db.prepare(`
      UPDATE order_items 
      SET modifiers_detail = ?, unit_price = ?, final_price = ?
      WHERE id = ? AND order_id = ?
    `).run(modifiersDetail, unitPrice, finalPrice, data.itemId, data.orderId)

    // Recalcular total de la orden
    const remainingItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(data.orderId) as OrderItem[]
    const newTotal = remainingItems.reduce((sum, it) => sum + it.final_price, 0)
    db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(newTotal, data.orderId)

    return this.getOrderById(data.orderId)!
  }
}

