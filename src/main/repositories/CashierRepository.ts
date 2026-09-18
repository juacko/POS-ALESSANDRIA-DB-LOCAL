import { getDatabase } from '../database/connection'
import { CashierSession, CashMovement, Payment } from '@shared/types/cashier'

export class CashierRepository {
  static getActiveSession(): CashierSession | null {
    const db = getDatabase()
    const session = db.prepare(`
      SELECT cs.*, u.full_name as user_name 
      FROM cashier_sessions cs
      LEFT JOIN users u ON cs.user_id = u.id
      WHERE cs.status = 'Abierta'
      ORDER BY cs.opening_time DESC LIMIT 1
    `).get() as CashierSession | undefined

    if (!session) return null

    // Calcular esperado actual
    const stats = this.calculateSessionTotals(session.id, session.initial_cash)
    return {
      ...session,
      expected_cash: stats.expected_cash
    }
  }

  static openSession(userId: string, initialCash: number): CashierSession {
    const db = getDatabase()
    const active = this.getActiveSession()
    if (active) {
      throw new Error('Ya existe una sesión de caja abierta.')
    }

    const id = `cs-${Date.now()}`
    const stmt = db.prepare(`
      INSERT INTO cashier_sessions (id, user_id, initial_cash, expected_cash, actual_cash, status)
      VALUES (?, ?, ?, ?, ?, 'Abierta')
    `)
    stmt.run(id, userId, initialCash, initialCash, initialCash)

    return this.getActiveSession()!
  }

  static closeSession(sessionId: string, actualCash: number, notes?: string): CashierSession {
    const db = getDatabase()
    const session = db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').get(sessionId) as CashierSession
    if (!session) throw new Error('Sesión de caja no encontrada.')

    const totals = this.calculateSessionTotals(sessionId, session.initial_cash)

    db.prepare(`
      UPDATE cashier_sessions 
      SET closing_time = CURRENT_TIMESTAMP, 
          expected_cash = ?, 
          actual_cash = ?, 
          notes = ?, 
          status = 'Cerrada'
      WHERE id = ?
    `).run(totals.expected_cash, actualCash, notes || '', sessionId)

    return db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').get(sessionId) as CashierSession
  }

  static addMovement(sessionId: string, type: 'Ingreso' | 'Egreso', amount: number, description: string): CashMovement {
    const db = getDatabase()
    const id = `cm-${Date.now()}`
    db.prepare(`
      INSERT INTO cash_movements (id, session_id, type, amount, description)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, sessionId, type, amount, description)

    return db.prepare('SELECT * FROM cash_movements WHERE id = ?').get(id) as CashMovement
  }

  static getMovements(sessionId: string): CashMovement[] {
    const db = getDatabase()
    return db.prepare(`
      SELECT * FROM cash_movements WHERE session_id = ? ORDER BY timestamp DESC
    `).all(sessionId) as CashMovement[]
  }

  static calculateSessionTotals(sessionId: string, initialCash: number) {
    const db = getDatabase()

    // 1. Pagos por método
    const payments = db.prepare(`
      SELECT payment_method, SUM(amount) as total
      FROM payments
      WHERE session_id = ?
      GROUP BY payment_method
    `).all(sessionId) as { payment_method: string; total: number }[]

    let cashPayments = 0
    let cardPayments = 0
    let yapePayments = 0

    for (const p of payments) {
      if (p.payment_method === 'Efectivo') cashPayments = p.total
      else if (p.payment_method === 'Tarjeta') cardPayments = p.total
      else if (p.payment_method === 'Yape/Plin') yapePayments = p.total
    }

    // 2. Movimientos de caja
    const movements = db.prepare(`
      SELECT type, SUM(amount) as total
      FROM cash_movements
      WHERE session_id = ?
      GROUP BY type
    `).all(sessionId) as { type: string; total: number }[]

    let manualIncomes = 0
    let manualExpenses = 0

    for (const m of movements) {
      if (m.type === 'Ingreso') manualIncomes = m.total
      else if (m.type === 'Egreso') manualExpenses = m.total
    }

    const expected_cash = initialCash + cashPayments + manualIncomes - manualExpenses

    return {
      initialCash,
      cashPayments,
      cardPayments,
      yapePayments,
      manualIncomes,
      manualExpenses,
      expected_cash,
      totalSales: cashPayments + cardPayments + yapePayments
    }
  }
}
