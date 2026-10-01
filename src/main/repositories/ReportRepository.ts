import { getDatabase } from '../database/connection'
import {
  SalesSummary,
  SalesTrendPoint,
  TopProductItem,
  CategorySaleItem,
  CashierSessionAudit,
  StaffSaleItem,
  DetailedOrderExportItem
} from '@shared/types/report'

export class ReportRepository {
  /**
   * Resumen general de ventas en el período
   */
  static getSalesSummary(startDate: string, endDate: string): SalesSummary {
    const db = getDatabase()

    // Órdenes pagadas dentro del rango
    const summaryRow = db.prepare(`
      SELECT 
        COUNT(*) as orderCount,
        COALESCE(SUM(total_amount), 0) as totalSales,
        COALESCE(SUM(CASE WHEN table_number = 'RAPIDO' THEN total_amount ELSE 0 END), 0) as takeoutSales,
        COALESCE(SUM(CASE WHEN table_number != 'RAPIDO' THEN total_amount ELSE 0 END), 0) as dineInSales,
        COUNT(CASE WHEN table_number = 'RAPIDO' THEN 1 END) as takeoutOrders,
        COUNT(CASE WHEN table_number != 'RAPIDO' THEN 1 END) as dineInOrders
      FROM orders
      WHERE status = 'Pagada'
        AND datetime(created_at, 'localtime') >= ?
        AND datetime(created_at, 'localtime') <= ?
    `).get(startDate, endDate) as {
      orderCount: number
      totalSales: number
      takeoutSales: number
      dineInSales: number
      takeoutOrders: number
      dineInOrders: number
    }

    // Pagos registrados asociados a órdenes pagadas
    const paymentRows = db.prepare(`
      SELECT 
        p.payment_method,
        COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE o.status = 'Pagada'
        AND datetime(o.created_at, 'localtime') >= ?
        AND datetime(o.created_at, 'localtime') <= ?
      GROUP BY p.payment_method
    `).all(startDate, endDate) as { payment_method: string; total: number }[]

    let cashPayments = 0
    let cardPayments = 0
    let yapePayments = 0

    for (const p of paymentRows) {
      if (p.payment_method === 'Efectivo') cashPayments = p.total
      else if (p.payment_method === 'Tarjeta') cardPayments = p.total
      else if (p.payment_method === 'Yape/Plin') yapePayments = p.total
    }

    const orderCount = summaryRow?.orderCount || 0
    const totalSales = summaryRow?.totalSales || 0
    const averageTicket = orderCount > 0 ? totalSales / orderCount : 0

    return {
      totalSales,
      orderCount,
      averageTicket,
      cashPayments,
      cardPayments,
      yapePayments,
      dineInSales: summaryRow?.dineInSales || 0,
      takeoutSales: summaryRow?.takeoutSales || 0,
      dineInOrders: summaryRow?.dineInOrders || 0,
      takeoutOrders: summaryRow?.takeoutOrders || 0
    }
  }

  /**
   * Tendencia temporal de ventas (por hora o por día)
   */
  static getSalesTrend(startDate: string, endDate: string, groupBy: 'hour' | 'day' = 'hour'): SalesTrendPoint[] {
    const db = getDatabase()

    if (groupBy === 'hour') {
      const rows = db.prepare(`
        SELECT 
          strftime('%H:00', datetime(created_at, 'localtime')) as label,
          COALESCE(SUM(total_amount), 0) as total,
          COUNT(*) as orders
        FROM orders
        WHERE status = 'Pagada'
          AND datetime(created_at, 'localtime') >= ?
          AND datetime(created_at, 'localtime') <= ?
        GROUP BY label
        ORDER BY label ASC
      `).all(startDate, endDate) as { label: string; total: number; orders: number }[]

      // Si queremos una cuadrícula completa de horas de apertura (ej: 08:00 a 23:00)
      return rows
    } else {
      const rows = db.prepare(`
        SELECT 
          strftime('%Y-%m-%d', datetime(created_at, 'localtime')) as label,
          COALESCE(SUM(total_amount), 0) as total,
          COUNT(*) as orders
        FROM orders
        WHERE status = 'Pagada'
          AND datetime(created_at, 'localtime') >= ?
          AND datetime(created_at, 'localtime') <= ?
        GROUP BY label
        ORDER BY label ASC
      `).all(startDate, endDate) as { label: string; total: number; orders: number }[]

      return rows
    }
  }

  /**
   * Ranking de productos más vendidos
   */
  static getTopProducts(
    startDate: string,
    endDate: string,
    limit = 15,
    categoryId?: string
  ): TopProductItem[] {
    const db = getDatabase()

    let query = `
      SELECT 
        oi.product_id as productId,
        oi.product_name as productName,
        COALESCE(c.name, 'Sin Categoría') as categoryName,
        COALESCE(SUM(oi.quantity), 0) as quantity,
        COALESCE(SUM(oi.final_price), 0) as totalSales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'Pagada'
        AND datetime(o.created_at, 'localtime') >= ?
        AND datetime(o.created_at, 'localtime') <= ?
    `
    const params: any[] = [startDate, endDate]

    if (categoryId && categoryId !== 'all') {
      query += ` AND p.category_id = ? `
      params.push(categoryId)
    }

    query += `
      GROUP BY oi.product_id, oi.product_name
      ORDER BY totalSales DESC
      LIMIT ?
    `
    params.push(limit)

    const rows = db.prepare(query).all(...params) as {
      productId: string
      productName: string
      categoryName: string
      quantity: number
      totalSales: number
    }[]

    const grandTotal = rows.reduce((acc, curr) => acc + curr.totalSales, 0)

    return rows.map(r => ({
      ...r,
      percentageOfTotal: grandTotal > 0 ? (r.totalSales / grandTotal) * 100 : 0
    }))
  }

  /**
   * Desglose de ventas por categoría
   */
  static getCategorySales(startDate: string, endDate: string): CategorySaleItem[] {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT 
        COALESCE(c.id, 'uncategorized') as categoryId,
        COALESCE(c.name, 'Sin Categoría') as categoryName,
        COALESCE(SUM(oi.quantity), 0) as itemCount,
        COALESCE(SUM(oi.final_price), 0) as totalSales
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status = 'Pagada'
        AND datetime(o.created_at, 'localtime') >= ?
        AND datetime(o.created_at, 'localtime') <= ?
      GROUP BY c.id, c.name
      ORDER BY totalSales DESC
    `).all(startDate, endDate) as {
      categoryId: string
      categoryName: string
      itemCount: number
      totalSales: number
    }[]

    const grandTotal = rows.reduce((acc, curr) => acc + curr.totalSales, 0)

    return rows.map(r => ({
      ...r,
      percentageOfTotal: grandTotal > 0 ? (r.totalSales / grandTotal) * 100 : 0
    }))
  }

  /**
   * Auditoría histórica de sesiones de caja
   */
  static getCashierSessionsHistory(startDate: string, endDate: string): CashierSessionAudit[] {
    const db = getDatabase()

    const sessions = db.prepare(`
      SELECT 
        cs.*,
        COALESCE(u.full_name, 'Usuario Desconocido') as userName
      FROM cashier_sessions cs
      LEFT JOIN users u ON cs.user_id = u.id
      WHERE (
        (datetime(cs.opening_time, 'localtime') >= ? AND datetime(cs.opening_time, 'localtime') <= ?)
        OR cs.status = 'Abierta'
      )
      ORDER BY cs.opening_time DESC
    `).all(startDate, endDate) as any[]

    return sessions.map(session => {
      // Calcular totales por método de pago para esta sesión
      const payments = db.prepare(`
        SELECT payment_method, SUM(amount) as total
        FROM payments
        WHERE session_id = ?
        GROUP BY payment_method
      `).all(session.id) as { payment_method: string; total: number }[]

      let cashPayments = 0
      let cardPayments = 0
      let yapePayments = 0

      for (const p of payments) {
        if (p.payment_method === 'Efectivo') cashPayments = p.total
        else if (p.payment_method === 'Tarjeta') cardPayments = p.total
        else if (p.payment_method === 'Yape/Plin') yapePayments = p.total
      }

      // Movimientos de caja (Ingresos y Egresos manuales)
      const movements = db.prepare(`
        SELECT type, amount, description, datetime(timestamp, 'localtime') as timestamp
        FROM cash_movements
        WHERE session_id = ?
        ORDER BY timestamp ASC
      `).all(session.id) as { type: string; amount: number; description: string; timestamp: string }[]

      let manualIncomes = 0
      let manualExpenses = 0

      for (const m of movements) {
        const typeNormalized = (m.type || '').trim().toLowerCase()
        if (typeNormalized === 'ingreso') manualIncomes += m.amount
        else if (typeNormalized === 'egreso') manualExpenses += m.amount
      }

      const expectedCash = session.initial_cash + cashPayments + manualIncomes - manualExpenses
      const actualCash = session.status === 'Cerrada' ? (session.actual_cash ?? expectedCash) : expectedCash
      const difference = session.status === 'Cerrada' ? actualCash - expectedCash : 0

      return {
        id: session.id,
        userId: session.user_id,
        userName: session.userName,
        openingTime: session.opening_time,
        closingTime: session.closing_time,
        initialCash: session.initial_cash,
        expectedCash,
        actualCash,
        difference,
        notes: session.notes,
        status: session.status,
        cashPayments,
        cardPayments,
        yapePayments,
        manualIncomes,
        manualExpenses,
        totalSales: cashPayments + cardPayments + yapePayments,
        movements
      }
    })
  }

  /**
   * Rendimiento y ventas por personal / mozos
   */
  static getStaffSales(startDate: string, endDate: string): StaffSaleItem[] {
    const db = getDatabase()

    const rows = db.prepare(`
      SELECT 
        u.id as userId,
        u.full_name as userName,
        u.role as userRole,
        COUNT(o.id) as orderCount,
        COALESCE(SUM(o.total_amount), 0) as totalSales
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id 
        AND o.status = 'Pagada'
        AND datetime(o.created_at, 'localtime') >= ?
        AND datetime(o.created_at, 'localtime') <= ?
      GROUP BY u.id, u.full_name, u.role
      ORDER BY totalSales DESC
    `).all(startDate, endDate) as {
      userId: string
      userName: string
      userRole: string
      orderCount: number
      totalSales: number
    }[]

    return rows.map(r => ({
      ...r,
      averageTicket: r.orderCount > 0 ? r.totalSales / r.orderCount : 0
    }))
  }

  /**
   * Detalle completo de órdenes para exportación a Excel / CSV
   */
  static getDetailedOrdersForExport(startDate: string, endDate: string): DetailedOrderExportItem[] {
    const db = getDatabase()

    const orders = db.prepare(`
      SELECT 
        o.id,
        o.order_number,
        o.table_number,
        datetime(o.created_at, 'localtime') as created_at,
        datetime(o.closed_at, 'localtime') as closed_at,
        o.status,
        o.total_amount,
        COALESCE(u.full_name, 'Sin Cajero') as cashier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE datetime(o.created_at, 'localtime') >= ?
        AND datetime(o.created_at, 'localtime') <= ?
      ORDER BY o.order_number DESC
    `).all(startDate, endDate) as any[]

    return orders.map(ord => {
      const items = db.prepare(`
        SELECT product_name, quantity, final_price
        FROM order_items
        WHERE order_id = ?
      `).all(ord.id) as { product_name: string; quantity: number; final_price: number }[]

      const payments = db.prepare(`
        SELECT payment_method, amount
        FROM payments
        WHERE order_id = ?
      `).all(ord.id) as { payment_method: string; amount: number }[]

      const paymentMethods = payments.length > 0
        ? payments.map(p => `${p.payment_method}: S/.${p.amount.toFixed(2)}`).join(' | ')
        : 'Pendiente'

      const itemsSummary = items
        .map(i => `${i.quantity}x ${i.product_name} (S/.${i.final_price.toFixed(2)})`)
        .join('; ')

      return {
        orderNumber: ord.order_number,
        tableNumber: ord.table_number === 'RAPIDO' ? 'Pedido Rápido' : `Mesa ${ord.table_number}`,
        createdAt: ord.created_at,
        closedAt: ord.closed_at,
        status: ord.status,
        cashierName: ord.cashier_name,
        totalAmount: ord.total_amount,
        paymentMethods,
        itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0),
        itemsSummary
      }
    })
  }
}
